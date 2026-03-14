import { ZodError } from "zod";
import validator from "validator";
import prisma from "../models/prisma.js";
import { JwtUtils } from "../utils/jwt.js";
import { CaptchaUtils } from "../utils/captcha-cache.js";
import { RsaUtils } from "../utils/rsa.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";
import config from "../config/index.js";
import { MailUtils } from "../utils/mail.js";
import { strategyProvider } from "../strategies/auth/strategy.provider.js";
import { AppError } from "../utils/app-error.js";
import type { LoginParams, LoginResult } from "../types/auth.types.js";

/**
 * 身份认证服务
 * 包含登录核心业务流程（11 步深度校验）
 */
export class AuthService {
  /**
   * 用户登录逻辑 (企业级重构版)
   * @param params 类型安全的登录参数
   */
  static async login(params: LoginParams): Promise<LoginResult> {
    try {
      // 1. 根据 loginType 获取对应的登录策略
      const loginType = params.loginType || "account";
      const strategy = strategyProvider.getStrategy(loginType);

      // 提取原始标识符 (username/email) 用于 Redis 锁定跟踪
      const identifier =
        params.username || params.email || params.identifier || "unknown";
      const lockKey = JwtUtils.getLockKey(identifier);
      const attemptKey = JwtUtils.getAttemptKey(identifier);

      logger.debug({ loginType, identifier }, "Login attempt started");

      // 2. 账号锁定预检查
      const isLocked = await redis.get(lockKey);
      if (isLocked) {
        throw AppError.forbidden(
          "账号因多次尝试登录已被锁定，请 15 分钟后再试",
          "ACCOUNT_LOCKED",
        );
      }

      // 3. 校验参数 (使用策略专属 Zod Schema)
      let validatedData = strategy.validate(params);

      // 4. 动态验证码校验 (可通过配置开关)
      if (config.auth.captcha_enabled) {
        const { captchaId, captchaCode } = params;
        if (!captchaId || !captchaCode) {
          throw AppError.badRequest("请提供验证码参数", "CAPTCHA_REQUIRED");
        }
        const isCaptchaValid = await CaptchaUtils.verify(
          captchaId,
          captchaCode,
        );
        if (!isCaptchaValid) {
          logger.warn(`Login failed: Invalid captcha for [${loginType}]`);
          throw AppError.badRequest(
            "验证码已失效或填写错误",
            "CAPTCHA_INVALID",
          );
        }
      }

      // 5. RSA 解密密码
      if (
        validatedData.password &&
        typeof validatedData.password === "string"
      ) {
        validatedData.password = await RsaUtils.decrypt(validatedData.password);
      }

      // 6. XSS 清洗（对身份识别字段进行转义）
      const idFields = ["username", "email", "nickname"] as const;
      for (const field of idFields) {
        const value = (validatedData as Record<string, unknown>)[field];
        if (value && typeof value === "string") {
          (validatedData as Record<string, string>)[field] = validator.escape(
            value.trim(),
          );
        }
      }

      // 7. 校验登录方式是否已启用
      if (!config.auth.login_methods[loginType as keyof typeof config.auth.login_methods]) {
        logger.warn(`Login blocked: Method [${loginType}] is disabled`);
        throw AppError.forbidden(
          `系统暂未开启${loginType === "email" ? "邮箱" : "账号"}登录方式`,
          "LOGIN_METHOD_DISABLED",
        );
      }

      // 8. 多策略身份识别
      await strategy.preCheck(validatedData);
      const user = await strategy.findUser(validatedData);

      if (!user) {
        logger.warn(`Login failed: User not found via [${loginType}]`);
        throw AppError.unauthorized(
          "密码错误或用户不存在",
          "USER_NOT_FOUND",
        );
      }

      // 9. 校验账号状态
      if (user.status !== "0") {
        logger.warn(`Login blocked: User is disabled [${user.username}]`);
        throw AppError.forbidden("该账号已被停用", "ACCOUNT_DISABLED");
      }

      // 10. 校验凭证 + 锁定逻辑
      const isCredentialsValid = await strategy.verify(user, validatedData);

      if (!isCredentialsValid) {
        // 增加失败尝试计数
        const attempts = await redis.incr(attemptKey);
        if (attempts === 1) await redis.expire(attemptKey, 300);

        if (attempts >= 5) {
          await redis.setex(lockKey, 900, "1");
          await redis.del(attemptKey);

          logger.warn(
            `Security: Account [${identifier}] locked due to too many failures.`,
          );

          // 异步发送安全告警邮件（不阻塞主流程）
          if (user.email) {
            MailUtils.sendMail(
              user.email,
              "【安全警报】账号已被锁定",
              `<p>您好 ${user.nickname || user.username}，</p>
               <p>检测到您的账号在短时间内有多次失败的尝试登录记录。为了保护您的账号安全，该账号已被暂时锁定 15 分钟。</p>
               <p><b>操作 IP:</b> ${params.clientIp}</p>
               <p><b>时间:</b> ${new Date().toLocaleString()}</p>
               <p>如果这不是您的操作，请及时修改密码并检查账号安全状况。</p>`,
            ).catch((e) =>
              logger.error("Failed to send security alert email", e),
            );
          }

          throw AppError.forbidden(
            "密码错误次数过多，账号已锁定 15 分钟",
            "ACCOUNT_LOCKED_BY_ATTEMPTS",
          );
        }

        logger.warn(
          `Login failed: Invalid credentials for [${user.username}] via [${loginType}] (Attempt: ${attempts})`,
        );
        throw AppError.unauthorized("用户名或密码错误", "INVALID_CREDENTIALS");
      }

      // 登录成功，清除失败计数
      await redis.del(attemptKey);

      // 11. 生成双 Token
      const accessToken = JwtUtils.signAccessToken({
        userId: user.id,
        username: user.username,
      });

      const refreshToken = JwtUtils.signRefreshToken({
        userId: user.id,
        username: user.username,
      });

      // 将 Refresh Token JTI 存入 Redis（用于后续校验和主动撤销）
      const refreshDecoded = JwtUtils.decode(refreshToken);
      if (refreshDecoded?.jti) {
        const refreshKey = JwtUtils.getRefreshKey(user.id, refreshDecoded.jti);
        await redis.setex(refreshKey, 7 * 24 * 60 * 60, "1"); // 7 天过期
      }

      // 更新登录记录
      prisma.user
        .update({
          where: { id: user.id },
          data: {
            loginDate: new Date(),
            loginIp: params.clientIp,
            loginUserAgent: params.userAgent,
          },
        })
        .catch((err: unknown) =>
          logger.error(err as Error, "Failed to update login status"),
        );

      logger.info(
        `User logged in success! Mode: ${loginType}, User: ${user.username}`,
      );

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
        },
      };
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const firstError = err.issues[0]?.message || "参数校验失败";
        throw AppError.badRequest(firstError, "VALIDATION_ERROR");
      }
      throw err;
    }
  }
}

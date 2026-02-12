import { z, ZodError } from "zod";
import validator from "validator";
import prisma from "../models/prisma.js";
import { CryptoUtils } from "../utils/crypto.js";
import { JwtUtils } from "../utils/jwt.js";
import { CaptchaUtils } from "../utils/captcha-cache.js";
import { RsaUtils } from "../utils/rsa.js";
import redis from "../utils/redis.js"; // 注意由于是默认导出，不加括号
import logger from "../utils/logger.js";
import config from "../config/index.js";
import { MailUtils } from "../utils/mail.js";
import { strategyProvider } from "../strategies/auth/strategy.provider.js";

/**
 * 身份认证服务
 */
export class AuthService {
  /**
   * 用户登录逻辑 (深度审计重构版)
   * @param params 原始请求参数
   */
  static async login(params: Record<string, any>) {
    try {
      // 1. 提取标识符 (用于限流和锁定预检)
      const loginType = (params.loginType ||
        "account") as keyof typeof config.auth.login_methods;
      const strategy = strategyProvider.getStrategy(loginType);

      // 提取原始标识符 (username/email) 用于 Redis 锁定跟踪
      const identifier = (params.username ||
        params.email ||
        params.identifier ||
        "unknown") as string;
      const lockKey = JwtUtils.getLockKey(identifier);
      const attemptKey = JwtUtils.getAttemptKey(identifier);

      // 2. 账号锁定预检查
      const isLocked = await redis.get(lockKey);
      if (isLocked) {
        throw {
          status: 403,
          message: "账号因多次尝试登录已被锁定，请 15 分钟后再试",
        };
      }

      // 3. 校验参数 (使用策略专属 Schema)
      let validatedData = strategy.validate(params);

      // 3. 通用安全检查：动态验证码校验
      if (config.auth.captcha_enabled) {
        const { captchaId, captchaCode } = params;
        if (!captchaId || !captchaCode) {
          throw { status: 400, message: "请提供验证码参数" };
        }
        const isCaptchaValid = await CaptchaUtils.verify(
          captchaId,
          captchaCode,
        );
        if (!isCaptchaValid) {
          logger.warn(`Login failed: Invalid captcha for [${loginType}]`);
          throw { status: 400, message: "验证码已失效或填写错误" };
        }
      }

      // 4. 输入安全预处理
      // 如果存在 password 字段且是字符串，执行 RSA 解密
      if (
        validatedData.password &&
        typeof validatedData.password === "string"
      ) {
        validatedData.password = RsaUtils.decrypt(validatedData.password);
      }

      // 5. 对身份识别字段进行 XSS 清洗
      const idFields = ["username", "email", "nickname"];
      for (const field of idFields) {
        if (validatedData[field] && typeof validatedData[field] === "string") {
          validatedData[field] = validator.escape(validatedData[field].trim());
        }
      }

      // 6. 校验登录方式是否已启用
      if (!config.auth.login_methods[loginType]) {
        logger.warn(`Login blocked: Method [${loginType}] is disabled`);
        throw {
          status: 403,
          message: `系统暂未开启${
            loginType === "email" ? "邮箱" : "账号"
          }登录方式`,
        };
      }

      // 7. 多策略身份识别
      await strategy.preCheck(validatedData);
      const user = await strategy.findUser(validatedData);

      if (!user) {
        logger.warn(`Login failed: User not found via [${loginType}]`);
        throw { status: 401, message: "密码错误或用户不存在" };
      }

      // 8. 校验账号状态
      if (user.status !== "0") {
        logger.warn(`Login blocked: User is disabled [${user.username}]`);
        throw { status: 403, message: "该账号已被停用" };
      }

      // 9. 校验凭证与锁定逻辑 (解耦调用)
      const isCredentialsValid = await strategy.verify(user, validatedData);

      if (!isCredentialsValid) {
        // 增加失败尝试计数
        const attempts = await redis.incr(attemptKey);
        if (attempts === 1) await redis.expire(attemptKey, 300); // 5分钟有效期

        if (attempts >= 5) {
          await redis.setex(lockKey, 900, "1"); // 锁定 15 分钟
          await redis.del(attemptKey);

          logger.warn(
            `Security: Account [${identifier}] locked due to too many failures.`,
          );

          // 触发邮件预警 (异步发送，不阻塞主流程)
          if (user.email) {
            MailUtils.sendMail(
              user.email,
              "【安全警报】账号已被锁定",
              `<p>您好 ${user.nickname || user.username}，</p>
               <p>检测到您的账号在短时间内有多次失败的尝试登录记录。为了保护您的账号安全，该账号已被暂时锁定 15 分钟。</p>
               <p><b>操作 IP:</b> ${params.clientIp || "Unknown"}</p>
               <p><b>时间:</b> ${new Date().toLocaleString()}</p>
               <p>如果这不是您的操作，请及时修改密码并检查账号安全状况。</p>`,
            ).catch((e) =>
              logger.error("Failed to send security alert email", e),
            );
          }

          throw {
            status: 403,
            message: "密码错误次数过多，账号已锁定 15 分钟",
          };
        }

        logger.warn(
          `Login failed: Invalid credentials for [${user.username}] via [${loginType}] (Attempt: ${attempts})`,
        );
        throw { status: 401, message: "用户名或密码错误" };
      }

      // 登录成功，清除缓存计数
      await redis.del(attemptKey);

      // 10. 生成 Token
      const token = JwtUtils.sign({
        userId: user.id,
        username: user.username,
      });

      // 11. 更新登录记录 (增加 User-Agent 追踪)
      await prisma.user
        .update({
          where: { id: user.id },
          data: {
            loginDate: new Date(),
            loginIp: params.clientIp || "0.0.0.0",
            loginUserAgent: params.userAgent || "Unknown",
          } as any,
        })
        .catch((err: any) =>
          logger.error("Failed to update login status", err),
        );

      logger.info(
        `User logged in success! Mode: ${loginType}, User: ${user.username}`,
      );

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
        },
      };
    } catch (err: any) {
      if (err instanceof ZodError) {
        const firstError = err.issues[0]?.message || "参数校验失败";
        throw { status: 400, message: firstError };
      }
      throw err;
    }
  }
}

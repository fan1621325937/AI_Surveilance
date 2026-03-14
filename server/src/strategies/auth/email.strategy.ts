import { z } from "zod";
import { type User } from "@prisma/client";
import prisma from "../../models/prisma.js";
import { BaseLoginStrategy, type ValidatedLoginData } from "./base.strategy.js";
import { CryptoUtils } from "../../utils/crypto.js";
import validator from "validator";
import { AppError } from "../../utils/app-error.js";

/**
 * 邮箱密码登录策略
 */
export class EmailLoginStrategy extends BaseLoginStrategy {
  readonly name = "email";

  /** 校验参数：要求 email/username + password */
  validate(params: unknown): ValidatedLoginData {
    const schema = z
      .object({
        email: z.string().optional(),
        username: z.string().optional(),
        password: z.string().min(1, "密码不能为空"),
      })
      .refine((data) => data.email || data.username, {
        message: "邮箱地址不能为空",
        path: ["email"],
      });

    const parsed = schema.parse(params);
    const identifier = (parsed.email || parsed.username) as string;

    // 二次显式校验邮箱格式
    if (!validator.isEmail(identifier)) {
      throw AppError.badRequest("请输入有效的邮箱地址", "INVALID_EMAIL_FORMAT");
    }

    return {
      email: identifier,
      password: parsed.password,
    };
  }

  /** 根据邮箱查找用户 */
  async findUser(data: ValidatedLoginData): Promise<User | null> {
    if (!data.email) return null;
    return prisma.user.findUnique({
      where: { email: data.email },
    });
  }

  /** 使用 Argon2 验证密码哈希 */
  async verify(user: User, data: ValidatedLoginData): Promise<boolean> {
    if (!data.password) return false;
    return CryptoUtils.verify(user.password, data.password);
  }
}

import { z } from "zod";
import { type User } from "@prisma/client";
import prisma from "../../models/prisma.js";
import { BaseLoginStrategy } from "./base.strategy.js";
import { CryptoUtils } from "../../utils/crypto.js";
import validator from "validator";

/**
 * 邮箱登录策略
 */
export class EmailLoginStrategy extends BaseLoginStrategy {
  readonly name = "email";

  validate(params: any) {
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

    // 二次显式校验邮箱格式 (如果策略库需要更严谨)
    if (!validator.isEmail(identifier)) {
      throw { status: 400, message: "请输入有效的邮箱地址" };
    }

    return {
      email: identifier,
      password: parsed.password,
    };
  }
  // 根据邮箱查找用户
  async findUser(data: { email: string }): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: data.email },
    });
  }
  // 验证密码
  async verify(user: User, data: { password?: string }): Promise<boolean> {
    if (!data.password) return false;
    return CryptoUtils.verify(user.password, data.password);
  }
}

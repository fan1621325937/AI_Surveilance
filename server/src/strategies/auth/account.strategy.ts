import { z } from "zod";
import { type User } from "@prisma/client";
import prisma from "../../models/prisma.js";
import { BaseLoginStrategy, type ValidatedLoginData } from "./base.strategy.js";
import { CryptoUtils } from "../../utils/crypto.js";

/**
 * 账号密码登录策略
 */
export class AccountLoginStrategy extends BaseLoginStrategy {
  readonly name = "account";

  /** 校验参数：要求 username/identifier + password */
  validate(params: unknown): ValidatedLoginData {
    const schema = z
      .object({
        username: z.string().optional(),
        identifier: z.string().optional(),
        password: z.string().min(1, "密码不能为空"),
      })
      .refine((data) => data.username || data.identifier, {
        message: "用户名不能为空",
        path: ["username"],
      });

    const parsed = schema.parse(params);
    const username = parsed.username || parsed.identifier || "";
    return {
      username,
      password: parsed.password,
    };
  }

  /** 根据用户名查找用户 */
  async findUser(data: ValidatedLoginData): Promise<User | null> {
    if (!data.username) return null;
    return prisma.user.findUnique({
      where: { username: data.username },
    });
  }

  /** 使用 Argon2 验证密码哈希 */
  async verify(user: User, data: ValidatedLoginData): Promise<boolean> {
    if (!data.password) return false;
    return CryptoUtils.verify(user.password, data.password);
  }
}

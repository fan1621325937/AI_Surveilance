import { z } from "zod";
import { type User } from "@prisma/client";
import prisma from "../../models/prisma.js";
import { BaseLoginStrategy } from "./base.strategy.js";
import { CryptoUtils } from "../../utils/crypto.js";

/**
 * 账号登录策略
 */
export class AccountLoginStrategy extends BaseLoginStrategy {
  readonly name = "account";

  validate(params: any) {
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
    return {
      username: parsed.username || parsed.identifier,
      password: parsed.password,
    };
  }

  async findUser(data: { username: string }): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username: data.username },
    });
  }

  async verify(user: User, data: { password?: string }): Promise<boolean> {
    if (!data.password) return false;
    return CryptoUtils.verify(user.password, data.password);
  }
}

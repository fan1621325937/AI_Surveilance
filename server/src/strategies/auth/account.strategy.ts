import { z } from "zod"; // Zod 是一个类型安全的 JSON 解析器
import { type User } from "@prisma/client";
import prisma from "../../models/prisma.js";
import { BaseLoginStrategy } from "./base.strategy.js";
import { CryptoUtils } from "../../utils/crypto.js";

/**
 * 账号登录策略
 */
export class AccountLoginStrategy extends BaseLoginStrategy {
  readonly name = "account";
  // 校验参数
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
  // 根据用户名查找用户
  async findUser(data: { username: string }): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username: data.username },
    });
  }
  // 验证密码
  async verify(user: User, data: { password?: string }): Promise<boolean> {
    if (!data.password) return false;
    return CryptoUtils.verify(user.password, data.password);
  }
}
// Zod使用说明
// z.object({})表示校验对象
// z.string().optional()表示字符串且可选
// z.string().min(1, "密码不能为空")表示字符串且最小长度为1，否则报错
// .refine((data) => data.username || data.identifier, {
//   message: "用户名不能为空",
//   path: ["username"],
// })表示校验username或identifier
// schema.parse(params)表示解析参数

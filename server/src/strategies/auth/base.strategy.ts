import { type User } from "@prisma/client";
import prisma from "../../models/prisma.js";

/**
 * 登录策略返回结果接口
 */
export interface LoginStrategyResult {
  user: User;
}

/**
 * 登录策略抽象基类
 * 所有的登录模式（账号、邮箱、手机号等）都必须继承此类
 */
export abstract class BaseLoginStrategy {
  /**
   * 策略标识名
   */
  abstract readonly name: string;

  /**
   * 核心逻辑：从清洗后的数据中提取身份标识并查找用户
   * @param data 经过 validate 方法校验并清洗后的数据
   */
  abstract findUser(data: any): Promise<User | null>;

  /**
   * 校验与清洗参数
   * 各策略根据自身需求定义 Zod Schema
   * @param params 原始请求参数
   */
  abstract validate(params: any): any;

  /**
   * 钩子：执行特定策略的预检查
   */
  async preCheck(data: any): Promise<void> {
    // 默认不执行额外检查
  }

  /**
   * 核心逻辑：验证凭证合法性 (解耦点)
   * 各策略可自定义校验逻辑：如密码比对、验证码比对等
   * @param user 数据库中的用户对象
   * @param data 校验所需的凭证数据
   */
  abstract verify(user: User, data: any): Promise<boolean>;
}

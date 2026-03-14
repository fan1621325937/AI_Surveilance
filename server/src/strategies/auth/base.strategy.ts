import { type User } from "@prisma/client";

/**
 * 登录策略返回结果接口
 */
export interface LoginStrategyResult {
  user: User;
}

/**
 * 经过各策略 validate 后的统一数据结构
 * 每个策略按需实现具体的字段
 */
export interface ValidatedLoginData {
  username?: string;
  email?: string;
  password: string;
  [key: string]: unknown;
}

/**
 * 登录策略抽象基类
 * 所有的登录模式（账号、邮箱、手机号等）都必须继承此类
 *
 * 扩展新登录方式只需 3 步：
 * 1. 创建新策略类继承 BaseLoginStrategy
 * 2. 实现 validate()、findUser()、verify() 三个抽象方法
 * 3. 在 strategy.provider.ts 中 register() 注册
 */
export abstract class BaseLoginStrategy {
  /** 策略标识名 (如 'account', 'email') */
  abstract readonly name: string;

  /**
   * 校验与清洗请求参数
   * 各策略根据自身需求定义 Zod Schema
   */
  abstract validate(params: unknown): ValidatedLoginData;

  /**
   * 核心逻辑：从清洗后的数据中查找用户
   */
  abstract findUser(data: ValidatedLoginData): Promise<User | null>;

  /**
   * 钩子：执行特定策略的预检查（默认空实现）
   */
  async preCheck(_data: ValidatedLoginData): Promise<void> {
    // 子类可覆盖以实现额外检查
  }

  /**
   * 核心逻辑：验证凭证合法性
   */
  abstract verify(user: User, data: ValidatedLoginData): Promise<boolean>;
}

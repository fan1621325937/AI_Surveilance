import { BaseLoginStrategy } from "./base.strategy.js";
import { AccountLoginStrategy } from "./account.strategy.js";
import { EmailLoginStrategy } from "./email.strategy.js";
import { AppError } from "../../utils/app-error.js";

/**
 * 登录策略工厂容器
 * 负责收集、存储和分发所有已注册的登录策略
 *
 * 使用方式：strategyProvider.getStrategy('account') → AccountLoginStrategy
 */
class LoginStrategyProvider {
  private strategies: Map<string, BaseLoginStrategy> = new Map();

  constructor() {
    // 注册默认策略
    this.register(new AccountLoginStrategy());
    this.register(new EmailLoginStrategy());
  }

  /** 注册新策略 */
  register(strategy: BaseLoginStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  /** 获取匹配的策略实例 */
  getStrategy(name: string): BaseLoginStrategy {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw AppError.forbidden(
        `系统暂未配置 [${name}] 登录方式`,
        "STRATEGY_NOT_FOUND",
      );
    }
    return strategy;
  }
}

export const strategyProvider = new LoginStrategyProvider();

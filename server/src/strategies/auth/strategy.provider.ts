import { BaseLoginStrategy } from "./base.strategy.js";
import { AccountLoginStrategy } from "./account.strategy.js";
import { EmailLoginStrategy } from "./email.strategy.js";

/**
 * 登录策略工厂容器
 * 负责收集、存储和分发所有已注册的登录模式
 */
class LoginStrategyProvider {
  private strategies: Map<string, BaseLoginStrategy> = new Map();

  constructor() {
    // 默认注册现有的策略
    this.register(new AccountLoginStrategy());
    this.register(new EmailLoginStrategy());
  }

  /**
   * 注册新策略
   * @param strategy 登录策略实例
   */
  register(strategy: BaseLoginStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * 获取匹配策略
   * @param name 策略名称 (如 'account', 'email')
   */
  getStrategy(name: string): BaseLoginStrategy {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw { status: 403, message: `系统暂未配置 [${name}] 登录方式` };
    }
    return strategy;
  }
}

export const strategyProvider = new LoginStrategyProvider();

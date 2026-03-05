# Ai Surveillance Web (企业级智能监控前端)

本项目是 AI 视频监控系统的 Web 客户端，基于 **React 19 + Vite 7 + shadcn/ui** 构建，具备高性能、现代化视觉体验与金融级安全保障。

---

## ✨ 核心特性

- **现代视觉系统**: 基于 **Tailwind CSS v4** 的 CSS-first 架构，集成 **shadcn/ui** 深度定制的高质感组件。
- **全链路安全防护**:
  - **RSA-OAEP (SHA-256)**: 密码提交前通过浏览器原生的 **Web Crypto API** 进行非对称加密。
  - **HttpOnly Cookie**: JWT 透明传输，原生防御 XSS。
- **高性能数据管理**: 使用 **TanStack Query (v5)** 实现数据的智能缓存、预取与自动同步。
- **企业级工程化**: 严格的 TypeScript 校验（Strict Mode）、自动化 Lint、以及数据路由模式。

---

## 🛠️ 技术栈

- **Core**: React 19 (Experimental features ready)
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **UI Framework**: shadcn/ui + Radix UI
- **Routing**: React Router v7+
- **State**: Zustand (Store-based architecture)
- **Networking**: Axios + TanStack Query v5

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制 `.env.example` 为 `.env` 并设置 API 基础路径：

```env
VITE_API_BASE_URL=/api
```

### 3. 本地开发

```bash
npm run dev
```

---

## 🏗️ 目录结构

```text
src/
├── main.tsx        # React 根骨架：注入 QueryProvider, Toaster 等全局服务
├── App.tsx         # 全局顶层容器
├── router/         # 路由配置机：通过 createBrowserRouter 定义路由与鉴权守卫 (AuthGuard)
├── layouts/        # 布局骨架层：系统的 UI 大框架骨架 (如 MainLayout, 各种菜单导航)
├── pages/          # 页面级容器：与 Router 绑定的核心容器，负责组合 Component 与远端数据拉取
├── components/     # 组件库层 (无状态/弱状态)：高度独立可复用的 UI 单元 (UI 库、图表封装等)
├── hooks/          # 自定义 Hooks 层：封装复杂的 React 渲染副作用逻辑
├── store/          # 客户端状态库 (Zustand)：存放全局共享状态 (如 UserInfo, Theme 等)
├── api/            # 接口定义层：Axios 实例配置，统一聚合管理远端 RESTful API 请求
├── lib/            # 第三方库桥接层：对外界库进行统一暴露或覆写 (如 shadcn 的工具库、QueryClient)
├── utils/          # 纯函数层：完全脱离 React 生命周期的通用 js 转换方法 (Crypto加密, 字符处理等)
└── assets/         # 静态资源层：直接参与 Vite 编译链的图片资源与全局基础 CSS
```

> **💡 前端组件拆分黄金法则 (Separation of Concerns)**:
> 区分**容器组件** ("聪明的", `pages`) 和**木偶组件** ("笨的", `components`)。
> `components` 不应该主动发起请求获取存库数据，而是通过 `props` 接收并渲染。重型异步数据流应上浮到 `pages` 层使用 React Query 管理。

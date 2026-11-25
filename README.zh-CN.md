# dsh-hero-animation

DeepSeek Harness 新对话（欢迎页）上的彩色胶囊粒子动效。

[English](./README.md)

## 它做什么

注册到 `conversation.hero.frame` 插槽，在新对话页内容背后绘制 84 颗彩色胶囊：
同心波呼吸、跟随指针偏移、沿七色调色板变色。画布为
`position: fixed; inset: 0; z-index: -1; pointer-events: none`，
不拦截任何点击或键盘输入。

纯 Canvas 2D 实现，不使用 WebGL，除 React 外无依赖。

## 安装

```sh
dsh plugin --profile <profile> add github:FRRR145/dsh-hero-animation
```

或从本地目录：

```sh
dsh plugin --profile <profile> add link:/绝对路径/dsh-hero-animation
```

装完需要重启宿主：客户端 bundle 只在启动时加载。

## 兼容性

- 需要带 `conversation.hero.frame` 插槽的 DeepSeek Harness 0.2.x
  （该插槽由 `@deepseek-ai/dsh-client-ui-conversation` 声明，类型 `hoc`）。
- 在 DSH `0.2.2-rc.5` 上验证通过。上游若改动插槽契约，组件不会挂载，
  它不会修改任何全局状态。

## 实现要点

| 部分 | 说明 |
|---|---|
| 插槽 | `conversation.hero.frame`，注册 id `hero-animation` |
| 渲染 | Canvas 2D，单 `requestAnimationFrame` 循环，卸载时停止 |
| 尺寸 | 跟随 `devicePixelRatio`，上限 2 |
| 输入 | `pointermove` / `resize`，卸载时移除 |
| 视觉 | 84 颗胶囊、7 色调色板、波动 + 指针力场扰动 |

## 许可

MIT

# Lottie Preview 工具

一个功能强大的 Lottie 动画预览和优化工具，基于 Vue 3 + Vite 构建。

## ✨ 主要功能

- 🎬 **实时预览**：上传 Lottie JSON 文件即时预览动画效果
- 🖼️ **图片替换**：支持替换动画中的图片资源，实时查看效果
- 🔧 **矢量优化**：自动检测并修复图片替换后的矢量图形过度嵌套问题
- 📦 **文件优化**：将 Base64 图片转换为外部引用，大幅减小文件大小（可减少 80-95%）
- 💾 **批量导出**：一键导出所有图片资源和优化后的 JSON 文件
- 🐛 **兼容性修复**：自动修复 null keyframes 导致的 iOS/Android 崩溃问题

## 🚀 快速开始

### 安装依赖

```sh
pnpm install
```

### 启动开发服务器

```sh
pnpm dev
```

### 生产构建

```sh
pnpm build
```

## 📂 项目结构

核心代码结构经过模块化重构，主要包含以下部分：

- [src/views/Home.vue](src/views/Home.vue): **页面骨架 + 文件处理**
  - 负责顶层状态管理、文件拖拽上传逻辑、核心数据（JSON/图片）的分发与协调。
- [src/components/LottiePlayer.vue](src/components/LottiePlayer.vue): **左侧播放器组件**
  - 负责 Lottie 动画的渲染、播放控制（暂停/重播/首帧）、进度条交互、动画信息展示及帧保存功能。
- [src/components/ImageResourceList.vue](src/components/ImageResourceList.vue): **右侧资源列表组件**
  - 负责展示动画中包含的图片资源列表、提供单张图片下载入口以及触发图片替换操作。

## 📖 Lottie 文件优化指南

从 BodyMovin 导出的 Lottie 文件通常很大且包含冗余数据（如内嵌 Base64 图片）。本工具提供了一站式优化方案。

### 核心优化流程

1. **上传预览**：拖拽 JSON 文件到工具中。
2. **替换资源**（可选）：如需修改图片，使用右侧列表的"替换图片"功能（工具会自动修复 AE 导出时的矢量嵌套问题）。
3. **导出资源**：
   - 点击 **"导出所有图片"**：获取所有引用的图片文件（PNG/JPG）。
   - 点击 **"下载优化版本"**：获取体积更小的 JSON 文件（Base64 已转为外部引用）。
4. **项目集成**：将导出的 JSON 和 `images/` 文件夹放入你的项目中。

### 优化效果对比

以"双11首页弹窗.json"为例：

| 项目         | 原始大小 (Base64) | 优化后 (外部引用)              | 配合图片压缩     |
| :----------- | :---------------- | :----------------------------- | :--------------- |
| **文件体积** | ~337KB            | ~15KB (JSON) + ~150KB (Images) | **~75KB (总计)** |
| **减少比例** | -                 | **51%**                        | **78%**          |

### 常见问题 (FAQ)

- **Q: 优化后的文件在网页上无法显示图片？**
  - A: 确保 `images/` 文件夹与 JSON 文件在同一目录，且服务器允许访问图片路径。
- **Q: 可以使用 CDN 托管图片吗？**
  - A: 可以！只需修改 JSON 文件中的 `u` 字段为 CDN URL 即可（例如 `"u": "https://cdn.example.com/images/"`）。
- **Q: 替换图片后出现重影或显示异常？**
  - A: 这是矢量图形过度嵌套导致的。本工具内置了智能矢量优化功能，会自动检测并修复此问题，恢复原始矢量结构。

## 🛠️ 推荐开发环境

- **IDE**: [VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- **浏览器**: Chrome / Edge + [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)

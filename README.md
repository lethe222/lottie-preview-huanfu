# Lottie Preview 工具

一个功能强大的 Lottie 动画预览和优化工具，基于 Vue 3 + Vite 构建。

## 主要功能

- 🎬 **实时预览**：上传 Lottie JSON 文件即时预览动画效果
- 🖼️ **图片替换**：支持替换动画中的图片资源，实时查看效果
- 🔧 **矢量优化**：自动检测并修复图片替换后的矢量图形过度嵌套问题
- 📦 **文件优化**：将 Base64 图片转换为外部引用，大幅减小文件大小（可减少 80-95%）
- 💾 **批量导出**：一键导出所有图片资源和优化后的 JSON 文件
- 🐛 **兼容性修复**：自动修复 null keyframes 导致的 iOS/Android 崩溃问题

## 快速开始

### 项目设置

```sh
pnpm install
```

### 开发模式

```sh
pnpm dev
```

### 生产构建

```sh
pnpm build
```

## 推荐开发环境

### IDE 设置

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (需禁用 Vetur)

### 浏览器设置

- Chromium 系浏览器 (Chrome, Edge, Brave 等):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [开启 Custom Object Formatter](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [开启 Custom Object Formatter](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Lottie 文件优化指南

### 问题分析

从 BodyMovin 导出的 Lottie 文件通常会很大，主要原因是：

1. **Base64 图片嵌入**：所有图片资源都以 Base64 格式直接嵌入到 JSON 文件中
2. **未压缩的图片**：图片可能没有经过优化压缩
3. **冗余数据**：可能包含一些不必要的元数据
4. **矢量过度嵌套**：替换图片后可能导致矢量图形结构复杂化（24 个嵌套组 + 25 个路径）

### 优化方案

#### 方案一：使用工具的"下载优化版本"功能（推荐）

这是最简单的方法：

1. 在工具中上传你的 Lottie 文件
2. 点击 **"下载优化版本"** 按钮（橙色按钮）
3. 系统会自动：
   - 将 Base64 图片转换为外部引用
   - 生成优化后的 JSON 文件
   - 显示优化前后的大小对比

**优化效果**：通常可以减少 **80-95%** 的文件大小！

**注意事项**：

- 优化后的文件会将图片引用改为 `images/image_0.png` 这样的外部路径
- 你需要使用"导出所有图片"功能导出图片文件
- 将图片文件放在相对路径的 `images/` 目录下

#### 方案二：手动分离图片资源

1. 点击 **"导出所有图片"** 按钮（灰色按钮）
2. 浏览器会自动下载所有图片文件
3. 创建一个 `images/` 文件夹，将所有图片放入
4. 手动修改 JSON 文件中的图片引用

#### 方案三：在 After Effects 中优化（源头优化）

在导出之前优化：

1. **压缩图片**：在 AE 中将图片导入前先压缩
2. **降低分辨率**：如果可能，降低图片分辨率
3. **使用矢量**：尽量使用形状图层代替位图
4. **简化路径**：减少路径点数量

### 矢量优化功能

工具内置了智能矢量优化功能，可以自动解决图片替换后的矢量图形过度嵌套问题：

- **自动检测**：替换图片时自动检测矢量路径数量变化
- **智能修复**：当路径数量超过原始结构 2 倍时，自动恢复原始矢量结构
- **实时反馈**：显示优化前后的路径数量对比

### 使用优化后的 Lottie 文件

#### 文件结构

```
your-project/
├── lottie-animation.json   (优化后的文件，约 10-20KB)
└── images/
    ├── image_0.png
    ├── image_1.png
    ├── image_2.png
    └── ...
```

#### 在网页中使用

```javascript
import lottie from 'lottie-web'

lottie.loadAnimation({
  container: document.getElementById('lottie-container'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: './lottie-animation.json',
})
```

#### 进一步优化图片

导出图片后，可以使用以下工具进一步压缩：

1. **TinyPNG**（在线）：https://tinypng.com/
   - PNG 图片可以压缩 50-80%
   - 保持视觉质量

2. **ImageOptim**（Mac）或 **FileOptimizer**（Windows）
   - 批量压缩图片
   - 无损压缩

3. **Squoosh**（在线）：https://squoosh.app/
   - 可以转换为 WebP 格式（更小的文件）
   - 需要确保浏览器支持

### 实际优化效果示例

以"双11首页弹窗.json"为例：

| 项目          | 优化前    | 优化后     | 减少    |
| ------------- | --------- | ---------- | ------- |
| JSON 文件大小 | 337KB     | ~15KB      | 95%     |
| 图片总大小    | -         | ~150KB     | -       |
| **总大小**    | **337KB** | **~165KB** | **51%** |

如果进一步压缩图片：

| 项目       | 优化后     | 压缩图片后 | 额外减少 |
| ---------- | ---------- | ---------- | -------- |
| 图片总大小 | ~150KB     | ~60KB      | 60%      |
| **总大小** | **~165KB** | **~75KB**  | **55%**  |

**最终效果**：从 337KB 减少到 75KB，减少了 **78%**！

### 常见问题

#### Q: 优化后的文件在网页上无法显示图片？

A: 确保：

1. `images/` 文件夹与 JSON 文件在同一目录
2. 图片文件名与 JSON 中的引用匹配
3. 服务器配置允许访问图片文件

#### Q: 可以使用 CDN 托管图片吗？

A: 可以！只需修改 JSON 文件中的 `u` 字段为 CDN 地址：

```json
{
  "u": "https://cdn.example.com/images/",
  "p": "image_0.png"
}
```

#### Q: 为什么优化后文件大小反而变大了？

A: 如果原文件已经是外部引用格式，或者只有 1-2 个小图片，优化效果可能不明显。这个优化主要针对包含大量 Base64 图片的文件。

#### Q: 替换图片后出现重影或显示异常？

A: 这是矢量图形过度嵌套导致的。工具会自动检测并修复此问题，恢复原始矢量结构。

### 工具功能说明

1. **下载Base64 Lottie**（绿色按钮）：下载当前编辑后的 Lottie 文件（保持 Base64 格式）
2. **下载优化版本**（橙色按钮）：自动将 Base64 图片转换为外部引用，大幅减小文件大小
3. **导出所有图片**（灰色按钮）：批量导出所有图片资源，配合优化版本使用

### 建议流程

1. ✅ 上传 Lottie 文件到工具
2. ✅ 预览动画效果，确认无误
3. ✅ 如需替换图片，使用图片替换功能（自动矢量优化）
4. ✅ 点击"导出所有图片"，下载所有图片
5. ✅ 点击"下载优化版本"，下载优化后的 JSON
6. ✅ 使用 TinyPNG 等工具压缩图片
7. ✅ 创建项目文件结构（JSON + images 文件夹）
8. ✅ 测试动画播放效果

## 配置说明

详见 [Vite Configuration Reference](https://vite.dev/config/)

---

**提示**：第一次优化可能需要一些时间来熟悉流程，但一旦掌握，可以大大提升你的 Lottie 文件性能！
解决替换图片时,矢量图形被过度嵌套了 :

<template>
  <div class="update-log-page">
    <router-link to="/" class="back-btn"> <span class="back-icon">←</span> 返回首页 </router-link>
    <div class="page-header">
      <h1>更新日志</h1>
      <p class="subtitle">我们在持续进行功能和体验升级,</p>
    </div>

    <div class="timeline-container">
      <!-- 统计数据卡片 -->
      <div v-if="Object.keys(usageStats).length > 0" class="timeline-item usage-stats-item">
        <div class="version-meta">
          <div class="version-number">📊</div>
          <div class="version-date">使用统计</div>
        </div>
        <div class="timeline-axis">
          <div class="dot current-dot">
            <div class="dot-inner"></div>
          </div>
          <div class="line"></div>
        </div>
        <div class="content-card stats-card">
          <div class="stats-header">
            <span class="stats-title">🚀 运行数据统计 (自 2026-03-24 起)</span>
            <span class="total-badge">累计使用: {{ totalUsage }} 次</span>
          </div>
          <div class="stats-grid">
            <div v-for="(count, date) in usageStats" :key="date" class="stats-item">
              <div class="stats-date">{{ date }}</div>
              <div class="stats-count">{{ count }} <span class="unit">次</span></div>
            </div>
          </div>
        </div>
      </div>

      <div v-for="(log, index) in logs" :key="index" class="timeline-item">
        <!-- 左侧：版本信息 -->
        <div class="version-meta">
          <div class="version-number">{{ log.version }}</div>
          <div class="version-date">{{ log.date }}</div>
          <div v-if="index === 0" class="latest-tag">最新版</div>
        </div>

        <!-- 中间：时间轴线和点 -->
        <div class="timeline-axis">
          <div class="dot" :class="{ 'current-dot': index === 0 }">
            <div v-if="index === 0" class="dot-inner"></div>
          </div>
          <div class="line" v-if="index !== logs.length - 1"></div>
        </div>

        <!-- 右侧：内容卡片 -->
        <div class="content-card">
          <div class="card-body">
            <ul class="log-list">
              <li v-for="(item, idx) in log.items" :key="idx">{{ item }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const usageStats = ref({})
const totalUsage = computed(() => {
  return Object.values(usageStats.value).reduce((sum, count) => sum + count, 0)
})

onMounted(() => {
  try {
    const rawStats = JSON.parse(localStorage.getItem('lottie_tool_daily_usage') || '{}')
    const formattedStats = {}

    // 获取今天的日期字符串 (与 track.js 逻辑保持一致)
    const todayStr = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })

    // 我们只统计 2026-03-24 及以后的数据
    const startDate = new Date('2026-03-24')

    // 确保今天的数据至少显示为 0，这样你一打开就能看到卡片
    if (!rawStats[todayStr]) {
      formattedStats[todayStr] = 0
    }

    Object.keys(rawStats)
      .sort((a, b) => new Date(b) - new Date(a))
      .forEach((dateStr) => {
        const date = new Date(dateStr)
        if (date >= startDate || dateStr === todayStr) {
          formattedStats[dateStr] = rawStats[dateStr].total || 0
        }
      })

    usageStats.value = formattedStats
  } catch (e) {
    console.error('加载统计数据失败:', e)
  }
})

const logs = ref([
  // --- 在这里添加新的版本 ---
  {
    version: 'v1.7.0',
    date: '2026-03-24',
    items: [
      '✨ 优化图片资源显示：优先获取 Lottie 资源或图层的 "nm" 键值作为图片名称显示，避免显示冗长的 Base64 字符串',
      '💾 增强下载功能：下载单张图片时自动采用原始图层名称命名，并智能补全文件后缀',
      '📦 导出功能升级：支持一键导出所有图片为 ZIP 压缩包，压缩包内图片统一按图层名命名',
      '🚀 新增批量替换功能：支持上传多张图片，自动根据文件名匹配并替换动画中的对应资源',
      '🎨 界面布局优化：将图片导出与批量替换按钮整合至资源列表上方，操作更集中',
      '💾 优化状态保持：通过 keep-alive 技术实现页面切换时的状态持久化，返回首页时无需重新加载 Lottie 动画',
      '🔙 新增返回按钮：在更新日志页面添加了交互式返回按钮，提升页面导航体验',
      '⚡ 性能大幅优化：重构了 Lottie 数据预处理算法，将递归深拷贝改为原地修改，极大降低了大文件加载时的内存压力和卡顿',
    ],
  },
  {
    version: 'v1.6.0',
    date: '2026-03-04',
    items: [
      '🐛 修复 Lottie 图片资源为 CDN 链接时，保存当前帧和下载 Base64 Lottie 图片丢失的问题',
      '🖼️ 保存当前帧和下载 Base64 Lottie 时，自动将 CDN 图片转换为 Base64 内嵌',
      '✨ 优化"保存当前帧"的分辨率，使用 Lottie 原始尺寸导出',
    ],
  },
  {
    version: 'v1.5.0',
    date: '2026-02-02',
    items: ['🔨 修复复杂动画无法正常播放问题'],
  },
  {
    version: 'v1.4.0',
    date: '2026-01-31',
    items: [
      '✨ 新增在线导入功能：支持通过 Lottie JSON 链接直接导入动画，方便快捷',
      '🔨 代码重构，结构更清晰',
      '✨ 优化截图功能：支持导出透明背景的 PNG 图片，不再强制填充预览背景色',
      '🎨 优化界面交互：资源列表背景色支持自定义配置',
      '📢 Bug反馈请发送到邮箱 3320653801@qq.com',
    ],
  },
  {
    version: 'v1.3.0',
    date: '2026-01-05',
    items: [
      '🚀 新增 Lottie 文件优化功能：下载时自动移除冗余关键帧和精度优化',
      '🔧 修复 Lottie 兼容性问题：自动修复 to/ti 属性为 null 导致的崩溃问题',
      '📊 新增图片资源替换优化：替换图片时自动检测并移除冗余的矢量图层',
    ],
  },
  {
    version: 'v1.2.0',
    date: '2025-12-18',
    items: [
      '💾 新增"保存当前帧"功能：支持将当前画面截图保存为 PNG',
      '📦 新增"导出所有图片"功能：一键批量导出 Lottie 中的所有图片资源',
      '📥 新增 Base64 Lottie 下载：支持将修改后的动画导出为 JSON 文件',
    ],
  },
  {
    version: 'v1.1.0',
    date: '2025-12-12',
    items: [
      '🖼️ 支持 Lottie 图片资源替换：可以直接替换动画中的位图',
      '🎨 支持播放器背景颜色修改：方便预览不同背景下的动画效果',
      'ℹ️ 新增动画详细信息显示：包括尺寸、帧率、时长、文件大小等',
    ],
  },
  {
    version: 'v1.0.0',
    date: '2025-12-01',
    items: [
      '🎉 项目初始化：Lottie 预览工具上线',
      '📂 支持拖拽上传 Base64 格式的 Lottie JSON 文件',
      '⏯️ 基础播放控制：播放/暂停、停止、重播、首帧、进度条拖拽',
    ],
  },
])
</script>

<style scoped>
.update-log-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #333;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background-color: #fff;
  color: #606266;
  text-decoration: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  border: 1px solid #dcdfe6;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.back-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
  transform: translateX(-4px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.back-icon {
  font-size: 18px;
}

.page-header {
  text-align: center;
  margin-bottom: 60px;
}

.page-header h1 {
  font-size: 36px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1f2d3d;
}

.subtitle {
  font-size: 16px;
  color: #5e6d82;
}

.timeline-container {
  position: relative;
  padding-bottom: 40px;
}

.timeline-item {
  display: flex;
  margin-bottom: 40px;
  position: relative;
}

/* 左侧版本信息 */
.version-meta {
  width: 120px;
  text-align: right;
  padding-right: 30px;
  padding-top: 20px;
  flex-shrink: 0;
  position: relative;
}

.version-number {
  font-size: 24px;
  font-weight: 500;
  color: #1f2d3d;
  line-height: 1.2;
}

.version-date {
  font-size: 13px;
  color: #99a9bf;
  margin-top: 4px;
}

.latest-tag {
  display: inline-block;
  background-color: #e1f3d8;
  color: #67c23a;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  margin-top: 8px;
  font-weight: 500;
}

/* 中间轴线 */
.timeline-axis {
  width: 40px;
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #dcdfe6;
  background: #fff;
  margin-top: 28px; /* 大致与卡片标题对齐 */
  z-index: 2;
  position: relative;
  box-sizing: border-box;
}

.current-dot {
  border-color: #409eff;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-top: 26px;
}

.dot-inner {
  width: 8px;
  height: 8px;
  background: #409eff;
  border-radius: 50%;
}

.line {
  position: absolute;
  top: 44px;
  bottom: -40px; /* 连接到下一个项目 */
  width: 2px;
  background-color: #e4e7ed;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.timeline-item:last-child .line {
  display: none;
}

/* 右侧卡片 */
.content-card {
  flex-grow: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  padding: 24px 32px;
  border: 1px solid #ebeef5;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.content-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.log-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.log-list li {
  position: relative;
  font-size: 15px;
  color: #606266;
  line-height: 1.8;
  margin-bottom: 12px;
  padding-left: 20px;
}

.log-list li::before {
  content: ''; /* 移除列表圆点，因为文本中包含 emoji */
  display: none;
}

/* 统计数据样式 */
.stats-card {
  background: linear-gradient(135deg, #f0f9eb 0%, #ffffff 100%) !important;
  border: 1px solid #e1f3d8 !important;
  margin-bottom: 30px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e1f3d8;
}

.stats-title {
  font-size: 16px;
  font-weight: 600;
  color: #67c23a;
}

.total-badge {
  background-color: #67c23a;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
}

.stats-item {
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  text-align: center;
  transition: transform 0.2s;
}

.stats-item:hover {
  transform: scale(1.05);
  border-color: #67c23a;
}

.stats-date {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.stats-count {
  font-size: 20px;
  font-weight: bold;
  color: #1f2d3d;
}

.unit {
  font-size: 12px;
  font-weight: normal;
  color: #909399;
  margin-left: 2px;
}

@media (max-width: 768px) {
  .timeline-item {
    flex-direction: column;
  }

  .version-meta {
    width: 100%;
    text-align: left;
    padding-left: 50px; /* 与内容对齐 */
    padding-bottom: 10px;
    margin-bottom: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .timeline-axis {
    position: absolute;
    left: 10px;
    height: 100%;
  }

  .line {
    bottom: 0;
  }

  .content-card {
    margin-left: 50px;
  }
}
</style>

/**
 * 简单的埋点统计工具
 * 用于统计每天的使用次数和具体操作
 */
export const trackEvent = (action) => {
  try {
    // 1. 本地 LocalStorage 统计
    // 使用本地时间获取今天的日期 (YYYY/MM/DD)
    const today = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })
    const storageKey = 'lottie_tool_daily_usage'

    let stats = {}
    try {
      stats = JSON.parse(localStorage.getItem(storageKey) || '{}')
    } catch (e) {
      stats = {}
    }

    // 初始化今天的数据
    if (!stats[today]) {
      stats[today] = { total: 0 }
    }

    // 记录总次数和分类次数
    stats[today].total += 1
    stats[today][action] = (stats[today][action] || 0) + 1

    localStorage.setItem(storageKey, JSON.stringify(stats))

    console.log(`📊 [埋点] ${today} | 动作: ${action} | 今日总触发次数: ${stats[today].total}`)

    // 2. 第三方远程统计预留接口
    // 如果你在 index.html 中接入了百度统计，这里会自动上报
    if (typeof window !== 'undefined' && window._hmt) {
      window._hmt.push(['_trackEvent', 'LottieTool', action, today])
    }

    // 如果你接入了 Google Analytics，这里会自动上报
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: 'LottieTool',
        event_label: today,
      })
    }
  } catch (error) {
    console.error('埋点上报失败:', error)
  }
}

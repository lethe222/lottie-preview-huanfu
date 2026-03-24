/**
 * 简单的埋点统计工具
 * 用于统计每天的使用次数和具体操作
 */
export const trackEvent = (action) => {
  try {
    // 1. 本地 LocalStorage 统计 (保留作为备份)
    const today = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })
    const storageKey = 'lottie_tool_daily_usage'

    let stats = {}
    try {
      stats = JSON.parse(localStorage.getItem(storageKey) || '{}')
    } catch (e) {
      stats = {}
    }

    if (!stats[today]) {
      stats[today] = { total: 0 }
    }

    stats[today].total += 1
    stats[today][action] = (stats[today][action] || 0) + 1
    localStorage.setItem(storageKey, JSON.stringify(stats))

    // 2. 远程服务器统计 (阿里云)
    fetch('http://101.200.38.189:3000/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    }).catch(err => console.error('远程埋点上报失败:', err));

    console.log(`📊 [埋点] ${today} | 动作: ${action} | 远程同步中...`)

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

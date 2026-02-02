/**
 * 修复 Lottie JSON 中 to 和 ti 为 null 的问题
 * 这会导致 iOS 和 Android 的 Lottie 播放器崩溃
 * 解决方案：删除值为 null 的 to 和 ti 字段
 */
export const fixNullKeyframes = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => fixNullKeyframes(item))
  }

  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    // 如果是关键帧对象中的 to 或 ti 字段且值为 null，则跳过（删除）
    if ((key === 'to' || key === 'ti') && value === null) {
      continue
    }
    result[key] = fixNullKeyframes(value)
  }

  return result
}

/**
 * 优化并下载 Lottie 动画数据
 * @param {Object} animationData - 动画数据
 * @param {string} fileName - 文件名
 * @param {number} originalSize - 原始文件大小 (KB)
 * @returns {Promise<string>} - 返回下载结果信息
 */
export const downloadLottieData = async (animationData, fileName, originalSize) => {
  return new Promise((resolve, reject) => {
    try {
      // 深拷贝数据以避免修改原始数据
      const optimizedData = JSON.parse(JSON.stringify(animationData))
      let optimizationInfo = { originalSize: 0, optimizedSize: 0, removedKeyframes: 0 }

      const roundNumber = (num) => (typeof num !== 'number' ? num : Math.round(num * 100) / 100)
      
      const optimizeNumbers = (obj) => {
        if (typeof obj === 'number') return roundNumber(obj)
        if (Array.isArray(obj)) return obj.map(optimizeNumbers)
        if (typeof obj === 'object' && obj !== null) {
          const result = {}
          for (const key in obj) result[key] = optimizeNumbers(obj[key])
          return result
        }
        return obj
      }

      const optimizeKeyframes = (keyframes) => {
        if (!Array.isArray(keyframes) || keyframes.length <= 2) return keyframes
        const result = [keyframes[0]]
        let removedCount = 0
        for (let i = 1; i < keyframes.length - 1; i++) {
          const prev = keyframes[i - 1],
            curr = keyframes[i],
            next = keyframes[i + 1]
          let isImportant = false
          if (curr.s && prev.s && next.s) {
            if (
              JSON.stringify(curr.s) !== JSON.stringify(prev.s) ||
              JSON.stringify(curr.s) !== JSON.stringify(next.s)
            )
              isImportant = true
          } else isImportant = true
          if (isImportant) result.push(curr)
          else removedCount++
        }
        result.push(keyframes[keyframes.length - 1])
        optimizationInfo.removedKeyframes += removedCount
        return result
      }

      const optimizeAnimation = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj
        if (Array.isArray(obj)) return obj.map(optimizeAnimation)
        const result = {}
        for (const key in obj) {
          if (key === 'k' && obj.a === 1 && Array.isArray(obj[key]))
            result[key] = optimizeKeyframes(obj[key])
          else result[key] = optimizeAnimation(obj[key])
        }
        return result
      }

      // 执行优化步骤
      let finalData = optimizeAnimation(optimizedData)
      finalData = optimizeNumbers(finalData)
      finalData = fixNullKeyframes(finalData)
      
      // 生成文件并下载
      const optimizedString = JSON.stringify(finalData)
      const blob = new Blob([optimizedString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      const downloadSize = (blob.size / 1024).toFixed(2)
      const reduction = ((1 - blob.size / (originalSize * 1024)) * 100).toFixed(1)
      
      resolve(`下载完成！原始大小: ${originalSize}KB，优化后: ${downloadSize}KB（减少${reduction}%）`)
    } catch (error) {
      reject(error)
    }
  })
}

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
    for (let i = 0; i < obj.length; i++) {
      fixNullKeyframes(obj[i])
    }
    return obj
  }

  for (const key in obj) {
    if ((key === 'to' || key === 'ti') && obj[key] === null) {
      delete obj[key]
    } else {
      fixNullKeyframes(obj[key])
    }
  }

  return obj
}

/**
 * 将图片 URL 转换为 Base64
 * @param {string} url 图片 URL
 * @returns {Promise<string>} Base64 字符串
 */
export const fetchImageAsBase64 = async (url) => {
  try {
    const response = await fetch(url, { mode: 'cors' })
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Convert image to base64 failed:', error)
    throw error
  }
}

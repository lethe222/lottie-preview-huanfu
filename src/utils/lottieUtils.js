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

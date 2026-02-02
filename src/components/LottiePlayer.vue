<template>
  <div class="left-section">
    <div class="background-controls">
      <label for="bgColor">🎨 播放器背景：</label>
      <div class="color-picker-group">
        <input
          type="color"
          id="bgColor"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
        />
        <input
          type="text"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          placeholder="#ffffff"
          class="color-input"
        />
        <button @click="$emit('update:modelValue', '#ffffff')" class="reset-btn">重置</button>
      </div>
    </div>

    <div class="lottie-preview" ref="lottieContainer" :style="containerStyle"></div>

    <div class="controls">
      <button @click="togglePlay" class="control-btn">
        {{ isPlaying ? '暂停' : '播放' }}
      </button>
      <button @click="stopAnimation" class="control-btn">停止</button>
      <button @click="restartAnimation" class="control-btn">重播</button>
      <button @click="goToFirstFrame" class="control-btn">首帧</button>
      <button @click="saveCurrentFrame" class="control-btn control-btn-primary">保存当前帧</button>
      <button @click="downloadBase64Lottie" class="control-btn control-btn-primary">
        下载Base64 Lottie
      </button>
      <button @click="$emit('exportImages')" class="control-btn control-btn-secondary">
        导出所有图片
      </button>
    </div>

    <div class="progress-section">
      <input
        type="range"
        class="progress-bar"
        v-model.number="currentProgress"
        min="0"
        :max="100"
        @input="seekToProgress"
        :disabled="!animation"
      />
      <span class="progress-text">{{ currentFrame }} / {{ totalFrames }}</span>
    </div>

    <div class="info-panel">
      <h3>动画信息</h3>
      <p>
        <strong>尺寸：</strong>{{ animationData.w }} x
        {{ animationData.h }}
      </p>
      <p><strong>帧率：</strong>{{ animationData.fr }} FPS</p>
      <p>
        <strong>时长：</strong
        >{{ ((animationData.op - animationData.ip) / animationData.fr).toFixed(2) }}秒
      </p>
      <p><strong>文件体积：</strong>{{ lottieFileSize }} KB</p>
      <p><strong>图片资源数量：</strong>{{ imageAssetsCount }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import lottie from 'lottie-web'
import { fixNullKeyframes } from '../utils/lottieUtils'

const props = defineProps({
  animationData: {
    type: Object,
    required: true,
  },
  lottieFileSize: {
    type: [String, Number],
    default: 0,
  },
  modelValue: {
    type: String,
    default: '#ffffff',
  },
  originalFileName: {
    type: String,
    default: 'lottie-base64.json',
  },
  imageAssetsCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update:modelValue', 'exportImages', 'toast'])

const lottieContainer = ref(null)
const isPlaying = ref(true)
const currentProgress = ref(0)
const currentFrame = ref(0)
const totalFrames = ref(0)
let animation = null
let progressUpdateInterval = null

const containerStyle = computed(() => ({
  background: props.modelValue,
  width: '528px',
  height: '496px',
}))

const playAnimation = (animationData) => {
  if (!lottieContainer.value) return
  if (animation) animation.destroy()

  lottieContainer.value.innerHTML = ''

  try {
    animation = lottie.loadAnimation({
      container: lottieContainer.value,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: animationData,
    })

    isPlaying.value = true
    totalFrames.value = animation.totalFrames

    if (progressUpdateInterval) clearInterval(progressUpdateInterval)

    progressUpdateInterval = setInterval(() => {
      if (animation && isPlaying.value) {
        const currentTime = animation.currentRawFrame
        const duration = animation.totalFrames
        if (duration > 0) {
          currentProgress.value = Math.floor((currentTime / duration) * 100)
          currentFrame.value = Math.floor(currentTime)
        }
      }
    }, 100)
  } catch (error) {
    console.error('动画加载失败:', error)
    emit('toast', '动画加载失败: ' + error.message)
  }
}

watch(
  () => props.animationData,
  (newData) => {
    if (newData) playAnimation(newData)
  },
)

onMounted(() => {
  if (props.animationData) playAnimation(props.animationData)
})

onUnmounted(() => {
  if (animation) animation.destroy()
  if (progressUpdateInterval) clearInterval(progressUpdateInterval)
})

const togglePlay = () => {
  if (!animation) return
  if (isPlaying.value) animation.pause()
  else animation.play()
  isPlaying.value = !isPlaying.value
}

const stopAnimation = () => {
  if (!animation) return
  animation.stop()
  isPlaying.value = false
}

const restartAnimation = () => {
  if (!animation) return
  animation.goToAndPlay(0)
  isPlaying.value = true
  currentProgress.value = 0
  currentFrame.value = 0
}

const goToFirstFrame = () => {
  if (!animation) return
  animation.goToAndStop(0, true)
  isPlaying.value = false
  currentProgress.value = 0
  currentFrame.value = 0
}

const seekToProgress = () => {
  if (!animation) return
  const targetFrame = (currentProgress.value / 100) * animation.totalFrames
  animation.goToAndStop(targetFrame, true)
  currentFrame.value = Math.floor(targetFrame)
}

const saveCurrentFrame = () => {
  if (!animation) {
    emit('toast', '动画未加载，无法保存当前帧！')
    return
  }

  console.log('开始保存当前帧')
  const wasPlaying = isPlaying.value
  animation.pause()

  setTimeout(() => {
    const svgElement = lottieContainer.value.querySelector('svg')
    console.log('查找 SVG 元素:', svgElement)

    if (!svgElement) {
      console.error('无法找到 SVG 元素，动画可能未正确加载')
      // 检查容器内容
      console.log('容器内容:', lottieContainer.value.innerHTML)

      // 尝试重新加载动画
      emit('toast', '无法获取动画元素，正在尝试重新加载...')
      setTimeout(() => {
        playAnimation(props.animationData)
      }, 1000)

      if (wasPlaying) animation.play()
      return
    }

    try {
      const svgClone = svgElement.cloneNode(true)
      const svgData = new XMLSerializer().serializeToString(svgClone)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)

      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          const pngUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.href = pngUrl
          link.download = `lottie-frame-${currentFrame.value}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(svgUrl)
          if (wasPlaying) animation.play()
          emit('toast', '当前帧已保存！')
        } catch (error) {
          console.error('保存图片失败:', error)
          emit('toast', '保存图片失败，请重试！')
          URL.revokeObjectURL(svgUrl)
          if (wasPlaying) animation.play()
        }
      }
      img.onerror = () => {
        console.error('图片加载失败')
        emit('toast', '保存图片失败，请重试！')
        URL.revokeObjectURL(svgUrl)
        if (wasPlaying) animation.play()
      }
      img.src = svgUrl
    } catch (error) {
      console.error('保存当前帧失败:', error)
      emit('toast', '保存当前帧失败，请重试！')
      if (wasPlaying) animation.play()
    }
  }, 100)
}

const downloadBase64Lottie = () => {
  if (!props.animationData) {
    emit('toast', '没有可下载的动画数据！')
    return
  }

  try {
    const optimizedData = JSON.parse(JSON.stringify(props.animationData))
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

    let finalData = optimizeAnimation(optimizedData)
    finalData = optimizeNumbers(finalData)
    finalData = fixNullKeyframes(finalData)
    const optimizedString = JSON.stringify(finalData)
    const blob = new Blob([optimizedString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = props.originalFileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    const downloadSize = (blob.size / 1024).toFixed(2)
    const reduction = ((1 - blob.size / (props.lottieFileSize * 1024)) * 100).toFixed(1)
    emit(
      'toast',
      `下载完成！原始大小: ${props.lottieFileSize}KB，优化后: ${downloadSize}KB（减少${reduction}%）`,
    )
  } catch (error) {
    emit('toast', '下载失败，请稍后重试！')
  }
}
</script>

<style scoped>
.left-section {
  flex: 1;
  min-width: 0;
}

.background-controls {
  max-width: 600px;
  margin: 0 auto 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.background-controls label {
  font-weight: bold;
  color: #333;
  font-size: 14px;
  white-space: nowrap;
}

.color-picker-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.background-controls input[type='color'] {
  width: 50px;
  height: 35px;
  border: 2px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.background-controls input[type='color']:hover {
  border-color: #409eff;
}

.color-input {
  flex: 1;
  min-width: 100px;
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  font-family: monospace;
  transition: border-color 0.3s;
}

.color-input:focus {
  outline: none;
  border-color: #409eff;
}

.reset-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  background-color: #909399;
  color: white;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: background-color 0.3s;
}

.reset-btn:hover {
  background-color: #a6a9ad;
}

.lottie-preview {
  width: 528px;
  max-width: 528px;
  margin: 0 auto 20px;
  border: 2px solid #eee;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.controls {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.control-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #409eff;
  color: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.control-btn:hover {
  background-color: #66b1ff;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.control-btn:active {
  background-color: #3a8ee6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transform: translateY(0);
}

.control-btn-primary {
  background-color: #67c23a;
}

.control-btn-primary:hover {
  background-color: #85ce61;
}

.control-btn-primary:active {
  background-color: #5daf34;
}

.control-btn-secondary {
  background-color: #909399;
}

.control-btn-secondary:hover {
  background-color: #a6a9ad;
}

.control-btn-secondary:active {
  background-color: #82848a;
}

.progress-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.progress-bar {
  width: 100%;
  height: 10px;
  border-radius: 5px;
  background-color: #eee;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #409eff;
  cursor: pointer;
  transition: background-color 0.3s;
}

.progress-bar::-webkit-slider-thumb:hover {
  background-color: #66b1ff;
}

.progress-text {
  font-size: 14px;
  color: #666;
  font-family: monospace;
}

.info-panel {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.info-panel h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.info-panel p {
  margin: 8px 0;
  color: #666;
  font-size: 14px;
}
</style>

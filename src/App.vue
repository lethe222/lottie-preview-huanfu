<template>
  <div class="main-box">
    <h1>Lottie 播放器与图片替换工具</h1>
    <p>只支持base64格式的lottie动画上传，可以替换动画中的图片资源</p>

    <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop" @click="triggerFileInput">
      <p>📁 将base64格式的lottie动画文件拖拽到此区域</p>
      <p class="upload-hint">或点击选择文件</p>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".json"
      class="hidden-input"
      @change="handleFileSelect"
    />

    <input
      ref="imageInput"
      type="file"
      accept="image/*"
      class="hidden-input"
      @change="handleImageSelect"
    />

    <div v-if="currentAnimationData" class="content-wrapper">
      <div class="left-section">
        <div class="background-controls">
          <label for="bgColor">🎨 播放器背景：</label>
          <div class="color-picker-group">
            <input type="color" id="bgColor" v-model="backgroundColor" @input="updateBackground" />
            <input
              type="text"
              v-model="backgroundColor"
              @input="updateBackground"
              placeholder="#ffffff"
              class="color-input"
            />
            <button @click="resetBackground" class="reset-btn">重置</button>
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
          <button @click="saveCurrentFrame" class="control-btn control-btn-primary">
            保存当前帧
          </button>
          <button @click="downloadBase64Lottie" class="control-btn control-btn-primary">
            下载Base64 Lottie
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
            <strong>尺寸：</strong>{{ currentAnimationData.w }} x
            {{ currentAnimationData.h }}
          </p>
          <p><strong>帧率：</strong>{{ currentAnimationData.fr }} FPS</p>
          <p>
            <strong>时长：</strong
            >{{
              (
                (currentAnimationData.op - currentAnimationData.ip) /
                currentAnimationData.fr
              ).toFixed(2)
            }}秒
          </p>
          <p><strong>图片资源数量：</strong>{{ imageAssets.length }}</p>
        </div>
      </div>

      <div class="right-section">
        <h3>图片资源列表</h3>
        <div class="background-controls">
          <label for="resourceBgColor">📂 资源列表背景：</label>
          <div class="color-picker-group">
            <input type="color" id="resourceBgColor" v-model="resourceListBackgroundColor" />
            <input
              type="text"
              v-model="resourceListBackgroundColor"
              placeholder="#f5f7fa"
              class="color-input"
            />
            <button @click="resetResourceListBackground" class="reset-btn">重置</button>
          </div>
        </div>

        <div v-if="imageAssets.length === 0" class="empty-state">
          <p>😊 当前动画没有使用图片资源</p>
          <p class="empty-hint">这是一个纯矢量动画</p>
        </div>

        <div v-else class="image-list">
          <div v-for="asset in imageAssets" :key="asset.id" class="image-item">
            <div class="image-preview">
              <img
                v-if="asset.u && asset.p"
                :src="getImageUrl(asset)"
                alt="asset image"
                @error="handleImageError"
              />
              <img v-else-if="asset.p && asset.e === 1" :src="asset.p" alt="embedded image" />
              <div v-else class="no-preview">无预览</div>
            </div>

            <div class="image-info">
              <p class="image-id">ID: {{ asset.id }}</p>
              <p class="image-name" :title="asset.p">
                {{ asset.p || asset.u || '未命名' }}
              </p>
              <p class="image-size">{{ asset.w }} x {{ asset.h }}</p>
            </div>

            <div class="image-actions">
              <button @click="selectImageToReplace(asset)" class="replace-btn">替换图片</button>
              <button @click="downloadImage(asset)" class="download-btn">下载图片</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import lottie from 'lottie-web'

// ========== 响应式数据 ==========
const lottieContainer = ref(null)
const fileInput = ref(null)
const imageInput = ref(null)
const currentAnimationData = ref(null)
const isPlaying = ref(true)
const currentReplacingAsset = ref(null)
const backgroundColor = ref('#ffffff')
const resourceListBackgroundColor = ref('#f5f7fa') // 资源列表背景色，默认值与CSS中一致
const currentProgress = ref(0)
const currentFrame = ref(0)
const totalFrames = ref(0)
const originalFileName = ref('lottie-base64.json') // 默认文件名
let animation = null
let progressUpdateInterval = null // 进度更新定时器

// ========== 计算属性 ==========

// [新增] 动态计算容器样式，将尺寸固定为528x496
const containerStyle = computed(() => {
  const style = {
    background: backgroundColor.value,
    width: '528px',
    height: '496px',
  }

  return style
})

const imageAssets = computed(() => {
  if (!currentAnimationData.value || !currentAnimationData.value.assets) {
    return []
  }
  return currentAnimationData.value.assets.filter((asset) => {
    return asset.w && asset.h && (asset.u || asset.p || asset.e === 1)
  })
})

// ========== 方法 (保持逻辑不变) ==========

const triggerFileInput = () => fileInput.value.click()

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) loadJsonFile(file)
}

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file && file.type === 'application/json') {
    loadJsonFile(file)
  } else {
    alert('请上传 JSON 文件！')
  }
}

const loadJsonFile = async (file) => {
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const jsonData = JSON.parse(e.target.result)
      currentAnimationData.value = jsonData
      // 保存原始文件名
      originalFileName.value = file.name
      await nextTick()
      playAnimation(jsonData)
    } catch (error) {
      alert('JSON 文件格式错误：' + error.message)
    }
  }
  reader.readAsText(file)
}

const playAnimation = (animationData) => {
  if (!lottieContainer.value) return
  if (animation) animation.destroy()

  lottieContainer.value.innerHTML = ''

  setTimeout(() => {
    try {
      animation = lottie.loadAnimation({
        container: lottieContainer.value,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: animationData,
      })

      isPlaying.value = true

      // 计算总帧数
      totalFrames.value = Math.floor(
        ((animationData.op - animationData.ip) / animationData.fr) * 1000,
      )

      // 清除旧的定时器
      if (progressUpdateInterval) {
        clearInterval(progressUpdateInterval)
      }

      // 设置进度更新定时器
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
      alert('动画加载失败')
    }
  }, 50)
}

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

// 首帧
const goToFirstFrame = () => {
  if (!animation) return
  animation.goToAndStop(0, true)
  isPlaying.value = false
  currentProgress.value = 0
  currentFrame.value = 0
}

// 根据进度条跳转
const seekToProgress = () => {
  if (!animation) return
  const targetFrame = (currentProgress.value / 100) * animation.totalFrames
  animation.goToAndStop(targetFrame, true)
  currentFrame.value = Math.floor(targetFrame)
}

// 保存当前帧为图片
const saveCurrentFrame = () => {
  if (!animation) return

  // 暂停动画以确保获取的是当前帧
  const wasPlaying = isPlaying.value
  animation.pause()

  // 获取SVG元素
  const svgElement = lottieContainer.value.querySelector('svg')
  if (!svgElement) {
    alert('无法获取动画元素，请重试！')
    if (wasPlaying) animation.play()
    return
  }

  // 创建一个新的SVG元素副本，设置背景色
  const svgClone = svgElement.cloneNode(true)
  svgClone.setAttribute('style', `background-color: ${backgroundColor.value};`)

  // 将SVG转换为数据URL
  const svgData = new XMLSerializer().serializeToString(svgClone)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  // 创建Canvas并绘制SVG
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')

    // 设置背景色
    ctx.fillStyle = backgroundColor.value
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制SVG
    ctx.drawImage(img, 0, 0)

    // 将Canvas转换为PNG
    const pngUrl = canvas.toDataURL('image/png')

    // 创建下载链接
    const link = document.createElement('a')
    link.href = pngUrl
    link.download = `lottie-frame-${currentFrame.value}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 清理临时URL
    URL.revokeObjectURL(svgUrl)

    // 恢复动画播放状态
    if (wasPlaying) animation.play()

    alert('当前帧已保存！')
  }

  img.onerror = () => {
    alert('保存图片失败，请重试！')
    URL.revokeObjectURL(svgUrl)
    if (wasPlaying) animation.play()
  }

  img.src = svgUrl
}

const getImageUrl = (asset) => {
  if (asset.p && asset.e === 1) return asset.p
  if (asset.u && asset.p) return asset.u + asset.p
  return ''
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
  event.target.parentElement.innerHTML = '<div class="no-preview">加载失败</div>'
}

const selectImageToReplace = (asset) => {
  currentReplacingAsset.value = asset
  imageInput.value.click()
}

const handleImageSelect = (event) => {
  const file = event.target.files[0]
  if (!file || !currentReplacingAsset.value) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const base64Image = e.target.result
    const assetIndex = currentAnimationData.value.assets.findIndex(
      (a) => a.id === currentReplacingAsset.value.id,
    )

    if (assetIndex !== -1) {
      currentAnimationData.value.assets[assetIndex].p = base64Image
      currentAnimationData.value.assets[assetIndex].u = ''
      currentAnimationData.value.assets[assetIndex].e = 1
      playAnimation(currentAnimationData.value)
      alert('图片替换成功！')
    }
    event.target.value = ''
    currentReplacingAsset.value = null
  }
  reader.readAsDataURL(file)
}

const updateBackground = () => {}
const resetBackground = () => (backgroundColor.value = '#ffffff')
const resetResourceListBackground = () => (resourceListBackgroundColor.value = '#f5f7fa')

const downloadImage = (asset) => {
  const imageUrl = asset.u && asset.p ? getImageUrl(asset) : asset.p
  if (!imageUrl) return

  const link = document.createElement('a')
  link.href = imageUrl
  link.download = asset.p || asset.id || 'lottie-image'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const downloadBase64Lottie = () => {
  if (!currentAnimationData.value) {
    alert('没有可下载的动画数据！')
    return
  }
  try {
    const jsonString = JSON.stringify(currentAnimationData.value, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = originalFileName.value
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('下载失败，请稍后重试！')
  }
}
</script>

<style scoped>
/* ========== 全局样式 ========== */
* {
  box-sizing: border-box;
}

.main-box {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 10px;
}

.main-box > p {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

/* ========== 文件上传区域 ========== */
.upload-area {
  max-width: 600px;
  height: 150px;
  margin: 0 auto 40px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.upload-area p {
  margin: 5px 0;
  color: #666;
}

.upload-hint {
  font-size: 14px;
  color: #999;
}

.hidden-input {
  display: none;
}

/* ========== 主内容区域 ========== */
.content-wrapper {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

/* ========== 左侧：动画预览区域 ========== */
.left-section {
  flex: 1;
  min-width: 0;
}

/* 背景颜色控制 */
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

/* Lottie 动画播放器容器 */
.lottie-preview {
  width: 528px;
  max-width: 528px;
  margin: 0 auto 20px;
  border: 2px solid #eee;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 增加宽高变化的过渡效果 */
  transition: background 0.3s ease;
}

/* 控制按钮样式 */
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

.control-btn:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
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

/* 进度条样式 */
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

.progress-bar::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #409eff;
  cursor: pointer;
  border: none;
  transition: background-color 0.3s;
}

.progress-bar::-moz-range-thumb:hover {
  background-color: #66b1ff;
}

.progress-text {
  font-size: 14px;
  color: #666;
  font-family: monospace;
}

/* 动画信息面板 */
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

/* ========== 右侧：图片资源列表区域 ========== */
.right-section {
  flex: 1;
  min-width: 0;
}

.right-section > h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-hint {
  font-size: 14px;
  color: #999;
}

.image-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.image-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.image-item:hover {
  background: #e8ecf1;
}

.image-preview {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background: v-bind(resourceListBackgroundColor);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-preview {
  color: #999;
  font-size: 12px;
  text-align: center;
}

.image-info {
  flex: 1;
  min-width: 0;
}

.image-id {
  font-weight: bold;
  color: #333;
  margin: 0 0 5px 0;
  font-size: 14px;
}

.image-name {
  color: #666;
  margin: 0 0 5px 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-size {
  color: #999;
  margin: 0;
  font-size: 12px;
}

.image-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.replace-btn,
.download-btn {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  color: #606266;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.replace-btn {
  border-color: #1890ff;
  color: #1890ff;
}

.replace-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
  background-color: #ecf5ff;
}

.download-btn {
  border-color: #52c41a;
  color: #52c41a;
}

.download-btn:hover {
  border-color: #73d13d;
  color: #73d13d;
  background-color: #f0f9eb;
}

/* ========== 响应式设计 ========== */
@media (max-width: 1024px) {
  .content-wrapper {
    flex-direction: column;
  }
}
</style>

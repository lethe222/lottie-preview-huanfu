<template>
  <div class="main-box">
    <h1>Lottie 播放器与图片替换工具</h1>
    <p>只支持base64格式的lottie动画上传，可以替换动画中的图片资源</p>

    <!-- 文件上传区域 -->
    <!-- ✅ 正确：必须同时阻止 dragover 和 drop 的默认行为 -->
    <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop" @click="triggerFileInput">
      <p>📁 将base64格式的lottie动画文件拖拽到此区域</p>
      <p class="upload-hint">或点击选择文件</p>
    </div>

    <!-- 隐藏的文件选择器：用户点击上传区域后触发，限制只能选择 JSON 文件 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      class="hidden-input"
      @change="handleFileSelect"
    />

    <!-- 隐藏的图片文件选择器：用于替换动画中的图片资源，限制只能选择图片文件 -->
    <input
      ref="imageInput"
      type="file"
      accept="image/*"
      class="hidden-input"
      @change="handleImageSelect"
    />

    <!-- 动画和控制区域 -->
    <div v-if="currentAnimationData" class="content-wrapper">
      <!-- 左侧：动画预览 -->
      <div class="left-section">
        <!-- 背景颜色选择器 -->
        <div class="background-controls">
          <label for="bgColor">🎨 播放器背景：</label>

          <input type="color" v-model="backgroundColor" />
        </div>

        <!-- Lottie 动画容器 -->
        <div
          class="lottie-preview"
          ref="lottieContainer"
          :style="{ background: backgroundColor }"
        ></div>

        <!-- 播放控制按钮 -->
        <div class="controls">
          <button @click="togglePlay" class="control-btn">
            {{ isPlaying ? '暂停' : '播放' }}
          </button>
          <button @click="stopAnimation" class="control-btn">停止</button>
          <button @click="restartAnimation" class="control-btn">重播</button>
        </div>

        <!-- 动画信息 -->
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

      <!-- 右侧：图片资源列表 -->
      <div class="right-section">
        <h3>图片资源列表</h3>

        <div v-if="imageAssets.length === 0" class="empty-state">
          <p>😊 当前动画没有使用图片资源</p>
          <p class="empty-hint">这是一个纯矢量动画</p>
        </div>

        <div v-else class="image-list">
          <div v-for="asset in imageAssets" :key="asset.id" class="image-item">
            <div class="image-preview">
              <!-- 
              根据资源来源仅展示一种预览方式：
              1) 外部图片：同时存在 u(目录) 与 p(文件名) -> 通过 getImageUrl(asset) 生成 URL
              2) 内嵌 Base64 图片：存在 p 且 e === 1 -> 直接使用 base64 数据
              3) 其他情况：无有效预览 -> 显示“无预览”
            -->
              <img
                v-if="asset.u && asset.p"
                :src="getImageUrl(asset)"
                alt="asset image"
                @error="handleImageError"
              />
              <!-- 内嵌 Base64 图片（e === 1 表示嵌入式） -->
              <img v-else-if="asset.p && asset.e === 1" :src="asset.p" alt="embedded image" />
              <!-- 既不是外部图片，也不是内嵌图片时，显示占位 -->
              <div v-else class="no-preview">无预览</div>
            </div>

            <div class="image-info">
              <p class="image-id">ID: {{ asset.id }}</p>
              <p class="image-name" :title="asset.p">
                {{ asset.p || asset.u || '未命名' }}
              </p>
              <p class="image-size">{{ asset.w }} x {{ asset.h }}</p>
            </div>

            <button @click="selectImageToReplace(asset)" class="replace-btn">替换图片</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ========== 导入依赖 ==========
import { ref, computed, nextTick } from 'vue'
import lottie from 'lottie-web'

// ========== DOM 引用 ==========
const lottieContainer = ref(null) // 动画播放器的容器
const fileInput = ref(null) // JSON 文件选择器
const imageInput = ref(null) // 图片文件选择器

// ========== 状态管理 ==========
const currentAnimationData = ref(null) // 当前的 Lottie JSON 数据
const isPlaying = ref(true) // 动画播放状态
const currentReplacingAsset = ref(null) // 当前正在替换的图片资源
const backgroundColor = ref('#ffffff') // 播放器背景颜色
let animation = null // Lottie 动画实例对象

// ========== 计算属性 ==========
// 从动画数据中提取所有图片资源
const imageAssets = computed(() => {
  if (!currentAnimationData.value || !currentAnimationData.value.assets) {
    return []
  }
  // 过滤出图片类型的资源（具有宽高和路径信息的资源）
  return currentAnimationData.value.assets.filter((asset) => {
    // Lottie 中图片资源通常有 w(宽度), h(高度), u(路径), p(文件名), e(嵌入标记) 等属性
    return asset.w && asset.h && (asset.u || asset.p || asset.e === 1)
  })
})

// ========== 文件上传相关方法 ==========
// 触发文件选择器
const triggerFileInput = () => {
  fileInput.value.click()
}

// 处理文件选择器选择的文件
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    loadJsonFile(file)
  }
}

// 处理拖拽上传的文件
const handleDrop = (event) => {
  // 从拖放事件中获取文件
  const file = event.dataTransfer.files[0]
  if (file && file.type === 'application/json') {
    loadJsonFile(file)
  } else {
    alert('请上传 JSON 文件！')
  }
}

// 读取并解析 JSON 文件
const loadJsonFile = async (file) => {
  console.log('开始加载文件:', file.name)
  const reader = new FileReader()

  // 文件读取成功后的回调
  reader.onload = async (e) => {
    try {
      // 将文件内容解析为 JSON 对象
      const jsonData = JSON.parse(e.target.result)
      console.log('JSON 解析成功，准备播放动画')
      currentAnimationData.value = jsonData

      // 等待 Vue 更新 DOM，确保容器已渲染
      await nextTick()

      // 播放动画
      playAnimation(jsonData)
    } catch (error) {
      alert('JSON 文件格式错误：' + error.message)
      console.error('JSON 解析失败:', error)
    }
  }

  // 文件读取失败的回调
  reader.onerror = (error) => {
    alert('文件读取失败！')
    console.error('文件读取错误:', error)
  }

  // 以文本形式读取文件
  reader.readAsText(file)
}

// ========== 动画播放控制方法 ==========
// 初始化并播放 Lottie 动画
const playAnimation = (animationData) => {
  // 检查容器是否存在
  if (!lottieContainer.value) {
    console.error('Lottie 容器未找到！')
    return
  }

  // 如果已有动画，先销毁
  if (animation) {
    try {
      animation.destroy()
    } catch (error) {
      console.warn('销毁动画时出错:', error)
    }
    animation = null
  }

  // 清空容器
  lottieContainer.value.innerHTML = ''

  // 添加延迟以确保容器已清空
  setTimeout(() => {
    try {
      // 加载新动画
      animation = lottie.loadAnimation({
        container: lottieContainer.value,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: animationData,
      })

      isPlaying.value = true
      console.log('动画加载成功！')
    } catch (error) {
      console.error('加载动画失败:', error)
      alert('动画加载失败，请检查 JSON 文件格式！')
    }
  }, 50)
}

// 切换播放/暂停状态
const togglePlay = () => {
  if (!animation) return

  if (isPlaying.value) {
    animation.pause() // 暂停动画
  } else {
    animation.play() // 继续播放
  }
  isPlaying.value = !isPlaying.value
}

// 停止动画（回到第一帧）
const stopAnimation = () => {
  if (!animation) return
  animation.stop()
  isPlaying.value = false
}

// 重新播放动画（从头开始）
const restartAnimation = () => {
  if (!animation) return
  animation.goToAndPlay(0) // 跳转到第0帧并播放
  isPlaying.value = true
}

// ========== 图片资源处理方法 ==========
// 获取图片资源的 URL
const getImageUrl = (asset) => {
  // 如果是嵌入式图片（e=1 表示嵌入的 base64 图片）
  if (asset.p && asset.e === 1) {
    return asset.p
  }
  // 如果是外部图片（u 是路径，p 是文件名）
  if (asset.u && asset.p) {
    return asset.u + asset.p
  }
  return ''
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = 'none'
  event.target.parentElement.innerHTML = '<div class="no-preview">加载失败</div>'
}

// 选择要替换的图片资源
const selectImageToReplace = (asset) => {
  currentReplacingAsset.value = asset
  imageInput.value.click() // 触发图片选择器
}

// 处理选择的图片并替换到动画中
const handleImageSelect = (event) => {
  const file = event.target.files[0]
  if (!file || !currentReplacingAsset.value) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const base64Image = e.target.result

    // 在 assets 数组中找到要替换的图片资源
    const assetIndex = currentAnimationData.value.assets.findIndex(
      (a) => a.id === currentReplacingAsset.value.id,
    )

    if (assetIndex !== -1) {
      // 将图片替换为 base64 格式
      currentAnimationData.value.assets[assetIndex].p = base64Image // 图片数据
      currentAnimationData.value.assets[assetIndex].u = '' // 清空路径
      currentAnimationData.value.assets[assetIndex].e = 1 // 标记为嵌入式图片

      // 重新加载动画以显示新图片
      playAnimation(currentAnimationData.value)

      alert('图片替换成功！')
    }

    // 清空文件输入和当前替换的资源引用
    event.target.value = ''
    currentReplacingAsset.value = null
  }

  // 将图片文件读取为 base64 格式
  reader.readAsDataURL(file)
}

// ========== 背景控制方法 ==========
// 更新背景颜色（实际上通过 Vue 的响应式自动更新）
const updateBackground = () => {
  // 背景颜色会通过 :style 绑定自动更新
}

// 重置背景颜色为默认白色
const resetBackground = () => {
  backgroundColor.value = '#ffffff'
}
</script>

<style scoped>
/* ========== 全局样式 ========== */
* {
  box-sizing: border-box;
}

/* ========== 主容器 ========== */
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

/* 隐藏的文件输入框 */
.hidden-input {
  display: none;
}

/* ========== 主内容区域（左右布局）========== */
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

.reset-btn:active {
  background-color: #82848a;
}

/* Lottie 动画播放器容器 */
.lottie-preview {
  width: 100%;
  max-width: 600px;
  height: 500px;
  margin: 0 auto 20px;
  border: 2px solid #eee;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

/* 播放控制按钮 */
.controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

.control-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background-color: #409eff;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.control-btn:hover {
  background-color: #66b1ff;
}

.control-btn:active {
  background-color: #3a8ee6;
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

/* 图片资源列表 */
.image-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 单个图片资源项 */
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

/* 图片缩略图预览 */
.image-preview {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background: white;
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

/* 图片信息 */
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

/* 替换按钮 */
.replace-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  background-color: #67c23a;
  color: white;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: background-color 0.3s;
}

.replace-btn:hover {
  background-color: #85ce61;
}

.replace-btn:active {
  background-color: #5daf34;
}

/* ========== 响应式设计 ========== */
@media (max-width: 1024px) {
  .content-wrapper {
    flex-direction: column;
  }
}
</style>

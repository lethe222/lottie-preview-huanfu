<template>
  <Toast ref="toastRef" />
  <div class="main-box">
    <h1>Lottie 播放器与图片替换工具</h1>
    <p>只支持base64格式的lottie动画，可以替换动画中的图片资源</p>
    <router-link to="/Updatelog" class="updatelog"> 更新日志</router-link>

    <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop" @click="triggerFileInput">
      <p>📁 将base64格式的lottie动画文件拖拽到此区域</p>
      <p class="upload-hint">或点击选择文件</p>
    </div>

    <UrlImport @import-success="handleUrlImport" @toast="showToast" />

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
      <!-- 左侧：播放器组件 -->
      <LottiePlayer
        v-model="backgroundColor"
        :animation-data="currentAnimationData"
        :lottie-file-size="lottieFileSize"
        :original-file-name="originalFileName"
        :image-assets-count="imageAssets.length"
        @export-images="exportAllImages"
        @toast="showToast"
      />

      <!-- 右侧：资源列表组件 -->
      <ImageResourceList
        v-model="resourceListBackgroundColor"
        :image-assets="imageAssets"
        @replace-image="selectImageToReplace"
        @download-image="downloadImage"
        @export-images="exportAllImages"
        @batch-replace-images="handleBatchReplace"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
}
</script>

<script setup>
import { ref, computed, shallowRef } from 'vue'
import Toast from '../components/Toast.vue'
import LottiePlayer from '../components/LottiePlayer.vue'
import ImageResourceList from '../components/ImageResourceList.vue'
import UrlImport from '../components/UrlImport.vue'
import { fixNullKeyframes } from '../utils/lottieUtils'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// ========== 响应式数据 ==========
const toastRef = ref(null)
const fileInput = ref(null)
const imageInput = ref(null)
const currentAnimationData = shallowRef(null)
const currentReplacingAsset = ref(null)
const backgroundColor = ref('#ffffff')
const resourceListBackgroundColor = ref('#f5f7fa')
const originalFileName = ref('lottie-base64.json')
const lottieFileSize = ref(0)
const originalVectorStructure = ref(null)
const isLoading = ref(false)

// ========== 计算属性 ==========
const imageAssets = computed(() => {
  if (!currentAnimationData.value || !currentAnimationData.value.assets) return []
  return currentAnimationData.value.assets.filter((asset) => {
    return asset.w && asset.h && (asset.u || asset.p || asset.e === 1)
  })
})

// ========== 方法 ==========
const showToast = (msg) => toastRef.value?.show(msg)

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
    showToast('请上传 JSON 文件！')
  }
}

const loadJsonFile = async (file) => {
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const jsonData = JSON.parse(e.target.result)
      const size = (new Blob([e.target.result]).size / 1024).toFixed(2)
      processJsonData(jsonData, file.name, size)
    } catch (error) {
      showToast('JSON 文件格式错误：' + error.message)
    }
  }
  reader.readAsText(file)
}

const handleUrlImport = ({ data, name, size }) => {
  processJsonData(data, name, size)
}

const processJsonData = (jsonData, name, size) => {
  try {
    console.log('开始处理动画数据，大小:', size, 'KB')
    isLoading.value = true
    showToast('正在加载动画，请稍候...')

    // 计算动画数据大小
    const dataSize = JSON.stringify(jsonData).length
    console.log('动画数据实际大小:', (dataSize / 1024).toFixed(2), 'KB')

    // 检查数据大小是否超过合理范围
    if (dataSize > 5 * 1024 * 1024) {
      // 5MB
      showToast('动画文件过大，可能导致加载缓慢或失败')
    }

    // 使用 setTimeout 避免阻塞主线程
    setTimeout(() => {
      try {
        const fixedJsonData = fixNullKeyframes(jsonData)

        // Map layer names to assets if asset doesn't have nm
        if (fixedJsonData.assets && fixedJsonData.layers) {
          fixedJsonData.assets.forEach((asset) => {
            if (!asset.nm) {
              const layer = fixedJsonData.layers.find((l) => l.refId === asset.id)
              if (layer && layer.nm) {
                asset.nm = layer.nm
              }
            }
          })
        }

        currentAnimationData.value = fixedJsonData
        originalFileName.value = name
        lottieFileSize.value = size

        saveOriginalVectorStructure(fixedJsonData)
        showToast('动画加载成功！')
      } catch (error) {
        console.error('处理 JSON 数据失败:', error)
        showToast('处理 JSON 数据失败：' + error.message)
      } finally {
        isLoading.value = false
      }
    }, 100)
  } catch (error) {
    console.error('处理 JSON 数据失败:', error)
    showToast('处理 JSON 数据失败：' + error.message)
    isLoading.value = false
  }
}

const selectImageToReplace = (asset) => {
  currentReplacingAsset.value = asset
  imageInput.value.click()
}

const saveOriginalVectorStructure = (data) => {
  const structure = {}
  for (let i = 0; i < data.layers.length; i++) {
    const layer = data.layers[i]
    if (layer.ty === 4) {
      structure[i] = JSON.parse(JSON.stringify(layer.shapes || []))
    }
  }
  originalVectorStructure.value = structure
}

const optimizeVectorLayers = (data) => {
  if (!originalVectorStructure.value) return { optimizedCount: 0, pathsBefore: 0, pathsAfter: 0 }
  let optimizedCount = 0,
    pathsBefore = 0,
    pathsAfter = 0

  const countPaths = (shapes) => {
    let count = 0
    for (const shape of shapes) {
      if (shape.ty === 'gr') count += countPaths(shape.it || [])
      else if (shape.ty === 'sh') count++
    }
    return count
  }

  for (let i = 0; i < data.layers.length; i++) {
    const layer = data.layers[i]
    const originalShapes = originalVectorStructure.value[i]
    if (layer.ty === 4 && originalShapes) {
      const currentShapes = layer.shapes || []
      const currentPathCount = countPaths(currentShapes)
      const originalPathCount = countPaths(originalShapes)
      pathsBefore += currentPathCount
      if (currentPathCount > originalPathCount * 2) {
        layer.shapes = JSON.parse(JSON.stringify(originalShapes))
        optimizedCount++
        pathsAfter += originalPathCount
      } else pathsAfter += currentPathCount
    }
  }
  return { optimizedCount, pathsBefore, pathsAfter }
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
      // 创建一个新对象以触发 Vue 的响应式更新
      const newData = JSON.parse(JSON.stringify(currentAnimationData.value))
      newData.assets[assetIndex].p = base64Image
      newData.assets[assetIndex].u = ''
      newData.assets[assetIndex].e = 1

      const { optimizedCount, pathsBefore, pathsAfter } = optimizeVectorLayers(newData)
      currentAnimationData.value = newData

      if (optimizedCount > 0) {
        const reduction = pathsBefore - pathsAfter
        showToast(`图片替换成功！已优化 ${optimizedCount} 个矢量图层，减少 ${reduction} 个冗余路径`)
      } else {
        showToast('图片替换成功！')
      }
    }
    event.target.value = ''
    currentReplacingAsset.value = null
  }
  reader.readAsDataURL(file)
}

const handleBatchReplace = async (files) => {
  if (!currentAnimationData.value || !files.length) return

  showToast(`开始批量处理 ${files.length} 张图片...`)
  let replaceCount = 0
  const newData = JSON.parse(JSON.stringify(currentAnimationData.value))

  const readFileAsDataURL = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.readAsDataURL(file)
    })
  }

  // 建立文件名到 base64 的映射
  const fileMap = {}
  for (const file of files) {
    const base64 = await readFileAsDataURL(file)
    // 去掉扩展名进行匹配
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
    fileMap[fileNameWithoutExt.toLowerCase()] = base64
  }

  // 遍历 assets 进行替换
  newData.assets.forEach((asset) => {
    if (asset.w && asset.h && (asset.u || asset.p || asset.e === 1)) {
      const assetName = (asset.nm || asset.p || '').replace(/\.[^/.]+$/, '')
      if (assetName && fileMap[assetName.toLowerCase()]) {
        asset.p = fileMap[assetName.toLowerCase()]
        asset.u = ''
        asset.e = 1
        replaceCount++
      }
    }
  })

  if (replaceCount > 0) {
    const { optimizedCount } = optimizeVectorLayers(newData)
    currentAnimationData.value = newData
    showToast(
      `批量替换成功！共替换 ${replaceCount} 张图片${optimizedCount > 0 ? `，并优化 ${optimizedCount} 个矢量图层` : ''}`,
    )
  } else {
    showToast('未找到匹配的图片，请确保文件名与图层名一致')
  }
}

const downloadImage = (asset) => {
  const imageUrl = asset.p && asset.p.startsWith('data:image') ? asset.p : asset.u + asset.p
  if (!imageUrl) return
  const link = document.createElement('a')
  link.href = imageUrl

  let fileName = asset.nm
  if (!fileName) {
    if (asset.p && !asset.p.startsWith('data:image')) {
      fileName = asset.p
    } else {
      fileName = asset.id || 'lottie-image'
    }
  }

  if (!fileName.includes('.')) {
    let ext = 'png'
    if (asset.p && asset.p.startsWith('data:image')) {
      const mimeMatch = asset.p.match(/data:image\/(\w+);base64,/)
      ext = mimeMatch ? mimeMatch[1] : 'png'
    } else if (asset.p && !asset.p.startsWith('data:image')) {
      const extMatch = asset.p.match(/\.(\w+)$/)
      ext = extMatch ? extMatch[1] : 'png'
    }
    fileName = `${fileName}.${ext}`
  }

  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const exportAllImages = async () => {
  if (!currentAnimationData.value || !imageAssets.value.length) {
    showToast('当前动画没有图片资源可导出！')
    return
  }

  try {
    showToast('正在生成压缩包，请稍候...')
    const zip = new JSZip()
    let exportedCount = 0

    const promises = imageAssets.value.map(async (asset, index) => {
      try {
        let imageUrl = asset.p && asset.p.startsWith('data:image') ? asset.p : asset.u + asset.p
        if (!imageUrl) return

        let ext = 'png'
        if (asset.p && asset.p.startsWith('data:image')) {
          const mimeMatch = asset.p.match(/data:image\/(\w+);base64,/)
          ext = mimeMatch ? mimeMatch[1] : 'png'
        } else if (asset.p && !asset.p.startsWith('data:image')) {
          const extMatch = asset.p.match(/\.(\w+)$/)
          ext = extMatch ? extMatch[1] : 'png'
        }

        let fileName = asset.nm
        if (!fileName) {
          if (asset.p && !asset.p.startsWith('data:image')) {
            fileName = asset.p
          } else {
            fileName = `image_${asset.id || index}`
          }
        }

        if (!fileName.includes('.')) {
          fileName = `${fileName}.${ext}`
        }

        const response = await fetch(imageUrl)
        const blob = await response.blob()
        zip.file(fileName, blob)
        exportedCount++
      } catch (err) {
        console.error(`处理图片 ${asset.id} 失败:`, err)
      }
    })

    await Promise.all(promises)

    if (exportedCount > 0) {
      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, 'lottie_images.zip')
      showToast(`成功导出 ${exportedCount} 张图片压缩包！`)
    } else {
      showToast('没有可导出的图片！')
    }
  } catch (error) {
    console.error('导出图片失败:', error)
    showToast('导出图片失败：' + error.message)
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.main-box {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.updatelog {
  position: absolute;
  top: 15px;
  right: 40px;
  font-size: 13px;
  color: #606266;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  background-color: #f4f4f5;
  transition: all 0.3s ease;
}

.updatelog:hover {
  color: #409eff;
  background-color: #ecf5ff;
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

.content-wrapper {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

@media (max-width: 1024px) {
  .content-wrapper {
    flex-direction: column;
  }
}
</style>

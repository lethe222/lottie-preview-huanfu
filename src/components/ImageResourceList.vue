<template>
  <div class="right-section">
    <h3>图片资源列表</h3>
    <div class="background-controls">
      <label for="resourceBgColor">📂 资源列表背景：</label>
      <div class="color-picker-group">
        <input
          type="color"
          id="resourceBgColor"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
        />
        <input
          type="text"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          placeholder="#f5f7fa"
          class="color-input"
        />
        <button @click="$emit('update:modelValue', '#f5f7fa')" class="reset-btn">重置</button>
      </div>
    </div>

    <div v-if="imageAssets.length > 0" class="batch-actions">
      <button @click="triggerBatchReplace" class="batch-btn batch-btn-primary">批量替换图片</button>
      <button @click="$emit('exportImages')" class="batch-btn batch-btn-secondary">
        导出所有图片
      </button>
      <input
        ref="batchImageInput"
        type="file"
        multiple
        accept="image/*"
        class="hidden-input"
        @change="handleBatchImageSelect"
      />
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
          <p class="image-name" :title="getImageName(asset)">
            {{ getImageName(asset) }}
          </p>
          <p class="image-size">{{ asset.w }} x {{ asset.h }}｜{{ getImageSize(asset) }} KB</p>
        </div>

        <div class="image-actions">
          <button @click="$emit('replaceImage', asset)" class="replace-btn">替换图片</button>
          <button @click="$emit('downloadImage', asset)" class="download-btn">下载图片</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  imageAssets: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    default: '#f5f7fa',
  },
})

const emit = defineEmits([
  'update:modelValue',
  'replaceImage',
  'downloadImage',
  'exportImages',
  'batchReplaceImages',
])

const batchImageInput = ref(null)

const triggerBatchReplace = () => {
  batchImageInput.value.click()
}

const handleBatchImageSelect = (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    emit('batchReplaceImages', files)
  }
  event.target.value = ''
}

const getImageUrl = (asset) => {
  if (asset.p && asset.e === 1) return asset.p
  if (asset.u && asset.p) return asset.u + asset.p
  return ''
}

const getImageName = (asset) => {
  if (asset.nm) return asset.nm
  if (asset.p && !asset.p.startsWith('data:image')) return asset.p
  if (asset.u) return asset.u
  return '未命名'
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
  event.target.parentElement.innerHTML = '<div class="no-preview">加载失败</div>'
}

const getImageSize = (asset) => {
  try {
    let base64String = ''
    if (asset.p && asset.p.startsWith('data:image')) {
      base64String = asset.p.split(',')[1] || asset.p
    } else if (asset.p) {
      base64String = asset.p
    }
    if (!base64String) return '0'
    const sizeInBytes = base64String.length * 0.75
    return (sizeInBytes / 1024).toFixed(2)
  } catch (error) {
    return '0'
  }
}
</script>

<style scoped>
.right-section {
  flex: 1;
  min-width: 0;
}

.right-section > h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.background-controls {
  margin-bottom: 15px;
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

.batch-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.batch-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.batch-btn-primary {
  background-color: #409eff;
}

.batch-btn-primary:hover {
  background-color: #66b1ff;
  transform: translateY(-1px);
}

.batch-btn-secondary {
  background-color: #67c23a;
}

.batch-btn-secondary:hover {
  background-color: #85ce61;
  transform: translateY(-1px);
}

.hidden-input {
  display: none;
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
  background: v-bind(modelValue);
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
</style>

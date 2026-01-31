<template>
  <div class="url-import-container">
    <div class="input-group">
      <input
        v-model="url"
        type="text"
        placeholder="输入 Lottie JSON 链接 (例如: https://.../data.json)"
        class="url-input"
        @keyup.enter="handleImport"
      />
      <button :disabled="isLoading" class="import-btn" @click="handleImport">
        {{ isLoading ? '导入中...' : '在线导入' }}
      </button>
    </div>
    <p class="url-hint">支持直接输入 Lottie JSON 文件的网络地址进行预览和修改</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['import-success', 'toast'])

const url = ref('')
const isLoading = ref(false)

const handleImport = async () => {
  if (!url.value) {
    emit('toast', '请输入有效的 URL 地址')
    return
  }

  const trimmedUrl = url.value.trim()
  if (!trimmedUrl.startsWith('http')) {
    emit('toast', 'URL 地址必须以 http 或 https 开头')
    return
  }

  isLoading.value = true
  try {
    const response = await fetch(trimmedUrl)
    if (!response.ok) {
      throw new Error(`HTTP 错误! 状态码: ${response.status}`)
    }
    
    const jsonData = await response.json()
    
    // 从 URL 中提取文件名
    let fileName = 'online-lottie.json'
    try {
      const urlPath = new URL(trimmedUrl).pathname
      const lastPart = urlPath.split('/').pop()
      if (lastPart && lastPart.endsWith('.json')) {
        fileName = lastPart
      }
    } catch (e) {
      // 忽略解析错误，使用默认文件名
    }

    emit('import-success', {
      data: jsonData,
      name: fileName,
      size: (new Blob([JSON.stringify(jsonData)]).size / 1024).toFixed(2)
    })
    
    url.value = '' // 清空输入框
    emit('toast', '导入成功！')
  } catch (error) {
    console.error('导入失败:', error)
    emit('toast', '导入失败: ' + error.message)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.url-import-container {
  max-width: 600px;
  margin: 0 auto 30px;
  text-align: center;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.url-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.url-input:focus {
  border-color: #409eff;
}

.import-btn {
  padding: 10px 20px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.import-btn:hover:not(:disabled) {
  background-color: #66b1ff;
}

.import-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.url-hint {
  font-size: 12px;
  color: #909399;
  margin: 0;
}
</style>

<template>
  <div class="status-bar">
    <div class="voice-text">{{ canvasStore.currentVoiceText || '等待语音输入...' }}</div>
    <div class="status-info">
      <div class="status-item">
        <span :class="['status-icon', statusClass]">{{ statusIcon }}</span>
        <span>{{ statusText }}</span>
      </div>
      <div class="status-item">
        <span>对象数量: {{ canvasStore.objects.length }}</span>
      </div>
      <div v-if="canvasStore.error" class="error-message">
        {{ canvasStore.error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '../stores/canvasStore'

const canvasStore = useCanvasStore()

const statusIcon = computed(() => {
  switch (canvasStore.status) {
    case 'idle': return '⚪'
    case 'listening': return '🎤'
    case 'processing': return '⚙️'
    case 'generating': return '✨'
    default: return '⚪'
  }
})

const statusText = computed(() => {
  switch (canvasStore.status) {
    case 'idle': return '空闲'
    case 'listening': return '监听中'
    case 'processing': return '处理中'
    case 'generating': return '生成中'
    default: return '未知'
  }
})

const statusClass = computed(() => {
  return `status-${canvasStore.status}`
})
</script>

<style scoped>
.status-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.voice-text {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  min-height: 32px;
}

.status-info {
  display: flex;
  gap: 24px;
  align-items: center;
  font-size: 14px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-icon {
  font-size: 16px;
}

.status-idle {
  opacity: 0.7;
}

.status-listening {
  animation: pulse 1.5s ease-in-out infinite;
}

.status-processing {
  animation: spin 2s linear infinite;
}

.status-generating {
  animation: sparkle 1s ease-in-out infinite;
}

.error-message {
  color: #ff6b6b;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 500;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes sparkle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
</style>

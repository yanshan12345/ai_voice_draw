<template>
  <div class="voice-control">
    <!-- 文本输入（测试用，已注释）
    <div class="control-group text-input-group">
      <input
        v-model="textInput"
        type="text"
        placeholder="输入指令测试（无需麦克风）"
        @keyup.enter="handleTextSubmit"
        :disabled="canvasStore.status === 'processing' || canvasStore.status === 'generating'"
      />
      <button
        @click="handleTextSubmit"
        :disabled="!textInput.trim() || canvasStore.status === 'processing' || canvasStore.status === 'generating'"
      >
        发送
      </button>
    </div>
    -->

    <div class="control-group">
      <button
        @click="handleContinuousListening"
        :disabled="canvasStore.status === 'processing' || canvasStore.status === 'generating'"
        :class="{ active: canvasStore.status === 'listening' }"
      >
        {{ canvasStore.status === 'listening' ? '停止监听' : '开始监听' }}
      </button>

      <button
        @mousedown="handlePushToTalkStart"
        @mouseup="handlePushToTalkEnd"
        @mouseleave="handlePushToTalkEnd"
        :disabled="canvasStore.status === 'processing' || canvasStore.status === 'generating'"
        class="push-to-talk"
      >
        按住说话
      </button>
    </div>

    <div class="control-group">
      <button
        @click="handleUndo"
        :disabled="!canUndo || canvasStore.status !== 'idle'"
      >
        撤销
      </button>

      <button
        @click="handleRedo"
        :disabled="!canRedo || canvasStore.status !== 'idle'"
      >
        重做
      </button>

      <button
        @click="handleClear"
        :disabled="canvasStore.status !== 'idle'"
      >
        清空画布
      </button>
    </div>

    <div class="control-group">
      <select v-model="saveFormat" :disabled="canvasStore.status !== 'idle'">
        <option value="png">PNG</option>
        <option value="jpg">JPG</option>
      </select>

      <button
        @click="handleSave"
        :disabled="canvasStore.status !== 'idle'"
      >
        保存图片
      </button>
    </div>

    <div class="control-group">
      <button
        @click="handleToggleTTS"
        :class="{ active: ttsEnabled }"
      >
        TTS: {{ ttsEnabled ? '开' : '关' }}
      </button>
    </div>

    <div class="status-display">
      <span>状态: {{ statusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCanvasStore } from '../stores/canvasStore'

interface Props {
  onStartListening: () => void
  onStopListening: () => void
  onPushToTalk: (isStart: boolean) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onSave: (format: 'png' | 'jpg') => void
  onToggleTTS: () => void
  onTextInput?: (text: string) => void
  canUndo: boolean
  canRedo: boolean
  ttsEnabled: boolean
}

const props = defineProps<Props>()
const canvasStore = useCanvasStore()
const saveFormat = ref<'png' | 'jpg'>('png')
const textInput = ref('')

const statusText = computed(() => {
  const statusMap = {
    idle: '空闲',
    listening: '监听中',
    processing: '处理中',
    generating: '生成中'
  }
  return statusMap[canvasStore.status]
})

const handleContinuousListening = () => {
  if (canvasStore.status === 'listening') {
    props.onStopListening()
  } else {
    props.onStartListening()
  }
}

const handlePushToTalkStart = () => {
  props.onPushToTalk(true)
}

const handlePushToTalkEnd = () => {
  props.onPushToTalk(false)
}

const handleUndo = () => {
  props.onUndo()
}

const handleRedo = () => {
  props.onRedo()
}

const handleClear = () => {
  props.onClear()
}

const handleSave = () => {
  props.onSave(saveFormat.value)
}

const handleToggleTTS = () => {
  props.onToggleTTS()
}

const handleTextSubmit = () => {
  const text = textInput.value.trim()
  if (text && props.onTextInput) {
    props.onTextInput(text)
    textInput.value = ''
  }
}
</script>

<style scoped>
.voice-control {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid #ddd;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 999;
  display: flex;
  gap: 12px;
  align-items: center;
}

.control-group {
  display: flex;
  gap: 8px;
}

.text-input-group {
  flex: 1;
  max-width: 400px;
}

.text-input-group input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #999;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.push-to-talk:active:not(:disabled) {
  background: #2196F3;
  color: white;
}

select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.status-display {
  padding: 8px;
  background: white;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
  margin-left: auto;
}
</style>

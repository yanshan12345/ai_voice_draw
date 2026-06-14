<script setup lang="ts">
import { ref, computed } from 'vue'
import StatusBar from './components/StatusBar.vue'
import VoiceCanvas from './components/VoiceCanvas.vue'
import VoiceControl from './components/VoiceControl.vue'
import { useCanvasStore } from './stores/canvasStore'
import voiceInput from './modules/voiceInput'
import { VoiceOutputModule } from './modules/voiceOutput'
import historyManager from './modules/historyManager'
import { exporter } from './modules/exporter'

const canvasStore = useCanvasStore()
const voiceOutput = new VoiceOutputModule()

const canUndo = computed(() => historyManager.canUndo())
const canRedo = computed(() => historyManager.canRedo())
const ttsEnabled = ref(true)

const handleStartListening = () => {
  voiceInput.startContinuousListening()
}

const handleStopListening = () => {
  voiceInput.stopListening()
}

const handlePushToTalk = (isStart: boolean) => {
  if (isStart) {
    voiceInput.startPushToTalk()
  } else {
    voiceInput.stopPushToTalk()
  }
}

const handleUndo = () => {
  const state = historyManager.undo()
  if (state) {
    canvasStore.$state = state
    voiceOutput.speak('已撤销')
  }
}

const handleRedo = () => {
  const state = historyManager.redo()
  if (state) {
    canvasStore.$state = state
    voiceOutput.speak('已重做')
  }
}

const handleClear = () => {
  historyManager.push(canvasStore.$state)
  canvasStore.clearObjects()
  voiceOutput.speak('画布已清空')
}

const handleSave = (format: 'png' | 'jpg') => {
  const canvas = document.querySelector('canvas')
  if (canvas) {
    exporter.export(canvas, format)
    voiceOutput.speak('已保存')
  }
}

const handleToggleTTS = () => {
  ttsEnabled.value = !ttsEnabled.value
  voiceOutput.setEnabled(ttsEnabled.value)
  voiceOutput.speak(ttsEnabled.value ? '语音播报已打开' : '语音播报已关闭')
}

const handleTextInput = (text: string) => {
  // 直接触发 VoiceCanvas 的语音处理逻辑
  const event = new CustomEvent('text-input', { detail: text })
  window.dispatchEvent(event)
}
</script>

<template>
  <div id="app">
    <StatusBar />
    <VoiceCanvas />
    <VoiceControl
      :on-start-listening="handleStartListening"
      :on-stop-listening="handleStopListening"
      :on-push-to-talk="handlePushToTalk"
      :on-undo="handleUndo"
      :on-redo="handleRedo"
      :on-clear="handleClear"
      :on-save="handleSave"
      :on-toggle-t-t-s="handleToggleTTS"
      :on-text-input="handleTextInput"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :tts-enabled="ttsEnabled"
    />
  </div>
</template>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

#app > :nth-child(2) {
  /* VoiceCanvas 容器 */
  margin-top: 60px;
  margin-bottom: 80px;
  flex: 1;
  overflow: hidden;
}
</style>

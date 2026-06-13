<template>
  <div class="voice-canvas-container">
    <canvas ref="canvasRef" :width="store.config.width" :height="store.config.height"></canvas>

    <div v-if="store.currentVoiceText" class="voice-text">
      {{ store.currentVoiceText }}
    </div>

    <div class="status-indicator" :class="store.status">
      {{ statusText }}
    </div>

    <div v-if="store.error" class="error-message">
      {{ store.error }}
    </div>

    <HelpDialog :visible="showHelp" :onClose="() => showHelp = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useCanvasStore } from '../stores/canvasStore'
import voiceInput from '../modules/voiceInput'
import { VoiceOutputModule } from '../modules/voiceOutput'
import { canvasRenderer } from '../modules/canvasRenderer'
import historyManager from '../modules/historyManager'
import { commandPreprocessor } from '../modules/commandPreprocessor'
import { exporter } from '../modules/exporter'
import apiService from '../services/apiService'
import HelpDialog from './HelpDialog.vue'
import type { CanvasStateDTO, CanvasObject, ParsedCommand } from '../types'

const store = useCanvasStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const voiceOutput = new VoiceOutputModule()
const showHelp = ref(false)

const statusText = computed(() => {
  const statusMap = {
    idle: '就绪',
    listening: '监听中',
    processing: '处理中',
    generating: '生成中'
  }
  return statusMap[store.status]
})

onMounted(() => {
  if (!canvasRef.value) return

  // 初始化画布渲染器
  canvasRenderer.init(canvasRef.value, store.config.width, store.config.height)
  canvasRenderer.setBackground(store.config.backgroundColor)

  // 初始化语音输出
  voiceOutput.init({ lang: 'zh-CN', rate: 1.0, pitch: 1.0, volume: 1.0 })

  // 初始化语音输入
  voiceInput.init({ lang: 'zh-CN', continuous: true, interimResults: false })

  voiceInput.onResult((text: string) => {
    store.setCurrentVoiceText(text)
    handleVoiceResult(text)
  })

  voiceInput.onError((error: Error) => {
    store.setError(error.message)
  })

  voiceInput.onStart(() => {
    store.setStatus('listening')
  })

  voiceInput.startContinuousListening()
})

watch(() => store.objects, () => {
  canvasRenderer.render(store.getSortedObjects)
}, { deep: true })

async function handleVoiceResult(text: string) {
  // 防止处理中重复触发
  if (store.status !== 'idle' && store.status !== 'listening') {
    console.log('[语音] 正在处理中，忽略新输入:', text)
    return
  }

  store.setStatus('processing')
  store.setError(null)

  try {
    // 1. 本地指令预处理
    const preprocessResult = commandPreprocessor.preprocess(text)
    if (preprocessResult.isHandled && preprocessResult.command) {
      executeLocalCommand(preprocessResult.command)
      return
    }

    // 2. 发送后端解析
    const canvasState = buildCanvasStateDTO()
    const response = await apiService.parseCommand(text, canvasState)

    if (!response.success || !response.command) {
      store.setError(response.message || '无法理解该指令')
      voiceOutput.speak(response.message || '无法理解该指令')
      store.setStatus('idle')
      return
    }

    // 3. 执行指令
    if (response.requires_image_generation) {
      await handleImageGeneration(response.command)
    } else {
      executeCommand(response.command)
    }

    // 4. 记录历史
    historyManager.push(store.$state)

    // 5. TTS反馈
    voiceOutput.speak(response.message)
    store.setStatus('idle')
  } catch (error) {
    const msg = error instanceof Error ? error.message : '操作失败'
    // 忽略取消的请求
    if (msg === 'canceled' || msg.includes('abort')) {
      store.setStatus('idle')
      return
    }
    store.setError(msg)
    voiceOutput.speak(msg)
    store.setStatus('idle')
  }
}

function executeLocalCommand(command: any) {
  switch (command.type) {
    case 'undo':
      const undoState = historyManager.undo()
      if (undoState) {
        store.$state = undoState
        voiceOutput.speak('已撤销')
      } else {
        voiceOutput.speak('没有可撤销的操作')
      }
      break
    case 'redo':
      const redoState = historyManager.redo()
      if (redoState) {
        store.$state = redoState
        voiceOutput.speak('已重做')
      } else {
        voiceOutput.speak('没有可重做的操作')
      }
      break
    case 'clear':
      historyManager.push(store.$state)
      store.clearObjects()
      canvasRenderer.clear()
      canvasRenderer.setBackground(store.config.backgroundColor)
      voiceOutput.speak('画布已清空')
      break
    case 'save':
      if (canvasRef.value) {
        exporter.export(canvasRef.value, command.format || 'png')
        voiceOutput.speak('已保存')
      }
      break
    case 'help':
      showHelp.value = true
      voiceOutput.speak('帮助信息已显示')
      break
    case 'toggle_tts':
      const enabled = !voiceOutput.isEnabled()
      voiceOutput.setEnabled(enabled)
      voiceOutput.speak(enabled ? '语音播报已打开' : '语音播报已关闭')
      break
  }
  store.setStatus('idle')
}

async function handleImageGeneration(command: ParsedCommand) {
  store.setStatus('generating')

  const canvasContext = buildCanvasContext()
  const imgRes = await apiService.generateImage(
    command.parameters.prompt,
    canvasContext
  )

  if (!imgRes.success || !imgRes.image_url) {
    throw new Error(imgRes.error || '图像生成失败')
  }

  createImageObject(imgRes.image_url, command.parameters)
}

function createImageObject(imageUrl: string, params: any) {
  const obj: CanvasObject = {
    id: `obj-${Date.now()}`,
    type: 'image',
    name: params.name || '图像',
    position: params.position || { x: 960, y: 540 },
    size: params.size || { width: 200, height: 200 },
    rotation: 0,
    opacity: 1.0,
    zIndex: store.objects.length,
    data: {
      url: imageUrl,
      naturalWidth: 1024,
      naturalHeight: 1024
    }
  }
  store.addObject(obj)
}

function executeCommand(command: ParsedCommand) {
  switch (command.intent) {
    case 'adjust_object':
      if (command.target) {
        const obj = store.getObjectByName(command.target) || store.getObjectById(command.target)
        if (obj) {
          store.updateObject(obj.id, command.parameters)
        }
      }
      break
    case 'delete_object':
      if (command.target) {
        const obj = store.getObjectByName(command.target) || store.getObjectById(command.target)
        if (obj) {
          store.deleteObject(obj.id)
        }
      }
      break
  }
}

function buildCanvasStateDTO(): CanvasStateDTO {
  return {
    config: store.config,
    objects: store.objects.map(obj => ({
      ...obj,
      description: obj.name,
      createdAt: Date.now()
    }))
  }
}

function buildCanvasContext(): string {
  if (store.objects.length === 0) {
    return `空白画布，背景色：${store.config.backgroundColor}`
  }
  const names = store.objects.map(o => o.name).join('、')
  return `画布上有：${names}`
}
</script>

<style scoped>
.voice-canvas-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  width: 100%;
  background: #f5f5f5;
  overflow: hidden;
  padding-top: 100px;
  padding-bottom: 180px;
}

canvas {
  border: 1px solid #ddd;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  background: white;
}

.voice-text {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
}

.status-indicator {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

.status-indicator.idle {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-indicator.listening {
  background: #e3f2fd;
  color: #1565c0;
}

.status-indicator.processing {
  background: #fff3e0;
  color: #e65100;
}

.status-indicator.generating {
  background: #f3e5f5;
  color: #6a1b9a;
}

.error-message {
  position: absolute;
  top: 70px;
  right: 20px;
  background: #ffebee;
  color: #c62828;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
  max-width: 300px;
}
</style>

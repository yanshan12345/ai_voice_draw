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

  // 自动启动持续监听
  voiceInput.startContinuousListening()

  // 监听文本输入事件（用于测试）
  window.addEventListener('text-input', (e: Event) => {
    const text = (e as CustomEvent).detail
    store.setCurrentVoiceText(text)
    handleVoiceResult(text)
  })

  // 监听图像加载完成事件
  window.addEventListener('image-loaded', () => {
    console.log('[VoiceCanvas] 图像加载完成，触发重新渲染')
    canvasRenderer.render(store.getSortedObjects)  // getter，不加括号
  })
})

watch(() => store.objects, () => {
  console.log('[VoiceCanvas] watch 被触发，对象数量:', store.objects.length)
  const sorted = store.getSortedObjects  // getter，不加括号
  console.log('[VoiceCanvas] 排序后的对象:', sorted)
  canvasRenderer.render(sorted)
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
      store.setStatus('idle')  // 重置状态
      return
    }

    // 2. 发送后端解析
    const canvasState = buildCanvasStateDTO()
    console.log('[VoiceCanvas] 发送指令到后端:', text)
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
    console.error('[VoiceCanvas] 错误:', msg, error)

    // 忽略取消的请求
    if (msg === 'canceled' || msg.includes('abort')) {
      console.log('[VoiceCanvas] 请求被取消')
      store.setStatus('idle')
      return
    }

    // 处理超时错误
    if (msg.includes('timeout')) {
      store.setError('请求超时，请检查网络连接或后端服务')
      voiceOutput.speak('请求超时')
    } else {
      store.setError(msg)
      voiceOutput.speak(msg)
    }

    store.setStatus('idle')  // 确保状态被重置
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
  console.log('[VoiceCanvas] createImageObject 被调用')
  console.log('[VoiceCanvas] 图像URL:', imageUrl)
  console.log('[VoiceCanvas] 参数:', params)

  // 生成唯一且有意义的名称
  const defaultName = params.name || `图像${store.objects.length + 1}`

  const obj: CanvasObject = {
    id: `obj-${Date.now()}`,
    type: 'image',
    name: defaultName,
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

  console.log('[VoiceCanvas] 创建的对象:', obj)
  console.log('[VoiceCanvas] 添加前 store.objects 长度:', store.objects.length)

  store.addObject(obj)

  console.log('[VoiceCanvas] 添加后 store.objects 长度:', store.objects.length)
  console.log('[VoiceCanvas] 当前所有对象:', store.objects)
}

function executeCommand(command: ParsedCommand) {
  console.log('[VoiceCanvas] executeCommand 被调用, intent:', command.intent)
  console.log('[VoiceCanvas] command:', command)

  switch (command.intent) {
    case 'adjust_object':
      if (command.target) {
        const obj = store.getObjectByName(command.target) || store.getObjectById(command.target)
        console.log('[VoiceCanvas] 找到的对象:', obj)
        console.log('[VoiceCanvas] 调整参数:', command.parameters)

        if (obj) {
          // 处理相对调整（如"放大3倍"）
          const updates: Partial<CanvasObject> = {}

          // 处理尺寸调整
          if (command.parameters.size) {
            updates.size = command.parameters.size
          } else if (command.parameters.scale) {
            // 如果是缩放倍数
            const scale = command.parameters.scale
            updates.size = {
              width: obj.size.width * scale,
              height: obj.size.height * scale
            }
          }

          // 处理位置调整
          if (command.parameters.position) {
            updates.position = command.parameters.position
          }

          // 处理其他属性
          if (command.parameters.rotation !== undefined) {
            updates.rotation = command.parameters.rotation
          }
          if (command.parameters.opacity !== undefined) {
            updates.opacity = command.parameters.opacity
          }

          console.log('[VoiceCanvas] 应用的更新:', updates)
          store.updateObject(obj.id, updates)
          console.log('[VoiceCanvas] 更新后的对象:', store.getObjectById(obj.id))
        } else {
          console.log('[VoiceCanvas] 未找到目标对象:', command.target)
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
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  overflow: auto;
}

canvas {
  border: 1px solid #ddd;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  background: white;
  max-width: 95%;
  max-height: 95%;
  object-fit: contain;
}

.voice-text {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  z-index: 10;
}

.status-indicator {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  z-index: 10;
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
  z-index: 10;
}
</style>

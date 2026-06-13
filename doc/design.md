# AI语音绘图工具 - 技术设计文档

**项目名称**: AI Voice Draw  
**版本**: v1.0  
**日期**: 2026-06-13  
**状态**: 技术设计阶段

---

## 1. 系统架构设计

### 1.1 总体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Vue 3)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  语音输入模块  │  │  语音输出模块  │  │  UI交互模块   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  画布渲染模块  │  │  状态管理模块  │  │  指令预处理   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  历史管理模块  │  │  导出模块    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │ HTTP API
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      后端 (FastAPI)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  API路由层   │  │  指令解析服务  │  │  AI服务层    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                    ┌──────────────┐  ┌──────────────┐      │
│                    │  Prompt工程  │  │  错误处理    │      │
│                    └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    阿里云百炼平台                             │
│        qwen-3.7plus (推理)  +  qwen-image (生图)             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选型

**前端**:
- Vue 3 (Composition API)
- Pinia (状态管理)
- Canvas API (画布渲染)
- Web Speech API (语音交互)
- Axios (HTTP请求)

**后端**:
- FastAPI (Web框架)
- Pydantic (数据验证)
- httpx (异步HTTP客户端)
- python-dotenv (环境变量管理)

---

## 2. 前端模块设计

### 2.1 语音输入模块 (VoiceInput)

**职责**: 
- 封装Web Speech API的SpeechRecognition
- 提供多种监听模式
- 处理识别结果和错误

**接口**:
```typescript
interface VoiceInputModule {
  // 初始化语音识别
  init(config: VoiceConfig): void
  
  // 启动持续监听
  startContinuousListening(): void
  
  // 停止监听
  stopListening(): void
  
  // 按键激活模式（按住说话）
  startPushToTalk(): void
  stopPushToTalk(): void
  
  // 唤醒词检测
  enableWakeWord(word: string): void
  
  // 事件监听
  onResult(callback: (text: string, confidence: number) => void): void
  onError(callback: (error: Error) => void): void
  onStart(callback: () => void): void
  onEnd(callback: () => void): void
}

interface VoiceConfig {
  lang: string           // 语言 'zh-CN'
  continuous: boolean    // 是否持续识别
  interimResults: boolean // 是否返回中间结果
}
```

**实现要点**:
- 使用单例模式确保只有一个识别实例
- 支持识别状态管理（空闲、监听中、识别中）
- 处理浏览器兼容性问题
- 实现自动重连机制（识别意外中断时）

**文件位置**: `src/modules/voiceInput.ts`

---

### 2.2 语音输出模块 (VoiceOutput)

**职责**:
- 封装Web Speech API的SpeechSynthesis
- 提供TTS播报功能
- 管理播报队列

**接口**:
```typescript
interface VoiceOutputModule {
  // 初始化TTS
  init(config: TTSConfig): void
  
  // 播报文本
  speak(text: string, priority?: 'high' | 'normal'): Promise<void>
  
  // 停止播报
  stop(): void
  
  // 暂停/恢复
  pause(): void
  resume(): void
  
  // 设置开关
  setEnabled(enabled: boolean): void
  isEnabled(): boolean
}

interface TTSConfig {
  lang: string       // 'zh-CN'
  rate: number       // 语速 0.1-10
  pitch: number      // 音调 0-2
  volume: number     // 音量 0-1
}
```

**实现要点**:
- 使用队列管理多个播报请求
- 支持优先级（高优先级打断当前播报）
- 提供开关控制

**文件位置**: `src/modules/voiceOutput.ts`

---

### 2.3 画布渲染模块 (CanvasRenderer)

**职责**:
- 管理Canvas元素和渲染上下文
- 渲染画布对象（图像、几何图形）
- 处理对象变换（位置、缩放、旋转）

**接口**:
```typescript
interface CanvasRendererModule {
  // 初始化画布
  init(canvas: HTMLCanvasElement, width: number, height: number): void
  
  // 渲染所有对象
  render(objects: CanvasObject[]): void
  
  // 清空画布
  clear(): void
  
  // 设置背景
  setBackground(color: string | ImageData): void
  
  // 导出图像
  exportImage(format: 'png' | 'jpg', quality?: number): Blob
  
  // 坐标转换
  screenToCanvas(x: number, y: number): {x: number, y: number}
}

interface CanvasObject {
  id: string
  type: 'image' | 'shape' | 'text'
  name: string
  position: {x: number, y: number}
  size: {width: number, height: number}
  rotation: number
  opacity: number
  zIndex: number
  
  // 类型特定数据
  data: ImageData | ShapeData | TextData
}

interface ImageData {
  url: string
  naturalWidth: number
  naturalHeight: number
}

interface ShapeData {
  shapeType: 'circle' | 'rectangle' | 'line' | 'ellipse'
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  // 形状特定参数
  params: Record<string, any>
}

interface TextData {
  content: string
  font: string
  fontSize: number
  color: string
}
```

**实现要点**:
- 使用离屏Canvas优化性能
- 支持分层渲染（按zIndex排序）
- 实现对象变换矩阵计算
- 图像预加载和缓存

**文件位置**: `src/modules/canvasRenderer.ts`

---

### 2.4 状态管理模块 (Store - Pinia)

**职责**:
- 管理画布状态（对象列表、配置）
- 提供状态修改接口
- 与其他模块解耦

**状态结构**:
```typescript
interface CanvasState {
  // 画布配置
  config: {
    width: number
    height: number
    backgroundColor: string
  }
  
  // 画布对象列表
  objects: CanvasObject[]
  
  // 选中的对象ID
  selectedObjectId: string | null
  
  // 操作状态
  status: 'idle' | 'listening' | 'processing' | 'generating'
  
  // 语音识别结果
  currentVoiceText: string
  
  // 错误信息
  error: string | null
}

interface CanvasStore {
  // 状态
  state: CanvasState
  
  // Getters
  getObjectById(id: string): CanvasObject | null
  getObjectByName(name: string): CanvasObject | null
  getSortedObjects(): CanvasObject[]  // 按zIndex排序
  
  // Actions
  addObject(obj: CanvasObject): void
  updateObject(id: string, updates: Partial<CanvasObject>): void
  deleteObject(id: string): void
  clearObjects(): void
  setStatus(status: CanvasState['status']): void
  setError(error: string | null): void
}
```

**文件位置**: `src/stores/canvasStore.ts`

---

### 2.5 历史管理模块 (HistoryManager)

**职责**:
- 记录画布状态历史
- 提供撤销/重做功能
- 管理历史栈

**接口**:
```typescript
interface HistoryManagerModule {
  // 记录新状态
  push(state: CanvasState): void
  
  // 撤销
  undo(): CanvasState | null
  
  // 重做
  redo(): CanvasState | null
  
  // 查询
  canUndo(): boolean
  canRedo(): boolean
  
  // 清空历史
  clear(): void
  
  // 获取历史记录数
  getHistoryLength(): number
}
```

**实现要点**:
- 使用双栈结构（undo栈 + redo栈）
- 深拷贝状态避免引用污染
- 限制历史记录数量（如50条）

**文件位置**: `src/modules/historyManager.ts`

---

### 2.6 指令预处理模块 (CommandPreprocessor)

**职责**:
- 快速匹配常用指令关键词
- 避免简单指令也发送到后端

**接口**:
```typescript
interface CommandPreprocessorModule {
  // 预处理指令
  preprocess(text: string): PreprocessResult
}

interface PreprocessResult {
  isHandled: boolean
  command?: LocalCommand
  originalText: string
}

type LocalCommand = 
  | {type: 'undo'}
  | {type: 'redo'}
  | {type: 'clear'}
  | {type: 'save', format?: 'png' | 'jpg'}
  | {type: 'help'}
  | {type: 'toggle_tts'}
  | {type: 'unknown'}
```

**关键词映射**:
```typescript
const KEYWORDS = {
  undo: ['撤销', '后退', '回退', '上一步'],
  redo: ['重做', '前进', '下一步'],
  clear: ['清空', '清空画布', '全部删除'],
  save: ['保存', '导出', '下载'],
  help: ['帮助', '怎么用', '使用方法'],
  toggle_tts: ['关闭语音', '打开语音', '语音播报']
}
```

**文件位置**: `src/modules/commandPreprocessor.ts`

---

### 2.7 导出模块 (Exporter)

**职责**:
- 将Canvas导出为图像文件
- 触发浏览器下载

**接口**:
```typescript
interface ExporterModule {
  // 导出并下载
  export(canvas: HTMLCanvasElement, format: 'png' | 'jpg', filename?: string): void
}
```

**实现**:
```typescript
export(canvas, format, filename = `ai-voice-draw-${Date.now()}`) {
  const blob = canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }, `image/${format}`, format === 'jpg' ? 0.9 : 1.0)
}
```

**文件位置**: `src/modules/exporter.ts`

---

## 3. 后端模块设计

### 3.1 API路由层

**职责**:
- 定义HTTP接口
- 请求参数验证
- 响应格式统一

**API端点**:
```python
# app/routes.py

@app.post("/api/command/parse")
async def parse_command(request: CommandRequest) -> CommandResponse:
    """解析语音指令"""
    pass

@app.post("/api/image/generate")
async def generate_image(request: ImageGenerateRequest) -> ImageGenerateResponse:
    """生成图像"""
    pass

@app.get("/api/health")
async def health_check() -> dict:
    """健康检查"""
    return {"status": "ok"}
```

**文件位置**: `app/routes.py`

---

### 3.2 指令解析服务 (CommandParser)

**职责**:
- 调用qwen-3.7plus理解用户意图
- 将自然语言转换为结构化指令
- 处理模糊指令

**接口**:
```python
class CommandParser:
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
    
    async def parse(
        self, 
        text: str, 
        canvas_state: CanvasStateDict
    ) -> ParsedCommand:
        """解析指令"""
        pass
    
    def _build_prompt(
        self, 
        text: str, 
        canvas_state: CanvasStateDict
    ) -> str:
        """构建prompt"""
        pass
```

**数据模型**:
```python
from pydantic import BaseModel
from typing import Literal, Optional, Dict, Any

class ParsedCommand(BaseModel):
    intent: Literal[
        "create_object",
        "adjust_object", 
        "delete_object",
        "query_state",
        "canvas_operation"
    ]
    target: Optional[str] = None  # 对象ID或名称
    action: str
    parameters: Dict[str, Any]
    confirmation_needed: bool = False
    confidence: float  # 0-1
```

**Prompt模板**:
```python
PARSE_PROMPT_TEMPLATE = """
你是一个语音绘图助手，需要将用户的自然语言指令转换为结构化命令。

当前画布状态：
{canvas_state_json}

用户指令：{user_text}

请分析用户意图，输出JSON格式：
{{
  "intent": "create_object | adjust_object | delete_object | query_state | canvas_operation",
  "target": "对象名称或ID（如果适用）",
  "action": "具体操作描述",
  "parameters": {{
    "position": {{"x": 100, "y": 200}},
    "size": {{"width": 150, "height": 150}},
    "prompt": "生图提示词"
  }},
  "confidence": 0.95
}}
"""
```

**文件位置**: `app/services/command_parser.py`

---

### 3.3 AI服务层 (AIService)

**职责**:
- 封装阿里云百炼API调用
- 管理API密钥
- 处理重试和错误

**接口**:
```python
class AIService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.AsyncClient()
    
    async def chat_completion(
        self, 
        messages: List[Dict],
        model: str = "qwen-3.7plus"
    ) -> str:
        """调用对话模型"""
        pass
    
    async def generate_image(
        self, 
        prompt: str,
        model: str = "qwen-image",
        size: str = "1024x1024"
    ) -> str:
        """生成图像，返回URL"""
        pass
    
    async def _retry_request(
        self, 
        func, 
        max_retries: int = 3
    ):
        """重试机制"""
        pass
```

**配置**:
```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ALIYUN_API_KEY: str
    QWEN_CHAT_MODEL: str = "qwen-3.7plus"
    QWEN_IMAGE_MODEL: str = "qwen-image"
    MAX_RETRIES: int = 3
    TIMEOUT: int = 30
    
    class Config:
        env_file = ".env"
```

**文件位置**: `app/services/ai_service.py`, `app/config.py`

---

### 3.4 Prompt工程模块

**职责**:
- 管理各类prompt模板
- 动态生成上下文

**关键Prompt**:

1. **指令解析Prompt** (已在3.2展示)

2. **图像生成Prompt增强**:
```python
def enhance_image_prompt(
    user_description: str,
    canvas_context: str
) -> str:
    """增强生图prompt"""
    return f"""
高质量数字绘画，{user_description}。
画面风格：简洁明快，色彩鲜明。
画布背景：{canvas_context}
要求：主体清晰，背景透明或纯色，适合叠加。
"""
```

**文件位置**: `app/services/prompt_templates.py`

---

### 3.5 错误处理模块

**职责**:
- 统一异常处理
- 错误码定义
- 用户友好的错误信息

**错误码**:
```python
class ErrorCode:
    INVALID_COMMAND = 1001
    AI_SERVICE_ERROR = 2001
    IMAGE_GENERATION_FAILED = 2002
    RATE_LIMIT_EXCEEDED = 3001
    INTERNAL_ERROR = 5000

ERROR_MESSAGES = {
    1001: "无法理解该指令，请重新描述",
    2001: "AI服务暂时不可用",
    2002: "图像生成失败",
    3001: "请求过于频繁，请稍后再试",
    5000: "系统内部错误"
}
```

**异常处理器**:
```python
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error_code": 5000,
            "message": ERROR_MESSAGES[5000]
        }
    )
```

**文件位置**: `app/errors.py`

---

## 4. 数据结构设计

### 4.1 画布状态结构

```typescript
// 前端状态
interface CanvasStateDTO {
  config: {
    width: number
    height: number
    backgroundColor: string
  }
  objects: CanvasObjectDTO[]
}

interface CanvasObjectDTO {
  id: string                    // UUID
  type: 'image' | 'shape' | 'text'
  name: string                  // 用户命名，如"太阳"、"云朵"
  description: string           // 详细描述，供AI理解
  position: {x: number, y: number}
  size: {width: number, height: number}
  rotation: number              // 角度 0-360
  opacity: number               // 0-1
  zIndex: number                // 层级
  createdAt: number             // 时间戳
  data: ImageDataDTO | ShapeDataDTO | TextDataDTO
}
```

### 4.2 API请求/响应结构

**指令解析接口**:
```python
# 请求
class CommandRequest(BaseModel):
    text: str                           # 识别的语音文本
    canvas_state: CanvasStateDict       # 当前画布状态
    
class CanvasStateDict(TypedDict):
    config: dict
    objects: List[dict]

# 响应
class CommandResponse(BaseModel):
    success: bool
    command: Optional[ParsedCommand]
    message: str                        # 反馈信息
    requires_image_generation: bool     # 是否需要生图
```

**图像生成接口**:
```python
# 请求
class ImageGenerateRequest(BaseModel):
    prompt: str                 # 生图提示词
    canvas_context: str         # 画布上下文描述
    size: str = "1024x1024"     # 图像尺寸

# 响应
class ImageGenerateResponse(BaseModel):
    success: bool
    image_url: Optional[str]    # 生成的图像URL
    error: Optional[str]
```

---

## 5. API接口设计

### 5.1 接口列表

| 端点 | 方法 | 描述 | 优先级 |
|------|------|------|--------|
| `/api/command/parse` | POST | 解析语音指令 | P0 |
| `/api/image/generate` | POST | 生成图像 | P0 |
| `/api/health` | GET | 健康检查 | P0 |

### 5.2 详细接口文档

#### 5.2.1 POST /api/command/parse

**描述**: 解析用户语音指令，返回结构化命令

**请求体**:
```json
{
  "text": "在左上角添加一朵云",
  "canvas_state": {
    "config": {
      "width": 1920,
      "height": 1080,
      "backgroundColor": "#87CEEB"
    },
    "objects": [
      {
        "id": "obj-001",
        "type": "image",
        "name": "太阳",
        "description": "红色的太阳",
        "position": {"x": 1500, "y": 200},
        "size": {"width": 200, "height": 200},
        "rotation": 0,
        "opacity": 1.0,
        "zIndex": 1
      }
    ]
  }
}
```

**响应体**:
```json
{
  "success": true,
  "command": {
    "intent": "create_object",
    "target": null,
    "action": "添加云朵对象",
    "parameters": {
      "name": "云朵",
      "position": {"x": 300, "y": 200},
      "prompt": "a white fluffy cloud, simple, cartoon style"
    },
    "confidence": 0.92,
    "confirmation_needed": false
  },
  "message": "正在生成云朵图像",
  "requires_image_generation": true
}
```

**错误响应**:
```json
{
  "success": false,
  "error_code": 1001,
  "message": "无法理解该指令，请重新描述"
}
```

---

#### 5.2.2 POST /api/image/generate

**描述**: 调用qwen-image生成图像

**请求体**:
```json
{
  "prompt": "a white fluffy cloud, simple, cartoon style",
  "canvas_context": "蓝天背景，已有红色太阳",
  "size": "1024x1024"
}
```

**响应体**:
```json
{
  "success": true,
  "image_url": "https://dashscope.aliyuncs.com/...",
  "error": null
}
```

---

## 6. 关键流程设计

### 6.1 完整指令执行流程

```
1. 用户语音输入
   ↓
2. Web Speech API识别 → 文本
   ↓
3. 前端指令预处理
   ├─ 匹配到本地指令 → 直接执行（撤销、保存等）
   └─ 未匹配 → 继续
   ↓
4. 发送到后端 POST /api/command/parse
   - 携带: 识别文本 + 画布状态JSON
   ↓
5. 后端指令解析
   ├─ qwen-3.7plus理解意图
   ├─ 生成结构化指令
   └─ 返回 ParsedCommand
   ↓
6. 前端接收指令
   ├─ intent: create_object
   │   ├─ 发送 POST /api/image/generate
   │   ├─ 后端调用 qwen-image 生图
   │   ├─ 返回图像URL
   │   └─ 前端创建新对象并渲染
   │
   ├─ intent: adjust_object
   │   ├─ 根据parameters调整对象属性
   │   └─ 重新渲染
   │
   ├─ intent: delete_object
   │   ├─ 从objects列表删除
   │   └─ 重新渲染
   │
   └─ intent: query_state
       └─ TTS播报结果
   ↓
7. 更新历史记录（用于撤销）
   ↓
8. TTS播报操作结果
```

### 6.2 状态同步流程

**无状态设计**:
- 后端不保存画布状态
- 每次请求前端发送完整状态
- 后端基于请求中的状态返回指令

**优势**:
- 无需session管理
- 无需数据库
- 支持多标签页独立操作
- 简化部署

### 6.3 错误处理流程

```
发生错误
  ↓
后端捕获异常
  ↓
返回结构化错误响应
  {
    "success": false,
    "error_code": 2001,
    "message": "AI服务暂时不可用"
  }
  ↓
前端接收错误
  ↓
┌─ 显示错误提示
└─ TTS播报错误信息
  ↓
恢复到可操作状态
```

---

## 7. 前端项目结构

```
src/
├── main.ts                 # 入口文件
├── App.vue                 # 根组件
├── components/
│   ├── VoiceCanvas.vue    # 主画布组件
│   ├── VoiceControl.vue   # 语音控制面板
│   ├── StatusBar.vue      # 状态栏（识别结果显示）
│   └── HelpDialog.vue     # 帮助对话框
├── modules/
│   ├── voiceInput.ts      # 语音输入模块
│   ├── voiceOutput.ts     # 语音输出模块
│   ├── canvasRenderer.ts  # 画布渲染模块
│   ├── historyManager.ts  # 历史管理模块
│   ├── commandPreprocessor.ts  # 指令预处理
│   └── exporter.ts        # 导出模块
├── stores/
│   └── canvasStore.ts     # Pinia状态管理
├── services/
│   └── apiService.ts      # HTTP请求封装
├── types/
│   └── index.ts           # TypeScript类型定义
└── utils/
    ├── constants.ts       # 常量定义
    └── helpers.ts         # 工具函数
```

---

## 8. 后端项目结构

```
app/
├── main.py                # FastAPI应用入口
├── routes.py              # API路由定义
├── config.py              # 配置管理
├── errors.py              # 错误处理
├── models/
│   ├── request.py         # 请求模型
│   └── response.py        # 响应模型
├── services/
│   ├── ai_service.py      # AI服务封装
│   ├── command_parser.py  # 指令解析服务
│   └── prompt_templates.py # Prompt模板
└── utils/
    └── helpers.py         # 工具函数

# 根目录
.env                       # 环境变量（API密钥）
requirements.txt           # Python依赖
```

---

## 9. 部署方案

### 9.1 开发环境

**前端**:
```bash
npm install
npm run dev  # 端口: 5173
```

**后端**:
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**跨域配置**:
```python
# app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 9.2 生产环境

**前端**:
- 构建: `npm run build`
- 部署: 静态文件托管（Vercel、Netlify、阿里云OSS）

**后端**:
- 容器化: Docker
- 部署: 云服务器、阿里云函数计算

**Dockerfile示例**:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 10. 性能优化策略

### 10.1 前端优化

| 优化项 | 方案 |
|--------|------|
| Canvas渲染 | 使用离屏Canvas缓存静态对象 |
| 图像加载 | 预加载+缓存，显示加载进度 |
| 状态更新 | 使用Vue的computed避免不必要的重新渲染 |
| 历史记录 | 限制历史栈大小（50条） |

### 10.2 后端优化

| 优化项 | 方案 |
|--------|------|
| API调用 | 连接池复用，异步并发 |
| 超时处理 | 设置合理的超时时间（30s） |
| 重试机制 | 指数退避重试 |
| 日志记录 | 结构化日志，便于排查 |

---

## 11. 测试策略

### 11.1 前端单元测试

**测试框架**: Vitest

**测试范围**:
- 各模块的独立功能（voiceInput、canvasRenderer等）
- Pinia store的状态管理逻辑
- 工具函数

**示例**:
```typescript
// voiceInput.test.ts
describe('VoiceInput', () => {
  test('should initialize with correct config', () => {
    const voiceInput = new VoiceInput()
    voiceInput.init({lang: 'zh-CN', continuous: true})
    expect(voiceInput.config.lang).toBe('zh-CN')
  })
})
```

### 11.2 后端单元测试

**测试框架**: pytest

**测试范围**:
- 指令解析逻辑
- Prompt模板生成
- 错误处理

**示例**:
```python
# test_command_parser.py
def test_parse_create_object_command():
    parser = CommandParser(mock_ai_service)
    result = await parser.parse("画一个太阳", canvas_state)
    assert result.intent == "create_object"
    assert "太阳" in result.parameters["name"]
```

### 11.3 集成测试

- 完整的语音输入→指令解析→图像生成→渲染流程
- 撤销/重做功能测试
- 错误场景测试（网络断开、API失败）

---

## 12. 模块依赖关系图

```
┌─────────────────────────────────────────────────────────┐
│                      VoiceCanvas.vue                     │
│                      (主组件/协调层)                       │
└───────────┬─────────────────────────────────────────────┘
            │
            ├─→ VoiceInput ────→ 识别结果
            │                      ↓
            ├─→ CommandPreprocessor ───→ 本地指令/需后端处理
            │                              ↓
            ├─→ ApiService ────→ 后端解析 ────→ ParsedCommand
            │                      ↓
            ├─→ CanvasStore ←──── 状态更新
            │        ↓
            ├─→ HistoryManager ←─ 记录状态
            │
            ├─→ CanvasRenderer ←─ 读取状态 ───→ 渲染画布
            │
            ├─→ VoiceOutput ←──── 播报反馈
            │
            └─→ Exporter ←──────── 导出请求
```

**依赖原则**:
- 各模块独立，通过接口通信
- CanvasStore作为数据中心
- 主组件负责协调各模块
- 模块间避免直接依赖

---

## 13. 开发里程碑

### Phase 1: 核心功能（2周）
- ✅ 前端基础架构搭建
- ✅ 语音输入/输出模块
- ✅ 画布渲染模块
- ✅ 后端API框架
- ✅ 指令解析服务
- ✅ 图像生成集成

### Phase 2: 完整MVP（1周）
- ✅ 历史管理（撤销/重做）
- ✅ 导出功能
- ✅ 错误处理
- ✅ 基础测试

### Phase 3: 优化增强（1周）
- ✅ 几何图形模式
- ✅ 帮助系统
- ✅ 性能优化
- ✅ 完整测试

---

## 14. 风险与挑战

| 风险 | 应对措施 |
|------|----------|
| 语音识别准确率 | 提供文字纠错，TTS确认机制 |
| AI理解偏差 | 优化prompt，添加示例，降低置信度阈值时要求确认 |
| 生图延迟 | 显示进度，提供取消功能 |
| 浏览器兼容性 | 检测API支持，提示推荐浏览器 |
| API配额限制 | 监控使用量，实现请求限流 |

---

**文档状态**: 设计完成  
**下一步**: 开始前端基础架构搭建

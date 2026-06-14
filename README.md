# AI Voice Draw - AI语音绘图工具

> 纯语音交互的AI绘图工具，无需鼠标和键盘，用自然语言描述即可完成绘图创作。

---

## 📖 项目简介

AI Voice Draw 是一个创新的语音绘图工具，用户通过语音指令即可完成绘图创作，无需使用鼠标或键盘。项目旨在为视障人群、肢体不便用户提供绘图能力，同时也为所有用户提供更自然的创意表达方式。

### 核心特性

- 🎤 **纯语音交互** - 完整的语音输入输出，支持中文识别和TTS播报
- 🎨 **AI智能生成** - 基于阿里云百炼平台的qwen-image模型自动生成图像
- 🔄 **实时调整** - 语音调整对象位置、大小、旋转、透明度
- ↩️ **撤销重做** - 完整的历史记录管理
- 💾 **快速导出** - 一句话保存作品为PNG/JPG格式
- 🚀 **即开即用** - 无需登录注册，打开网页即可使用

---

## 🎯 功能概览

### 智能生成模式
```
用户: "生成一个红色的太阳"
系统: 自动生成图像并智能放置到画布
```

### 快速调整模式
```
用户: "把太阳放大一点"
用户: "向右移动"
用户: "旋转30度"
系统: 实时调整对象属性
```

### 画布操作
- 撤销/重做
- 删除对象
- 清空画布
- 查询画布状态

### 导出保存
```
用户: "保存作品"
系统: 自动下载PNG文件
```

---

## 🛠️ 技术栈

### 前端
- **框架**: Vue 3 (Composition API)
- **状态管理**: Pinia
- **语音交互**: Web Speech API (SpeechRecognition + SpeechSynthesis)
- **画布渲染**: Canvas API
- **HTTP请求**: Axios

### 后端
- **框架**: FastAPI
- **数据验证**: Pydantic
- **异步HTTP**: httpx
- **AI服务**: 阿里云百炼平台
  - **推理模型**: qwen-plus (指令理解)
  - **生图模型**: wanx-v1 (图像生成)

### 架构特点
- ✅ 前后端分离
- ✅ 无状态后端（无需数据库/session）
- ✅ 模块化设计（便于测试和维护）
- ✅ RESTful API

---

## 📁 项目结构

```
ai_voice_draw/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/      # Vue组件
│   │   │   ├── VoiceCanvas.vue      # 画布组件
│   │   │   ├── VoiceControl.vue     # 语音控制面板
│   │   │   ├── StatusBar.vue        # 状态栏
│   │   │   └── HelpDialog.vue       # 帮助对话框
│   │   ├── modules/         # 核心模块
│   │   │   ├── voiceInput.ts        # 语音识别
│   │   │   ├── voiceOutput.ts       # 语音合成
│   │   │   ├── canvasRenderer.ts    # 画布渲染
│   │   │   ├── historyManager.ts    # 历史管理
│   │   │   ├── commandPreprocessor.ts # 指令预处理
│   │   │   └── exporter.ts          # 导出功能
│   │   ├── stores/          # Pinia状态管理
│   │   │   └── canvasStore.ts       # 画布状态
│   │   ├── services/        # API服务
│   │   │   └── apiService.ts        # 后端API调用
│   │   ├── types/           # TypeScript类型定义
│   │   │   └── index.ts
│   │   └── utils/           # 工具函数
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # 后端项目
│   ├── app/
│   │   ├── main.py          # 应用入口
│   │   ├── routes.py        # API路由
│   │   ├── services/        # 业务逻辑
│   │   │   ├── ai_service.py        # AI服务
│   │   │   └── command_parser.py    # 指令解析
│   │   ├── models/          # 数据模型
│   │   │   └── schemas.py
│   │   └── config.py        # 配置管理
│   ├── .env                 # 环境变量
│   └── requirements.txt
└── doc/                      # 文档
    ├── requirements.md       # 需求文档
    ├── design.md             # 设计文档
    ├── USER_GUIDE.md         # 用户使用指南
    └── tasks/                # 任务文档
```

---

## 🚀 快速开始

### 前置要求
- **Node.js**: 18+ 
- **Python**: 3.11+
- **阿里云百炼平台API密钥**: [获取地址](https://bailian.console.aliyun.com/)
- **浏览器**: Chrome 90+ 或 Edge 90+ (支持Web Speech API)

### 安装步骤

#### 1. 克隆项目
```bash
git clone <repository-url>
cd ai_voice_draw
```

#### 2. 后端配置

```bash
cd backend

# 安装Python依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
```

编辑 `backend/.env` 文件，配置以下参数：
```env
# 阿里云百炼平台API密钥
ALIYUN_API_KEY=your_aliyun_api_key_here

```

#### 3. 前端配置

```bash
cd frontend

# 安装Node.js依赖
npm install
```

### 运行命令

#### 启动后端服务
```bash
cd backend
uvicorn app.main:app --reload --port 8001
```
后端API运行在 `http://localhost:8001`  
API文档访问 `http://localhost:8001/docs`

#### 启动前端服务
```bash
cd frontend
npm run dev
```
前端应用运行在 `http://localhost:5173`

#### 生产构建
```bash
# 前端构建
cd frontend
npm run build

# 后端部署
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### 首次使用

1. 打开 Chrome/Edge 浏览器
2. 访问 `http://localhost:5173`
3. 允许浏览器访问麦克风权限
4. 点击"开始监听"按钮
5. 说出指令"生成一个红色的太阳"开始创作！

---

## 🗣️ 语音指令示例

### 创建对象
- "生成一个红色的太阳"
- "在左上角添加一朵云"
- "画一棵树在中央"

### 调整对象
- "把太阳放大两倍"
- "把云朵向右移动"
- "旋转树30度"
- "让花朵半透明"

### 画布操作
- "撤销" / "后退一步"
- "重做" / "前进一步"
- "清空画布"
- "删除太阳"

### 导出保存
- "保存作品"
- "导出图片"

### 帮助
- "帮助"
- "有哪些指令"

---

## 📚 文档

- [设计文档](doc/design.md) - 技术架构和模块设计

---

## 👨‍💻 开发者指南

### 开发环境配置

**必需工具**:
- Node.js 18+ (推荐使用 nvm 管理版本)
- Python 3.11+ (推荐使用 pyenv 或 conda)
- Git
- VS Code (推荐，已配置工作区设置)

**推荐扩展**:
- Vue Language Features (Volar)
- TypeScript Vue Plugin (Volar)
- Python
- Pylance

### 代码规范

**前端 (TypeScript/Vue)**:
- 遵循 Vue 3 Composition API 最佳实践
- 使用 TypeScript 严格模式
- 组件命名使用 PascalCase
- 函数/变量命名使用 camelCase
- 类型定义统一放在 `src/types/`

**后端 (Python)**:
- 遵循 PEP 8 代码风格
- 使用类型注解 (Type Hints)
- 函数/变量命名使用 snake_case
- 模型定义使用 Pydantic

### 测试

```bash
# 前端测试
cd frontend
npm run test

# 后端测试
cd backend
pytest
```

### 调试

**前端调试**:
- 使用浏览器开发者工具
- Vue DevTools 扩展
- `console.log` / `debugger`

**后端调试**:
- FastAPI 自动生成 API 文档 `/docs`
- Python debugger (pdb)
- 查看日志输出

## 🎯 设计原则

1. **无障碍优先** - 完全支持纯语音操作
2. **模块独立** - 各模块通过接口通信，便于测试和维护
3. **用户友好** - 提供视觉和语音双重反馈
4. **简单部署** - 无需数据库，配置即用
5. **类型安全** - 前后端均使用类型系统保证代码质量

---

## ⚠️ 浏览器兼容性

| 浏览器 | 支持情况 |
|--------|---------|
| Chrome 90+ | ✅ 完全支持 |
| Edge 90+ | ✅ 完全支持 |
| Firefox | ⚠️ 部分支持（语音识别受限） |
| Safari | ⚠️ 部分支持（语音识别受限） |
| IE 11 | ❌ 不支持 |

**推荐使用**: Chrome 或 Edge 浏览器以获得最佳体验

---

**立即开始你的语音绘图之旅！** 🎨🎤

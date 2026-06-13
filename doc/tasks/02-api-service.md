# 任务：HTTP请求服务

**模块**: API服务层  
**优先级**: P0  
**预计时间**: 1小时  
**状态**: 待开始

---

## 目标

封装Axios，提供统一的HTTP请求接口。

---

## 任务清单

### 创建 `src/services/apiService.ts`

```typescript
import axios from 'axios'
import type { CommandRequest, CommandResponse, ImageGenerateRequest, ImageGenerateResponse } from '@/types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

export const apiService = {
  async parseCommand(request: CommandRequest): Promise<CommandResponse> {
    const { data } = await api.post('/api/command/parse', request)
    return data
  },

  async generateImage(request: ImageGenerateRequest): Promise<ImageGenerateResponse> {
    const { data } = await api.post('/api/image/generate', request)
    return data
  },

  async healthCheck(): Promise<{status: string}> {
    const { data } = await api.get('/api/health')
    return data
  }
}
```

---

## 验收标准

- [x] API客户端配置正确
- [x] 所有接口方法定义完整
- [x] 超时时间设置合理
- [x] 类型安全

---

## 相关文件

- `src/services/apiService.ts`

---

## 依赖项

- [00-project-setup.md](./00-project-setup.md)
- [01-types.md](./01-types.md)

---

## 后续任务

- [19-command-parser.md](./19-command-parser.md) - 后端需提供对应接口

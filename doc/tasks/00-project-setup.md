# 任务：前端项目初始化

**模块**: 项目基础设施  
**优先级**: P0  
**预计时间**: 2小时  
**状态**: 待开始

---

## 目标

搭建Vue 3前端项目，配置开发环境和基础依赖。

---

## 任务清单

### 1. 创建Vue 3项目
- [ ] 使用Vite创建项目：`npm create vue@latest`
- [ ] 选择配置：TypeScript、Pinia、无Router
- [ ] 验证项目可运行：`npm run dev`

### 2. 安装核心依赖
```bash
npm install pinia axios
```

### 3. 配置项目结构
创建目录：
```
src/
├── components/
├── modules/
├── stores/
├── services/
├── types/
└── utils/
```

### 4. 配置环境变量
- [ ] 创建`.env.development`
```env
VITE_API_BASE_URL=http://localhost:8000
```
- [ ] 创建`.env.production`
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

### 5. 配置vite.config.ts
```typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

---

## 验收标准

- [x] 项目能正常运行在 http://localhost:5173
- [x] 目录结构创建完整
- [x] 环境变量配置正确
- [x] 可以正常导入Pinia和Axios

---

## 相关文件

- `package.json`
- `vite.config.ts`
- `.env.development`
- `src/` 目录结构

---

## 依赖项

无

---

## 后续任务

- [01-types.md](./01-types.md) - TypeScript类型定义

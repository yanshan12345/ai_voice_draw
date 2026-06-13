# 任务：单元测试

**模块**: 单元测试  
**优先级**: P1  
**预计时间**: 4小时  
**状态**: 待开始

---

## 目标

为前后端核心模块编写单元测试。

---

## 任务清单

### 前端测试 (Vitest)

**安装依赖**:
```bash
npm install -D vitest @vue/test-utils
```

**测试文件**:
- [ ] `voiceInput.test.ts` - 语音输入模块
- [ ] `canvasRenderer.test.ts` - 画布渲染
- [ ] `historyManager.test.ts` - 历史管理
- [ ] `commandPreprocessor.test.ts` - 指令预处理
- [ ] `canvasStore.test.ts` - 状态管理

### 后端测试 (pytest)

**安装依赖**:
```bash
pip install pytest pytest-asyncio httpx
```

**测试文件**:
- [ ] `test_command_parser.py` - 指令解析
- [ ] `test_ai_service.py` - AI服务（mock）
- [ ] `test_routes.py` - API接口

---

## 验收标准

- [x] 覆盖核心功能
- [x] 所有测试通过

---

## 依赖项

- [21-integration.md](./21-integration.md)

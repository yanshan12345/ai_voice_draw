<template>
  <div v-if="visible" class="modal-overlay" @click="onClose">
    <div class="modal-content" @click.stop>
      <button class="close-btn" @click="onClose">×</button>

      <h2>语音绘图工具使用指南</h2>

      <div class="scroll-content">
        <section>
          <h3>功能介绍</h3>
          <p>这是一个纯语音交互的AI绘图工具，无需使用鼠标或键盘，仅通过语音指令完成绘图创作。</p>
        </section>

        <section>
          <h3>常用指令</h3>

          <div class="command-group">
            <h4>创建对象</h4>
            <ul>
              <li>"画一个红色的太阳"</li>
              <li>"在左上角添加一朵云"</li>
              <li>"画面中央放一棵树"</li>
            </ul>
          </div>

          <div class="command-group">
            <h4>调整对象</h4>
            <ul>
              <li>"把太阳放大两倍"</li>
              <li>"把云朵向右移动"</li>
              <li>"旋转树30度"</li>
              <li>"让花朵半透明"</li>
            </ul>
          </div>

          <div class="command-group">
            <h4>删除对象</h4>
            <ul>
              <li>"删除太阳"</li>
              <li>"删除最后一个对象"</li>
            </ul>
          </div>

          <div class="command-group">
            <h4>画布操作</h4>
            <ul>
              <li>"撤销" / "后退一步"</li>
              <li>"重做" / "前进一步"</li>
              <li>"清空画布"</li>
              <li>"保存作品" / "导出图片"</li>
            </ul>
          </div>
        </section>

        <section>
          <h3>使用提示</h3>
          <ul>
            <li>说话清晰，语速适中</li>
            <li>使用简洁的描述性语言</li>
            <li>等待当前操作完成后再说下一个指令</li>
            <li>可以随时说"帮助"查看此页面</li>
            <li>推荐使用Chrome或Edge浏览器以获得最佳体验</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  onClose: () => void
}>()
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 600px;
  max-height: 80vh;
  position: relative;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #666;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  color: #333;
}

h2 {
  margin: 0 0 24px 0;
  font-size: 24px;
  color: #333;
}

.scroll-content {
  overflow-y: auto;
  max-height: calc(80vh - 120px);
}

section {
  margin-bottom: 24px;
}

h3 {
  font-size: 18px;
  color: #444;
  margin: 0 0 12px 0;
}

h4 {
  font-size: 16px;
  color: #555;
  margin: 16px 0 8px 0;
}

.command-group {
  margin-bottom: 16px;
}

ul {
  margin: 0;
  padding-left: 24px;
}

li {
  margin: 6px 0;
  color: #666;
  line-height: 1.6;
}

p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}
</style>

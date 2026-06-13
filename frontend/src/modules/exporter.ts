/**
 * 导出模块 - 将Canvas导出为图像文件
 */

class ExporterModule {
  /**
   * 导出Canvas为图像并触发下载
   * @param canvas - Canvas元素
   * @param format - 图像格式 'png' | 'jpg'
   * @param filename - 文件名（不含扩展名），默认: ai-voice-draw-{timestamp}
   */
  export(canvas: HTMLCanvasElement, format: 'png' | 'jpg', filename?: string): void {
    const defaultFilename = `ai-voice-draw-${Date.now()}`;
    const finalFilename = filename || defaultFilename;
    const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
    const quality = format === 'jpg' ? 0.9 : 1.0;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Failed to create blob from canvas');
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${finalFilename}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      mimeType,
      quality
    );
  }
}

// 导出单例实例
export const exporter = new ExporterModule();

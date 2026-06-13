/**
 * Canvas Renderer Module
 * Handles rendering of canvas objects with transformations
 */

import type { CanvasObject, CanvasRendererModule, ImageData as CanvasImageData, ShapeData } from '../types'

class CanvasRenderer implements CanvasRendererModule {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private imageCache = new Map<string, HTMLImageElement>()
  private offscreenCanvas: HTMLCanvasElement | null = null
  private offscreenCtx: CanvasRenderingContext2D | null = null
  private isDirty = true
  private lastObjectsHash = ''

  init(canvas: HTMLCanvasElement, width: number, height: number): void {
    this.canvas = canvas
    this.canvas.width = width
    this.canvas.height = height
    this.ctx = canvas.getContext('2d')
    if (!this.ctx) throw new Error('Failed to get 2D context')

    this.offscreenCanvas = document.createElement('canvas')
    this.offscreenCanvas.width = width
    this.offscreenCanvas.height = height
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')
  }

  render(objects: CanvasObject[]): void {
    if (!this.ctx || !this.canvas) return

    const objectsHash = JSON.stringify(objects.map(o => ({ id: o.id, position: o.position, rotation: o.rotation, opacity: o.opacity })))

    if (objectsHash === this.lastObjectsHash && !this.isDirty) {
      return
    }

    this.lastObjectsHash = objectsHash
    this.isDirty = false

    this.clear()

    const sorted = [...objects].sort((a, b) => a.zIndex - b.zIndex)

    for (const obj of sorted) {
      this.ctx.save()
      this.ctx.globalAlpha = obj.opacity
      this.ctx.translate(obj.position.x, obj.position.y)
      this.ctx.rotate((obj.rotation * Math.PI) / 180)

      if (obj.type === 'image') {
        this.renderImage(obj)
      } else if (obj.type === 'shape') {
        this.renderShape(obj)
      }

      this.ctx.restore()
    }
  }

  markDirty(): void {
    this.isDirty = true
  }

  private renderImage(obj: CanvasObject): void {
    if (!this.ctx) return

    const data = obj.data as CanvasImageData
    const img = this.imageCache.get(data.url)

    if (img && img.complete) {
      this.ctx.drawImage(
        img,
        -obj.size.width / 2,
        -obj.size.height / 2,
        obj.size.width,
        obj.size.height
      )
    } else {
      this.loadImage(data.url)
    }
  }

  private loadImage(url: string): void {
    if (this.imageCache.has(url)) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      this.imageCache.set(url, img)
    }
    img.src = url
    this.imageCache.set(url, img)
  }

  private renderShape(obj: CanvasObject): void {
    if (!this.ctx) return

    const data = obj.data as ShapeData
    const { shapeType, fillColor, strokeColor, strokeWidth = 1 } = data

    this.ctx.beginPath()

    if (shapeType === 'circle') {
      const radius = data.radius || obj.size.width / 2
      this.ctx.arc(0, 0, radius, 0, Math.PI * 2)
    } else if (shapeType === 'rectangle') {
      const w = data.width || obj.size.width
      const h = data.height || obj.size.height
      this.ctx.rect(-w / 2, -h / 2, w, h)
    } else if (shapeType === 'ellipse') {
      const rx = data.radiusX || obj.size.width / 2
      const ry = data.radiusY || obj.size.height / 2
      this.ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
    } else if (shapeType === 'line') {
      const endX = data.endX || 0
      const endY = data.endY || 0
      this.ctx.moveTo(0, 0)
      this.ctx.lineTo(endX, endY)
    }

    if (fillColor && shapeType !== 'line') {
      this.ctx.fillStyle = fillColor
      this.ctx.fill()
    }

    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor
      this.ctx.lineWidth = strokeWidth
      this.ctx.stroke()
    }
  }

  clear(): void {
    if (!this.ctx || !this.canvas) return
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  setBackground(color: string): void {
    if (!this.ctx || !this.canvas) return
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  exportImage(format: 'png' | 'jpg', quality = 0.92): Blob {
    if (!this.canvas) throw new Error('Canvas not initialized')

    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
    const dataURL = this.canvas.toDataURL(mimeType, quality)

    const arr = dataURL.split(',')
    const mime = arr[0].match(/:(.*?);/)![1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }

    return new Blob([u8arr], { type: mime })
  }

  screenToCanvas(x: number, y: number): { x: number; y: number } {
    if (!this.canvas) return { x: 0, y: 0 }

    const rect = this.canvas.getBoundingClientRect()
    return {
      x: ((x - rect.left) / rect.width) * this.canvas.width,
      y: ((y - rect.top) / rect.height) * this.canvas.height
    }
  }
}

export const canvasRenderer = new CanvasRenderer()

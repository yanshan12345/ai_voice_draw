import { defineStore } from 'pinia'
import type { CanvasState, CanvasObject } from '../types'

export const useCanvasStore = defineStore('canvas', {
  state: (): CanvasState => ({
    config: {
      width: 1920,
      height: 1080,
      backgroundColor: '#ffffff'
    },
    objects: [],
    selectedObjectId: null,
    status: 'idle',
    currentVoiceText: '',
    error: null
  }),

  getters: {
    getObjectById: (state) => (id: string): CanvasObject | null => {
      return state.objects.find(obj => obj.id === id) ?? null
    },

    getObjectByName: (state) => (name: string): CanvasObject | null => {
      return state.objects.find(obj => obj.name === name) ?? null
    },

    getSortedObjects: (state): CanvasObject[] => {
      return [...state.objects].sort((a, b) => a.zIndex - b.zIndex)
    }
  },

  actions: {
    addObject(obj: CanvasObject) {
      this.objects.push(obj)
    },

    updateObject(id: string, updates: Partial<CanvasObject>) {
      const index = this.objects.findIndex(obj => obj.id === id)
      if (index !== -1) {
        this.objects[index] = { ...this.objects[index], ...updates }
      }
    },

    deleteObject(id: string) {
      this.objects = this.objects.filter(obj => obj.id !== id)
    },

    clearObjects() {
      this.objects = []
      this.selectedObjectId = null
    },

    setStatus(status: CanvasState['status']) {
      this.status = status
    },

    setError(error: string | null) {
      this.error = error
    },

    setCurrentVoiceText(text: string) {
      this.currentVoiceText = text
    }
  }
})

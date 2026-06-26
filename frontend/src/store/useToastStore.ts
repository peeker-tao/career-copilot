import { create } from 'zustand'

export type ToastType = 'error' | 'success' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number // ms，默认 4500
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
}

let _nextId = 1

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message, duration = 4500) => {
    const id = String(_nextId++)
    const toast: ToastItem = { id, type, message, duration }
    set((s) => ({ toasts: [...s.toasts, toast] }))

    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, duration)
    }
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

/** 便捷方法：无需引入 store，直接调用 */
export const toast = {
  error: (msg: string, duration?: number) =>
    useToastStore.getState().addToast('error', msg, duration),
  success: (msg: string, duration?: number) =>
    useToastStore.getState().addToast('success', msg, duration),
  warning: (msg: string, duration?: number) =>
    useToastStore.getState().addToast('warning', msg, duration),
  info: (msg: string, duration?: number) =>
    useToastStore.getState().addToast('info', msg, duration),
}

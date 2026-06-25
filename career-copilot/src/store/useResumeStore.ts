import { create } from 'zustand'
import type { ResumeSummary, ResumeDetail } from '@/types/resume'
import type { BatchFileItem } from '@/components/resume/BatchUploadProgress'
import * as resumeApi from '@/api/resumes'

interface ResumeState {
  // State
  resumes: ResumeSummary[]
  currentResume: ResumeDetail | null
  loading: boolean
  error: string | null
  uploadProgress: number
  uploading: boolean

  // 批量上传
  batchItems: BatchFileItem[]
  batchUploading: boolean
  batchCancelled: boolean

  // Actions
  fetchResumes: () => Promise<void>
  fetchResumeById: (id: string) => Promise<void>
  uploadResume: (file: File) => Promise<string | null>
  deleteResume: (id: string) => Promise<void>
  updateResume: (id: string, data: Partial<ResumeDetail>) => Promise<void>
  reparseResume: (id: string) => Promise<void>
  setDefaultResume: (id: string) => void
  clearError: () => void
  resetCurrent: () => void

  // 批量上传
  setBatchItems: (items: BatchFileItem[]) => void
  batchUploadResumes: () => Promise<void>
  cancelBatchUpload: () => void
  resetBatch: () => void
  retryBatchItem: (index: number) => void
  removeBatchItem: (index: number) => void
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  currentResume: null,
  loading: false,
  error: null,
  uploadProgress: 0,
  uploading: false,
  batchItems: [],
  batchUploading: false,
  batchCancelled: false,

  fetchResumes: async () => {
    set({ loading: true, error: null })
    try {
      const res = await resumeApi.getResumes()
      const resumes = Array.isArray(res.data) ? res.data : []
      set({ resumes, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchResumeById: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await resumeApi.getResumeById(id)
      set({ currentResume: res.data, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  uploadResume: async (file) => {
    set({ uploading: true, uploadProgress: 0, error: null })
    try {
      const res = await resumeApi.uploadResume(file, (percent) => {
        set({ uploadProgress: percent })
      })
      set({ uploading: false, uploadProgress: 100 })
      // 刷新列表
      get().fetchResumes()
      return res.data.id
    } catch (err) {
      set({ error: (err as Error).message, uploading: false })
      return null
    }
  },

  deleteResume: async (id) => {
    set({ loading: true, error: null })
    try {
      await resumeApi.deleteResume(id)
      set((state) => ({
        resumes: state.resumes.filter((r) => r.id !== id),
        loading: false,
      }))
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  reparseResume: async (id) => {
    set({ loading: true, error: null })
    try {
      await resumeApi.reparseResume(id)
      set({ loading: false })
      // 重新获取详情
      get().fetchResumeById(id)
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  updateResume: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const res = await resumeApi.updateResume(id, data)
      set({ currentResume: res.data, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  setDefaultResume: (id) => {
    set((state) => ({
      resumes: state.resumes.map((r) => ({ ...r, isDefault: r.id === id })),
    }))
  },

  clearError: () => set({ error: null }),
  resetCurrent: () => set({ currentResume: null }),

  /* ───── 批量上传 ───── */
  setBatchItems: (items) => set({ batchItems: items, batchCancelled: false }),

  batchUploadResumes: async () => {
    const state = get()
    const pendings = state.batchItems.filter((i) => i.status === 'pending')
    if (pendings.length === 0) return

    set({ batchUploading: true, batchCancelled: false })

    const updateItem = (idx: number, patch: Partial<BatchFileItem>) => {
      set((s) => {
        const items = [...s.batchItems]
        items[idx] = { ...items[idx], ...patch }
        return { batchItems: items }
      })
    }

    // 并行上传
    const tasks = pendings.map(async (item) => {
      const idx = state.batchItems.indexOf(item)
      if (get().batchCancelled) return

      updateItem(idx, { status: 'uploading', progress: 0 })

      try {
        const res = await resumeApi.uploadResume(item.file, (percent) => {
          updateItem(idx, { progress: percent })
        })
        updateItem(idx, { status: 'success', progress: 100, resultId: res.data.id })
      } catch (err) {
        updateItem(idx, { status: 'error', error: (err as Error).message })
      }
    })

    await Promise.allSettled(tasks)

    set({ batchUploading: false })
    // 刷新列表
    get().fetchResumes()
  },

  cancelBatchUpload: () => {
    set({ batchCancelled: true, batchUploading: false })
  },

  resetBatch: () => set({ batchItems: [], batchCancelled: false, batchUploading: false }),

  retryBatchItem: (index) => {
    set((s) => {
      const items = [...s.batchItems]
      if (items[index]) {
        items[index] = { ...items[index], status: 'pending', error: undefined, progress: 0 }
      }
      return { batchItems: items }
    })
  },

  removeBatchItem: (index) => {
    set((s) => {
      const items = s.batchItems.filter((_, i) => i !== index)
      return { batchItems: items }
    })
  },
}))

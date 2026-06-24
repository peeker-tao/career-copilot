import { create } from 'zustand'
import type { ResumeSummary, ResumeDetail } from '@/types/resume'
import * as resumeApi from '@/api/resumes'

interface ResumeState {
  // State
  resumes: ResumeSummary[]
  currentResume: ResumeDetail | null
  loading: boolean
  error: string | null
  uploadProgress: number
  uploading: boolean

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
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  currentResume: null,
  loading: false,
  error: null,
  uploadProgress: 0,
  uploading: false,

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
}))

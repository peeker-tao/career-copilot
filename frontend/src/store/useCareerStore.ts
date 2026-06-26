import { create } from 'zustand'
import type { CareerPlanSummary, CareerPlan, MarketInsight } from '@/types/career'
import * as careerApi from '@/api/career'

interface CareerState {
  // State
  plans: CareerPlanSummary[]
  currentPlan: CareerPlan | null
  marketInsight: MarketInsight | null
  loading: boolean
  error: string | null
  generating: boolean

  // Actions
  fetchPlans: () => Promise<void>
  fetchPlanById: (id: string) => Promise<void>
  generatePlan: (position: string, skills?: string[]) => Promise<string | null>
  deletePlan: (id: string) => Promise<void>
  updateProgress: (id: string, progress: number) => Promise<void>
  toggleStageLearned: (stageId: string) => void
  fetchMarketInsight: (position: string) => Promise<void>
  clearError: () => void
}

export const useCareerStore = create<CareerState>((set, get) => ({
  plans: [],
  currentPlan: null,
  marketInsight: null,
  loading: false,
  error: null,
  generating: false,

  fetchPlans: async () => {
    set({ loading: true, error: null })
    try {
      const res = await careerApi.getCareerPlans()
      set({ plans: res.data, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchPlanById: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await careerApi.getCareerPlanById(id)
      set({ currentPlan: res.data, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  generatePlan: async (position, skills) => {
    set({ generating: true, error: null })
    try {
      const res = await careerApi.generateCareerPlan({
        targetPosition: position,
        skills,
      })
      set({ generating: false })
      // 刷新列表
      get().fetchPlans()
      return res.data.id
    } catch (err) {
      set({ error: (err as Error).message, generating: false })
      return null
    }
  },

  deletePlan: async (id) => {
    set({ loading: true, error: null })
    try {
      await careerApi.deleteCareerPlan(id)
      set((state) => ({
        plans: state.plans.filter((p) => p.id !== id),
        loading: false,
      }))
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  updateProgress: async (id, progress) => {
    try {
      await careerApi.updatePlanProgress(id, progress)
      set((state) => ({
        currentPlan: state.currentPlan
          ? { ...state.currentPlan, progress }
          : null,
      }))
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  toggleStageLearned: (stageId) => {
    set((state) => {
      if (!state.currentPlan) return state
      return {
        currentPlan: {
          ...state.currentPlan,
          stages: state.currentPlan.stages.map((s) =>
            s.id === stageId ? { ...s, learned: !s.learned } : s
          ),
        },
      }
    })
  },

  fetchMarketInsight: async (position) => {
    set({ loading: true, error: null })
    try {
      const res = await careerApi.getMarketInsight(position)
      set({ marketInsight: res.data, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))

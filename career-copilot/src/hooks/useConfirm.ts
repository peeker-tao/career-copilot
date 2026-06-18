import { useState, useCallback } from 'react'

/**
 * useConfirm - 删除/操作确认 Hook
 * 统一管理确认弹窗状态
 *
 * @returns { deleteTarget, requestDelete, confirmDelete, cancelDelete }
 */
export function useConfirm<T = string>() {
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)

  const requestDelete = useCallback((target: T) => {
    setDeleteTarget(target)
  }, [])

  const confirmDelete = useCallback(() => {
    const target = deleteTarget
    setDeleteTarget(null)
    return target
  }, [deleteTarget])

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null)
  }, [])

  return {
    deleteTarget,
    requestDelete,
    confirmDelete,
    cancelDelete,
  }
}

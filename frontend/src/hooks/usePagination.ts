import { useState, useMemo } from 'react'

/**
 * usePagination - 前端分页 Hook
 *
 * @param data 完整数据数组
 * @param pageSize 每页条数
 * @returns { page, pageSize, totalPages, pagedData, setPage, nextPage, prevPage, hasNext, hasPrev }
 */
export function usePagination<T>(data: T[], pageSize = 10) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))

  const pagedData = useMemo(
    () => data.slice((page - 1) * pageSize, page * pageSize),
    [data, page, pageSize]
  )

  const nextPage = () => {
    setPage((p) => Math.min(p + 1, totalPages))
  }

  const prevPage = () => {
    setPage((p) => Math.max(p - 1, 1))
  }

  // 当数据变化时，确保页码不超出总页数（通过推导而非 setState 避免 lint 规则）
  const safePage = Math.min(page, totalPages)
  if (safePage !== page) {
    setPage(safePage)
  }

  const setPageSafe = (p: number | ((prev: number) => number)) => {
    if (typeof p === 'function') {
      setPage((prev) => Math.min(p(prev), totalPages))
    } else {
      setPage(Math.min(p, totalPages))
    }
  }

  return {
    page: safePage,
    pageSize,
    totalPages,
    pagedData,
    setPage: setPageSafe,
    nextPage,
    prevPage,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  }
}

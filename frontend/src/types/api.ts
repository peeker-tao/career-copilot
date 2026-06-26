/** 通用 API 响应结构 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页参数 */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

/** 分页结果 */
export interface PaginationResult<T = unknown> {
  page: number
  pageSize: number
  total: number
  list: T[]
}

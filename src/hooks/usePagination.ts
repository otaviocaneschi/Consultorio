import { useCallback, useMemo, useState } from 'react'

export function usePagination(initialPageSize = 10) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const reset = useCallback(() => setPage(1), [])

  const pagination = useMemo(
    () => ({
      page,
      pageSize,
      setPage,
      setPageSize,
      reset,
      offset: (page - 1) * pageSize,
    }),
    [page, pageSize, reset]
  )

  return pagination
}

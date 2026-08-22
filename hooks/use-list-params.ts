"use client"

import { useEffect, useState } from "react"

export type ListParamsOptions = {
  defaultPage?: number
  defaultPageSize?: number
  defaultFilter?: string
  defaultType?: string
  defaultSource?: string
}

export default function useListParams(options?: ListParamsOptions) {
  const { defaultPage = 1, defaultPageSize = 10, defaultFilter = 'all', defaultType = 'all', defaultSource = 'all' } = options || {}

  const [page, setPage] = useState<number>(defaultPage)
  const [pageSize, setPageSize] = useState<number>(defaultPageSize)

  const [searchInput, setSearchInput] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const [filter, setFilter] = useState<string>(defaultFilter)
  const [type, setType] = useState<string>(defaultType)
  const [source, setSource] = useState<string>(defaultSource)

  const [isFetching, setIsFetching] = useState(false)

  // debounce searchInput -> searchQuery (300ms)
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const reset = () => setPage(1)

  const queryParams = {
    page,
    limit: pageSize,
    filter,
    search: searchQuery,
    type: type === 'all' ? undefined : type,
    source: source === 'all' ? undefined : source,
  }

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    searchInput,
    setSearchInput,
    searchQuery,
    filter,
    setFilter,
    type,
    setType,
    isFetching,
    setIsFetching,
    reset,
    queryParams,
    source,
    setSource,
  }
}

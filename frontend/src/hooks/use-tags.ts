'use client'

import { useQuery } from '@tanstack/react-query'
import { tagsApi } from '@/lib/api'

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.getAll,
  })
}

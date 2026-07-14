import { useCallback } from 'react'

export function useStorage() {
  const read = useCallback((key, fallback = null) => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  }, [])

  const write = useCallback((key, value) => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [])

  const remove = useCallback((key) => {
    localStorage.removeItem(key)
  }, [])

  return { read, write, remove }
}

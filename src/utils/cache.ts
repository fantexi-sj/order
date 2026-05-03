const cacheMap = new Map<string, { data: unknown; hash: string }>()

function hashData(data: unknown): string {
  return JSON.stringify(data)
}

export const pageCache = {
  get<T>(key: string): T | null {
    const cached = cacheMap.get(key)
    if (cached) {
      return cached.data as T
    }
    return null
  },

  set(key: string, data: unknown): void {
    cacheMap.set(key, { data, hash: hashData(data) })
  },

  isDifferent(key: string, newData: unknown): boolean {
    const cached = cacheMap.get(key)
    if (!cached) return true
    return cached.hash !== hashData(newData)
  },

  has(key: string): boolean {
    return cacheMap.has(key)
  },

  clear(key?: string): void {
    if (key) {
      cacheMap.delete(key)
    } else {
      cacheMap.clear()
    }
  }
}

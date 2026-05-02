import { useState, useCallback, useEffect, useRef } from 'react'
import { DEFAULT_DATA } from '../utils/dataUtils'

const DB_NAME = 'asset-manager-v2'
const DB_STORE = 'file-handles'
const HANDLE_KEY = 'data-file-handle'

async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = e => e.target.result.createObjectStore(DB_STORE)
    req.onsuccess = e => resolve(e.target.result)
    req.onerror = e => reject(e.target.error)
  })
}

async function getStoredHandle() {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly')
      const req = tx.objectStore(DB_STORE).get(HANDLE_KEY)
      req.onsuccess = e => resolve(e.target.result || null)
      req.onerror = e => reject(e.target.error)
    })
  } catch {
    return null
  }
}

async function storeHandle(handle) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite')
      const req = tx.objectStore(DB_STORE).put(handle, HANDLE_KEY)
      req.onsuccess = () => resolve()
      req.onerror = e => reject(e.target.error)
    })
  } catch {
    // ignore
  }
}

async function readFileData(handle) {
  const file = await handle.getFile()
  const text = await file.text()
  if (!text.trim()) return { ...DEFAULT_DATA }
  return JSON.parse(text)
}

async function writeFileData(handle, data) {
  const writable = await handle.createWritable()
  await writable.write(JSON.stringify(data, null, 2))
  await writable.close()
}

function mergeWithDefaults(data) {
  const d = { ...DEFAULT_DATA, ...data }
  d.settings = { ...DEFAULT_DATA.settings, ...(data.settings || {}) }
  if (!d.expenseCategories?.length) d.expenseCategories = DEFAULT_DATA.expenseCategories
  if (!d.investTopCategories?.length) d.investTopCategories = DEFAULT_DATA.investTopCategories
  if (!d.investSubCategories) d.investSubCategories = DEFAULT_DATA.investSubCategories
  if (!d.budget) d.budget = {}
  if (!d.debt) d.debt = {}
  if (!d.investment) d.investment = {}
  return d
}

export function useFileData() {
  const [data, setData] = useState(null)
  const [fileReady, setFileReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const handleRef = useRef(null)

  useEffect(() => {
    async function tryRestoreHandle() {
      const handle = await getStoredHandle()
      if (!handle) { setIsLoading(false); return }
      try {
        const perm = await handle.queryPermission({ mode: 'readwrite' })
        if (perm === 'granted') {
          const raw = await readFileData(handle)
          const merged = mergeWithDefaults(raw)
          handleRef.current = handle
          setData(merged)
          setFileReady(true)
        }
      } catch {
        // handle is stale, need re-pick
      }
      setIsLoading(false)
    }
    tryRestoreHandle()
  }, [])

  const openFile = useCallback(async () => {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      })
      const perm = await handle.requestPermission({ mode: 'readwrite' })
      if (perm !== 'granted') return
      const raw = await readFileData(handle)
      const merged = mergeWithDefaults(raw)
      handleRef.current = handle
      await storeHandle(handle)
      setData(merged)
      setFileReady(true)
    } catch {
      // user cancelled
    }
  }, [])

  const createFile = useCallback(async () => {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'asset-data.json',
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      })
      const perm = await handle.requestPermission({ mode: 'readwrite' })
      if (perm !== 'granted') return
      const initial = mergeWithDefaults({})
      await writeFileData(handle, initial)
      handleRef.current = handle
      await storeHandle(handle)
      setData(initial)
      setFileReady(true)
    } catch {
      // user cancelled
    }
  }, [])

  const requestPermission = useCallback(async () => {
    const handle = await getStoredHandle()
    if (!handle) return false
    try {
      const perm = await handle.requestPermission({ mode: 'readwrite' })
      if (perm === 'granted') {
        const raw = await readFileData(handle)
        const merged = mergeWithDefaults(raw)
        handleRef.current = handle
        setData(merged)
        setFileReady(true)
        return true
      }
    } catch {
      // ignore
    }
    return false
  }, [])

  const updateData = useCallback((updater) => {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (handleRef.current) {
        writeFileData(handleRef.current, next).catch(console.error)
      }
      return next
    })
  }, [])

  return { data, updateData, fileReady, isLoading, openFile, createFile, requestPermission }
}

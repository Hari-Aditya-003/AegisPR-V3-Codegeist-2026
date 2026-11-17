const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8300'
const accessKey = 'aegispr.workspace.access'
export const accessChangedEvent = 'aegispr:workspace-access'

export function apiUrl(path: string) {
  return base.replace(/\/$/, '') + path
}

export function requestHeaders(json = false) {
  const headers: Record<string, string> = json ? { 'Content-Type': 'application/json' } : {}
  if (typeof window === 'undefined') return headers
  const code = sessionStorage.getItem(accessKey)
  if (code) headers.Authorization = 'Bearer ' + code
  return headers
}

export function saveAccessCode(code: string) {
  if (code.trim()) sessionStorage.setItem(accessKey, code.trim())
  else sessionStorage.removeItem(accessKey)
  window.dispatchEvent(new Event(accessChangedEvent))
}

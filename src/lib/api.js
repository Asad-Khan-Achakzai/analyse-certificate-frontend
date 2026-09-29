const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

const TOKEN_KEY = 'cm_access_token'
const REFRESH_KEY = 'cm_refresh_token'

export function getAccessToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })

  if (!res.ok) {
    clearTokens()
    return null
  }

  const json = await res.json()
  setTokens({
    accessToken: json.data.accessToken,
    refreshToken: json.data.refreshToken
  })
  return json.data.accessToken
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`)
      res = await fetch(`${API_URL}${path}`, { ...options, headers })
    }
  }

  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json() : null

  if (!res.ok) {
    const message = data?.message || 'Request failed'
    const error = new Error(message)
    error.status = res.status
    error.code = data?.code
    error.data = data
    throw error
  }

  return data
}

export const api = {
  register: body => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: body => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => apiFetch('/auth/me'),
  logout: body => apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify(body || {}) }),
  getCompany: () => apiFetch('/company'),
  updateCompany: body => apiFetch('/company', { method: 'PATCH', body: JSON.stringify(body) }),
  uploadLogo: file => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetch('/company/logo', { method: 'POST', body: fd })
  },
  uploadStamp: file => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetch('/company/stamp', { method: 'POST', body: fd })
  },
  uploadCertificateIssuerLogo: (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetch(`/certificates/${id}/issuer-logo`, { method: 'POST', body: fd })
  },
  uploadCertificateIssuerStamp: (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetch(`/certificates/${id}/issuer-stamp`, { method: 'POST', body: fd })
  },
  uploadCertificateSignature: (id, role, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetch(`/certificates/${id}/signatures/${role}`, { method: 'POST', body: fd })
  },
  listCertificates: (params = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
    })
    const query = qs.toString()
    return apiFetch(`/certificates${query ? `?${query}` : ''}`)
  },
  getStats: () => apiFetch('/certificates/stats'),
  getCertificate: id => apiFetch(`/certificates/${id}`),
  createCertificate: body => apiFetch('/certificates', { method: 'POST', body: JSON.stringify(body) }),
  cloneCertificate: id => apiFetch(`/certificates/${id}/clone`, { method: 'POST' }),
  updateCertificate: (id, body) =>
    apiFetch(`/certificates/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCertificate: id => apiFetch(`/certificates/${id}`, { method: 'DELETE' }),
  issueCertificate: id => apiFetch(`/certificates/${id}/issue`, { method: 'POST' }),
  regenerateCertificate: id => apiFetch(`/certificates/${id}/regenerate`, { method: 'POST' }),
  revokeCertificate: id => apiFetch(`/certificates/${id}/revoke`, { method: 'POST' }),
  getCertificatePdf: id => apiFetch(`/certificates/${id}/pdf`),
  getCertificateQr: id => apiFetch(`/certificates/${id}/qrcode`),
  verify: publicId => apiFetch(`/verify/${publicId}`),
  verifyPdf: publicId => apiFetch(`/verify/${publicId}/pdf`)
}

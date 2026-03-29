/**
 * SkillSync API Service
 * Central Fetch API wrapper for all backend communication.
 * Backend is proxied through Vite at /api -> http://localhost:8000
 */

const BASE_URL = '/api'

/**
 * Retrieve stored JWT token.
 */
function getToken() {
  return localStorage.getItem('token')
}

/**
 * Core request helper.
 * Attaches Authorization header when a token is present.
 * Returns parsed JSON or throws a structured error.
 */
async function request(endpoint, options = {}) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  let data = {}
  try {
    data = await response.json()
  } catch (e) {
    // If not JSON, leave data as empty object
  }

  if (!response.ok) {
    const msg = data.message || data.error || data.msg || 'An unexpected error occurred.'
    const err = new Error(typeof msg === 'object' ? JSON.stringify(msg) : msg)
    err.status = response.status
    err.data = data
    throw err
  }

  return data
}

// ─── Auth ──────────────────────────────────────────────
export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login:    (payload) => request('/auth/login',    { method: 'POST', body: JSON.stringify(payload) }),
  logout:   ()        => request('/auth/logout',   { method: 'POST' }),
  me:       ()        => request('/auth/me'),
}

// ─── User ──────────────────────────────────────────────
export const userApi = {
  getUser:    (id)      => request(`/users/${id}`),
  updateUser: (id, payload) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  getAllUsers: ()       => request('/users/'),
}

// ─── Freelancer ──────────────────────────────────────────────────
export const freelancerApi = {
  getProfile:    (id)      => request(`/freelancers/${id}`),
  createProfile: (payload) => request('/freelancers/', { method: 'POST', body: JSON.stringify(payload) }),
  updateProfile: (id, payload) => request(`/freelancers/${id}`, { method: 'PUT',  body: JSON.stringify(payload) }),
  getProjects:   ()        => request('/freelancers/projects'),
  acceptProject: (id)      => request(`/freelancers/projects/${id}/accept`, { method: 'POST' }),
  declineProject:(id)      => request(`/freelancers/projects/${id}/decline`,{ method: 'POST' }),
  getEarnings:   ()        => request('/freelancers/earnings'),
}

// ─── Client ─────────────────────────────────────────────
export const clientApi = {
  postProject:       (payload) => request('/projects',                { method: 'POST', body: JSON.stringify(payload) }),
  getProjects:       (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/projects${query ? '?' + query : ''}`)
  },
  getProject:        (id)      => request(`/projects/${id}`),
  getContracts:      ()        => request('/contracts/'),
  releaseMilestone:  (id)      => request(`/contracts/milestones/${id}/approve`, { method: 'PATCH' }),
  getPayments:       ()        => request('/payments'),
  fundEscrow:        (payload) => request('/escrow',                  { method: 'POST', body: JSON.stringify(payload) }),
}

// ─── Invitations ────────────────────────────────────────
export const invitationApi = {
  sendInvitation:    (payload) => request('/invitations', { method: 'POST', body: JSON.stringify(payload) }),
  getMyInvitations:  ()        => request('/invitations/my'),
  acceptInvitation:  (id)      => request(`/invitations/${id}/accept`, { method: 'POST' }),
  declineInvitation: (id)      => request(`/invitations/${id}/decline`, { method: 'POST' }),
}

// ─── Marketplace ────────────────────────────────────────
export const marketplaceApi = {
  searchFreelancers: (params) => {
    const searchParams = new URLSearchParams()
    
    // Handle each parameter properly
    if (params.search_term) searchParams.append('search_term', params.search_term)
    if (params.min_experience !== undefined) searchParams.append('min_experience', params.min_experience)
    if (params.verified_only !== undefined) searchParams.append('verified_only', params.verified_only)
    
    // Handle skills array - append each skill separately
    if (params.skills && Array.isArray(params.skills)) {
      params.skills.forEach(skill => searchParams.append('skills', skill))
    }
    
    const query = searchParams.toString()
    return request(`/marketplace/search${query ? '?' + query : ''}`)
  },
  getFreelancer: (id) => request(`/freelancers/${id}`),
  getAiMatches:  (projectId) => request(`/ai/match/${projectId}`),
}

// ─── Messaging ──────────────────────────────────────────
export const messagingApi = {
  getConversations: ()          => request('/messages/inbox'),
  getMessages:      (threadId)  => request(`/messages/threads/${threadId}`),
  sendMessage:      (payload)   => request('/messages/send', { method: 'POST', body: JSON.stringify(payload) }),
  getOrCreateThread:(payload)   => request('/messages/threads', { method: 'POST', body: JSON.stringify(payload) }),
}

// ─── Admin ──────────────────────────────────────────────
export const adminApi = {
  getUsers:        ()        => request('/admin/users'),
  suspendUser:     (id, payload) => request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getCredentials:  ()        => request('/admin/freelancers/pending'),
  verifyCredential:(id, payload) => request(`/admin/freelancers/${id}/verify`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getDisputes:     ()        => request('/admin/disputes'),
  resolveDispute:  (id, payload) => request(`/disputes/${id}/resolve`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getAnalytics:    ()        => request('/admin/analytics/overview'),
}

// ─── File Upload Helper ─────────────────────────────────
/**
 * Upload helper — sends FormData (no JSON content-type).
 */
async function uploadRequest(endpoint, file) {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  })

  let data = {}
  try {
    data = await response.json()
  } catch (e) { /* non-JSON */ }

  if (!response.ok) {
    const msg = data.message || data.error || 'Upload failed.'
    const err = new Error(typeof msg === 'object' ? JSON.stringify(msg) : msg)
    err.status = response.status
    err.data = data
    throw err
  }

  return data
}

// ─── Notifications ──────────────────────────────────────
export const notificationApi = {
  getNotifications: () => request('/notifications/'),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => request('/notifications/read-all', { method: 'POST' }),
}

// ─── Uploads ────────────────────────────────────────────
export const uploadApi = {
  uploadCredential: (file) => uploadRequest('/uploads/credential', file),
  uploadPortfolio:  (file) => uploadRequest('/uploads/portfolio',  file),
  uploadAvatar:     (file) => uploadRequest('/uploads/avatar',     file),
}

// ─── Financials & Contracts ─────────────────────────────
export const paymentApi = {
  getPayments: () => request('/payments/'),
  getEarnings: () => request('/payments/earnings'),
}

export const mpesaApi = {
  initiateSTKPush: (payload) => request('/payments/mpesa/stk-push', { method: 'POST', body: JSON.stringify(payload) }),
  getPaymentStatus: (paymentId) => request(`/payments/mpesa/status/${paymentId}`),
}

export const escrowApi = {
  fundEscrow: (payload) => request('/escrow/', { method: 'POST', body: JSON.stringify(payload) }),
  getSummary: (contractId) => request(`/escrow/${contractId}`),
}

export const contractApi = {
  create:       (payload) => request('/contracts/create', { method: 'POST', body: JSON.stringify(payload) }),
  getContracts: ()        => request('/contracts/'),
  getContract:  (id)      => request(`/contracts/${id}`),
  accept:       (id)      => request(`/contracts/${id}/accept`, { method: 'PATCH' }),
  reject:       (id)      => request(`/contracts/${id}/reject`, { method: 'PATCH' }),
  fund:         (id)      => request(`/contracts/${id}/fund`, { method: 'POST' }),
  submitMilestone: (id)   => request(`/contracts/milestones/${id}/submit`, { method: 'PATCH' }),
  approveMilestone: (id)  => request(`/contracts/milestones/${id}/approve`, { method: 'PATCH' }),
  addMilestone: (contractId, payload) => request(`/contracts/${contractId}/milestones/add`, { method: 'POST', body: JSON.stringify(payload) }),
}

// ─── Referrals ──────────────────────────────────────────────────
export const referralApi = {
  getMyReferral:      () => request('/referral/me'),
  getReferralStats:   () => request('/referral/stats'),
  getReferralHistory: () => request('/referral/history'),
  createReferral: (payload) => request('/referral/create', { method: 'POST', body: JSON.stringify(payload) }),
}

// ─── Proposals ──────────────────────────────────────────────────
export const proposalApi = {
  submit: (payload) => request('/proposals/submit', { method: 'POST', body: JSON.stringify(payload) }),
  getProjectProposals: (projectId) => request(`/proposals/project/${projectId}`),
  updateStatus: (proposalId, payload) => request(`/proposals/${proposalId}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
}

import axios from 'axios';

// API Base URL - uses env variable or falls back to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : 'http://localhost:4000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach auth token ──────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('buildestate_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: auto-logout on 401 ────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('buildestate_token');
      // Optionally redirect to login
      // window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════
// API Endpoints — aligned with backend routes
// ═══════════════════════════════════════════════════════════

// User Authentication
// Backend register expects { name, email, password }
// We transform fullName → name here so the UI can keep using fullName
export const userAPI = {
  register: (data: { fullName: string; email: string; phone: string; password: string, role?: string }) =>
    apiClient.post('/users/register', {
      name: data.fullName,
      email: data.email,
      password: data.password,
      role: data.role,
    }),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/users/login', data),

  forgotPassword: (data: { email: string; password?: string }) =>
    apiClient.post('/users/forgot', data),

  resetPassword: (token: string, password: string) =>
    apiClient.post(`/users/reset/${token}`, { password }),

  getProfile: () =>
    apiClient.get('/users/me'),
};

// Properties (CRUD — admin-managed listings)
export const propertiesAPI = {
  getAll: () =>
    apiClient.get('/products/list'),

  getById: (id: string) =>
    apiClient.get(`/products/single/${id}`),
};

// User-submitted property listings (require auth)
export const userListingsAPI = {
  create: (formData: FormData) =>
    apiClient.post('/user/properties', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getMyListings: () =>
    apiClient.get('/user/properties'),

  update: (id: string, formData: FormData) =>
    apiClient.put(`/user/properties/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: string) =>
    apiClient.delete(`/user/properties/${id}`),
};

// Appointments (supports guest + auth bookings)
export const appointmentsAPI = {
  schedule: (data: {
    propertyId: string;
    date: string;
    time: string;
    name: string;
    email: string;
    phone: string;
    message?: string;
  }) =>
    apiClient.post('/appointments/schedule', data),

  getByUser: () =>
    apiClient.get('/appointments/user'),

  getAgentAppointments: () =>
    apiClient.get('/appointments/agent'),

  updateStatus: (id: string, status: string) =>
    apiClient.put(`/appointments/status`, { appointmentId: id, status }),

  cancel: (id: string, reason?: string) =>
    apiClient.put(`/appointments/cancel/${id}`, { cancelReason: reason }),
};

// AI-Powered Property Search
// Backend transforms the request via middleware at POST /api/ai/search
export const aiAPI = {
  search: (data: {
    city?: string;
    locality?: string;
    bhk?: string;
    possession?: string;
    includeNoBroker?: boolean;
    price?: { min: number; max: number };
    type?: string;
    category?: string;
  }) => {
    const githubKey    = localStorage.getItem('buildestate_github_key');
    const firecrawlKey = localStorage.getItem('buildestate_firecrawl_key');
    return apiClient.post('/ai/search', data, {
      headers: {
        ...(githubKey    && { 'X-Github-Key':    githubKey }),
        ...(firecrawlKey && { 'X-Firecrawl-Key': firecrawlKey }),
      },
    });
  },

  locationTrends: (city: string) => {
    const githubKey    = localStorage.getItem('buildestate_github_key');
    const firecrawlKey = localStorage.getItem('buildestate_firecrawl_key');
    return apiClient.get(`/locations/${encodeURIComponent(city)}/trends`, {
      headers: {
        ...(githubKey    && { 'X-Github-Key':    githubKey }),
        ...(firecrawlKey && { 'X-Firecrawl-Key': firecrawlKey }),
      },
    });
  },
};

// Helpers to read/write user API keys in localStorage
export const apiKeyStorage = {
  getGithubKey:    ()    => localStorage.getItem('buildestate_github_key') || '',
  getFirecrawlKey: ()    => localStorage.getItem('buildestate_firecrawl_key') || '',
  setGithubKey:    (key: string) => localStorage.setItem('buildestate_github_key', key),
  setFirecrawlKey: (key: string) => localStorage.setItem('buildestate_firecrawl_key', key),
  hasKeys: () => !!(localStorage.getItem('buildestate_github_key') && localStorage.getItem('buildestate_firecrawl_key')),
  clear: () => {
    localStorage.removeItem('buildestate_github_key');
    localStorage.removeItem('buildestate_firecrawl_key');
  },
};

// Contact Form
export const contactAPI = {
  submit: (data: { name: string; email: string; phone: string; message: string }) =>
    apiClient.post('/forms/submit', data),
};

// Chatbot API
export const chatbotAPI = {
  chat: (data: { message: string; context?: any }) =>
    apiClient.post('/bot/chat', data),
};

// EMI Calculator
export const emiAPI = {
  calculate: (data: { principal: number; rate: number; tenureMonths: number }) =>
    apiClient.post('/emi/calculate', data),
};

// Property Requests (Booking & Payment)
export const propertyRequestAPI = {
  expressInterest: (data: { propertyId: string; agentId: string; bookingAmount?: number }) =>
    apiClient.post('/property-requests/interest', data),

  createPaymentOrder: (requestId: string) =>
    apiClient.post(`/property-requests/payment/create/${requestId}`),

  verifyPayment: (data: { requestId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    apiClient.post('/property-requests/payment/verify', data),
    
  confirmCashPayment: (requestId: string) =>
    apiClient.post(`/property-requests/payment/cash/${requestId}`),
    
  updateStatus: (requestId: string, status: string, rejectionReason?: string) =>
    apiClient.put(`/property-requests/status/${requestId}`, { status, rejectionReason }),

  getAgentRequests: () =>
    apiClient.get('/property-requests/agent'),

  getAllRequests: () =>
    apiClient.get('/property-requests/all')
};

export default apiClient;


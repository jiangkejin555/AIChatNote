import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

// Extend config type to support skipAuthRedirect
declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuthRedirect?: boolean
  }
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Skip auto logout for specific requests (like delete account with wrong code)
    const skipRedirect = error.config?.skipAuthRedirect

    if (error.response?.status === 401 && !skipRedirect) {
      // Clear auth state and redirect to login
      useAuthStore.getState().logout()

      // Only redirect if on client side and not already on auth pages
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
          const returnUrl = encodeURIComponent(currentPath)
          window.location.href = `/login?redirect=${returnUrl}`
        }
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient

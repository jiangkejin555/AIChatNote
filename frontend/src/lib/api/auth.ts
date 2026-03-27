import apiClient from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types'

export interface OAuthAuthURLResponse {
  auth_url: string
}

export interface SendVerificationCodeRequest {
  email: string
}

export interface SendVerificationCodeResponse {
  message: string
}

export interface VerifyCodeAndLoginRequest {
  email: string
  code: string
}

export interface ChangePasswordRequest {
  email: string
  code: string
  new_password: string
}

export interface ChangePasswordResponse {
  message: string
}

export interface DeleteAccountRequest {
  code: string
}

export interface DeleteAccountResponse {
  message: string
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data)
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me')
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  getOAuthURL: async (provider: string): Promise<OAuthAuthURLResponse> => {
    const response = await apiClient.get<OAuthAuthURLResponse>(`/oauth/${provider}/auth-url`)
    return response.data
  },

  handleOAuthCallback: async (provider: string, code: string, state: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(`/oauth/${provider}/callback`, {
      code,
      state,
    })
    return response.data
  },

  sendVerificationCode: async (data: SendVerificationCodeRequest): Promise<SendVerificationCodeResponse> => {
    const response = await apiClient.post<SendVerificationCodeResponse>('/auth/email/code', data)
    return response.data
  },

  verifyCodeAndLogin: async (data: VerifyCodeAndLoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/email/login', data)
    return response.data
  },

  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    const response = await apiClient.put<ChangePasswordResponse>('/auth/password', data)
    return response.data
  },

  deleteAccount: async (data: DeleteAccountRequest): Promise<DeleteAccountResponse> => {
    const response = await apiClient.delete<DeleteAccountResponse>('/auth/account', { data })
    return response.data
  },
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authApi from '../api/authApi'
import { configureAuthInterceptors } from '../api/client'

const initialState = {
  token: null,
  expiresAt: null,
  user: null,
  status: 'idle',
  error: null,
}


export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      isAuthenticated() {
        const { token, expiresAt } = get()
        return Boolean(token && Date.now() < expiresAt)
      },

      async login(correo, contrasena) {
        set({ status: 'loading', error: null })
        try {
          const data = await authApi.login({ correo, contrasena })
          set({
            token: data.access_token,
            expiresAt: Date.now() + data.expires_in * 1000,
            status: 'authenticated',
            error: null,
          })
          await get().fetchCurrentUser()
        } catch (error) {
          set({ ...initialState, error })
          throw error
        }
      },

      async fetchCurrentUser() {
        try {
          const user = await authApi.fetchMe()
          set({ user, status: 'authenticated', error: null })
        } catch (error) {
          set({ ...initialState, error })
          throw error
        }
      },

      async logout() {
        try {
          await authApi.logout()
        } finally {
          set(initialState)
        }
      },

      clearSession() {
        set(initialState)
      },
    }),
    {
      name: 'si2-auth',
      partialize: (state) => ({
        token: state.token,
        expiresAt: state.expiresAt,
        user: state.user,
      }),
    },
  ),
)

configureAuthInterceptors({
  tokenGetter: () => useAuthStore.getState().token,
  onUnauthorized: () => {
    useAuthStore.setState(initialState)
    if (!window.location.pathname.startsWith('/login')) {
      window.location.replace('/login')
    }
  },
})

export const selectIsAuthenticated = (state) =>
  Boolean(state.token && Date.now() < state.expiresAt && state.user)

export const selectUser = (state) => state.user

export const selectStatus = (state) => state.status

export const selectError = (state) => state.error

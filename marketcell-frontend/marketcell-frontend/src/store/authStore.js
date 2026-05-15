import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      login: (user, tokens) => {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        set({ user, isLoggedIn: true });
      },
      logout: () => {
        localStorage.clear();
        set({ user: null, isLoggedIn: false });
      },
    }),
    { name: 'auth-storage' }
  )
);
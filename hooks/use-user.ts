"use client"

import { create } from "zustand"
import { getCurrentUser, signOut as firebaseSignOut } from "@/lib/firebase/visionaries-tech"

export type UserRole = "admin" | "pm" | "developer" | "qa" | "client"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  superadmin?: boolean
}

interface UserStore {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
  logout: () => Promise<void>
}

export const useUser = create<UserStore>()((set) => ({
  user: null, // Iniciar sin usuario - requiere login
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  logout: async () => {
    try {
      await firebaseSignOut()
      set({ user: null })
    } catch (error) {
      console.error('[useUser] Error al cerrar sesión:', error)
      set({ user: null })
    }
  },
}))

export const useUserStore = useUser

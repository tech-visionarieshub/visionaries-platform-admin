"use client"

import { create } from "zustand"

export type UserRole = "admin" | "pm" | "developer" | "qa" | "client"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

interface UserStore {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
  logout: () => void
}

export const useUser = create<UserStore>()((set) => ({
  user: {
    id: "1",
    name: "Gaby Pino",
    email: "gabypino@visionarieshub.com",
    role: "admin",
    avatar: "GP",
  },
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  logout: () => set({ user: null }),
}))

export const useUserStore = useUser

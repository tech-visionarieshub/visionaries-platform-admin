"use client"

// Simulated Firebase integration for user management
// Uses localStorage to persist data

export interface FirebaseUser {
  id: string
  name: string
  email: string
  role: "admin" | "pm" | "developer" | "qa" | "client"
  createdAt: string
  updatedAt: string
}

const USERS_KEY = "firebase_users"

// Initialize with default users if localStorage is empty
const initializeUsers = (): FirebaseUser[] => {
  const defaultUsers: FirebaseUser[] = [
    {
      id: "1",
      name: "Gaby Pino",
      email: "gabypino@visionarieshub.com",
      role: "admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Carlos Ramirez",
      email: "carlos@visionarieshub.com",
      role: "pm",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Ana Torres",
      email: "ana@visionarieshub.com",
      role: "developer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "4",
      name: "Luis Garcia",
      email: "luis@visionarieshub.com",
      role: "qa",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(USERS_KEY)
    if (!stored) {
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers))
      return defaultUsers
    }
    return JSON.parse(stored)
  }

  return defaultUsers
}

// Get all users from "database"
export const getUsers = (): FirebaseUser[] => {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(USERS_KEY)
  if (!stored) {
    return initializeUsers()
  }
  return JSON.parse(stored)
}

// Get user by email
export const getUserByEmail = (email: string): FirebaseUser | null => {
  const users = getUsers()
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
}

// Get user by ID
export const getUserById = (id: string): FirebaseUser | null => {
  const users = getUsers()
  return users.find((u) => u.id === id) || null
}

// Create new user
export const createUser = (userData: Omit<FirebaseUser, "id" | "createdAt" | "updatedAt">): FirebaseUser => {
  const users = getUsers()

  // Check if email already exists
  if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
    throw new Error("El email ya está registrado")
  }

  // Validate email domain
  if (!userData.email.endsWith("@visionarieshub.com")) {
    throw new Error("Solo se permiten correos del dominio @visionarieshub.com")
  }

  const newUser: FirebaseUser = {
    ...userData,
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const updatedUsers = [...users, newUser]
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers))

  return newUser
}

// Update user
export const updateUser = (id: string, updates: Partial<Omit<FirebaseUser, "id" | "createdAt">>): FirebaseUser => {
  const users = getUsers()
  const userIndex = users.findIndex((u) => u.id === id)

  if (userIndex === -1) {
    throw new Error("Usuario no encontrado")
  }

  const updatedUser: FirebaseUser = {
    ...users[userIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  users[userIndex] = updatedUser
  localStorage.setItem(USERS_KEY, JSON.stringify(users))

  return updatedUser
}

// Delete user
export const deleteUser = (id: string): void => {
  const users = getUsers()

  // Prevent deleting the main admin
  const user = users.find((u) => u.id === id)
  if (user?.email === "gabypino@visionarieshub.com") {
    throw new Error("No puedes eliminar al administrador principal")
  }

  const filteredUsers = users.filter((u) => u.id !== id)
  localStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers))
}

// Simulate authentication check
export const authenticateUser = (email: string, password: string): FirebaseUser | null => {
  // In a real app, this would verify password hash
  // For simulation, we just check if user exists and password matches the secret
  const user = getUserByEmail(email)

  if (!user) {
    return null
  }

  // Check secret password
  if (email === "gabypino@visionarieshub.com" && password === "HolaVisionaries2025-") {
    return user
  }

  // For other users, accept any password in simulation mode
  // In production, this would verify against stored password hash
  return user
}

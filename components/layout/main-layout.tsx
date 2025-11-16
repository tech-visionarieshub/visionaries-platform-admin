import type React from "react"
import { Header } from "./header"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[#FAFBFC] p-8">
        <div className="mx-auto max-w-[1440px]">{children}</div>
      </main>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Shield, AlertCircle, Loader2, Info, ArrowRight } from "lucide-react"
import { signInWithGoogle, getAuthInstance } from "@/lib/firebase/visionaries-tech"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'unauthorized') {
      setError("Tu cuenta no tiene permisos para acceder a esta plataforma.")
    }
  }, [searchParams])

  const handleLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log("[Auth] Iniciando login con Google...")
      const result = await signInWithGoogle()
      console.log("[Auth] Login exitoso:", result.user.email)
      
      // Verificar claims preliminarmente
      const tokenResult = await result.user.getIdTokenResult()
      if (!tokenResult.claims.internal && !tokenResult.claims.superadmin && result.user.email !== 'adminplatform@visionarieshub.com') {
         setError("Cuenta autenticada, pero sin permisos de acceso interno.")
         await getAuthInstance().signOut()
         setIsLoading(false)
         return
      }

      toast({
        title: "Bienvenido",
        description: "Sesión iniciada correctamente",
      })
      
      // Redirigir al dashboard
      router.push('/')
      
    } catch (err: any) {
      console.error("[Auth] Error en login:", err)
      
      // Detectar tipos específicos de errores
      if (err.code === 'auth/popup-blocked') {
        setError("El popup de Google fue bloqueado. Por favor, permite popups e intenta de nuevo.")
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError("Cancelaste el login. Por favor, intenta de nuevo.")
      } else {
        setError("Error al iniciar sesión. Intenta de nuevo.")
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-700 bg-slate-900/50 backdrop-blur text-slate-100">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Admin Portal
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2 text-lg">
              Visionaries Tech
          </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 text-sm text-red-200 bg-red-900/30 p-4 rounded-lg border border-red-800 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex items-start gap-3 text-sm text-blue-200 bg-blue-900/30 p-4 rounded-lg border border-blue-800">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium">¿Ya estás logueado en Aura?</p>
              <p>Si ya iniciaste sesión en Aura (con Google, Microsoft o Email), puedes acceder desde allí haciendo clic en el botón "Portal Admin".</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              className="w-full h-14 text-lg font-medium bg-white text-slate-900 hover:bg-slate-100 transition-all hover:scale-[1.02] disabled:opacity-50" 
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-3" />
                  Iniciar Sesión con Google
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700"></span>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900/50 text-slate-400">o</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-12 border-slate-700 hover:bg-slate-800 text-slate-100"
              asChild
            >
              <a href="https://aura.visionarieshub.com" target="_blank" rel="noopener noreferrer">
                <ArrowRight className="h-4 w-4 mr-2" />
                Ir a Aura
              </a>
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-slate-800 pt-6">
          <p className="text-xs text-slate-500">
            Acceso restringido a personal autorizado
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

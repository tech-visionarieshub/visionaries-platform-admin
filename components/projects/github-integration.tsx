"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GitBranch, GitCommit, GitPullRequest, TrendingUp, User, Calendar, CheckCircle2, Clock, Plus, X, AlertCircle, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { getIdToken } from "@/lib/firebase/visionaries-tech"

interface GitHubData {
  connected: boolean
  repository: { name: string; fullName: string; url: string } | null
  recentCommits: Array<{
    id: string
    message: string
    author: string
    date: string
    branch: string
    additions: number
    deletions: number
    url: string
  }>
  pullRequests: Array<{
    id: string
    title: string
    author: string
    status: string
    reviews: number
    created: string
    url: string
  }>
  metrics: {
    totalCommits: number
    totalPRs: number
    openPRs: number
    mergedPRs: number
    averageReviewTime: string
    codeChurn: number
  }
  developerStats: Array<{
    name: string
    commits: number
    prs: number
    linesAdded: number
    linesDeleted: number
    velocity: number
  }>
}

export function GitHubIntegration() {
  const params = useParams()
  const projectId = params?.id as string
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [data, setData] = useState<GitHubData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAddRepoDialog, setShowAddRepoDialog] = useState(false)
  const [newRepoInput, setNewRepoInput] = useState("")
  const [addingRepo, setAddingRepo] = useState(false)

  const loadData = async () => {
    if (!projectId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`/api/projects/${projectId}/github`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al cargar datos de GitHub")
      }

      const githubData = await response.json()
      setData(githubData)
    } catch (err: any) {
      console.error("Error loading GitHub data:", err)
      setError(err.message || "Error al cargar datos de GitHub")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [projectId])

  const handleSync = async () => {
    setSyncing(true)
    await loadData()
    setSyncing(false)
    toast({
      title: "Sincronización completada",
      description: "Los datos de GitHub se han actualizado",
    })
  }

  const handleConnectRepository = async () => {
    if (!newRepoInput.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un repositorio en formato owner/repo",
        variant: "destructive",
      })
      return
    }

    // Validar formato owner/repo
    const parts = newRepoInput.trim().split("/")
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      toast({
        title: "Error",
        description: "Formato inválido. Debe ser: owner/repo (ej: visionarieshub/frontend-app)",
        variant: "destructive",
      })
      return
    }

    setAddingRepo(true)
    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`/api/projects/${projectId}/github`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repository: newRepoInput.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al conectar repositorio")
      }

      toast({
        title: "Repositorio conectado",
        description: "El repositorio se ha conectado exitosamente",
      })

      setShowAddRepoDialog(false)
      setNewRepoInput("")
      await loadData()
    } catch (err: any) {
      console.error("Error connecting repository:", err)
      toast({
        title: "Error",
        description: err.message || "Error al conectar repositorio. Verifica que el token de GitHub esté configurado en Settings.",
        variant: "destructive",
      })
    } finally {
      setAddingRepo(false)
    }
  }

  const handleDisconnectRepository = async () => {
    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`/api/projects/${projectId}/github`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al desconectar repositorio")
      }

      toast({
        title: "Repositorio desconectado",
        description: "El repositorio se ha desconectado exitosamente",
      })

      await loadData()
    } catch (err: any) {
      console.error("Error disconnecting repository:", err)
      toast({
        title: "Error",
        description: err.message || "Error al desconectar repositorio",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#4514F9]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Error al cargar datos de GitHub</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
          <Button onClick={loadData} className="mt-4" variant="outline">
            Reintentar
          </Button>
        </Card>
      </div>
    )
  }

  const githubData = data || {
    connected: false,
    repository: null,
    recentCommits: [],
    pullRequests: [],
    metrics: {
      totalCommits: 0,
      totalPRs: 0,
      openPRs: 0,
      mergedPRs: 0,
      averageReviewTime: "0 horas",
      codeChurn: 0,
    },
    developerStats: [],
  }

  // Si no hay repositorio conectado, mostrar formulario de conexión
  if (!githubData.connected || !githubData.repository) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#0E0734]">Integración GitHub</h2>
            <p className="text-muted-foreground">Conecta el repositorio de GitHub de este proyecto</p>
          </div>
        </div>

        <Card className="p-8">
          <div className="text-center space-y-4">
            <GitBranch className="h-16 w-16 mx-auto text-[#4514F9] opacity-50" />
            <div>
              <h3 className="text-lg font-semibold text-[#0E0734] mb-2">No hay repositorio conectado</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Conecta el repositorio de GitHub de este proyecto para ver métricas, commits y pull requests
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="space-y-2">
                <label htmlFor="repo-input" className="text-sm font-medium text-[#0E0734]">
                  Repositorio (owner/repo)
                </label>
                <Input
                  id="repo-input"
                  placeholder="visionarieshub/frontend-app"
                  value={newRepoInput}
                  onChange={(e) => setNewRepoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleConnectRepository()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Asegúrate de tener configurado el token de GitHub en{" "}
                  <a href="/settings" className="text-[#4514F9] hover:underline">
                    Settings
                  </a>
                </p>
              </div>
              <Button
                onClick={handleConnectRepository}
                disabled={addingRepo || !newRepoInput.trim()}
                className="w-full"
              >
                {addingRepo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Conectar Repositorio
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0E0734]">Integración GitHub</h2>
          <p className="text-muted-foreground">Métricas y tracking automático de desarrollo</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={githubData.connected ? "text-[#95C900]" : "text-gray-500"}>
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {githubData.connected ? "Conectado" : "No conectado"}
          </Badge>
          <Button onClick={handleSync} disabled={syncing || !githubData.connected} variant="outline">
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              "Sincronizar"
            )}
          </Button>
        </div>
      </div>

      {/* Repository Info */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranch className="h-5 w-5 text-[#4514F9]" />
            <div>
              <h3 className="font-semibold text-[#0E0734]">{githubData.repository.name}</h3>
              <p className="text-sm text-muted-foreground">{githubData.repository.fullName}</p>
            </div>
          </div>
              <div className="flex items-center gap-2">
              <a
              href={githubData.repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#4514F9] hover:underline"
              >
                Ver en GitHub
              </a>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNewRepoInput(githubData.repository!.fullName)
                setShowAddRepoDialog(true)
              }}
            >
              Cambiar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDisconnectRepository}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
            </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="commits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="commits">Commits Recientes</TabsTrigger>
          <TabsTrigger value="prs">Pull Requests</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="team">Equipo</TabsTrigger>
        </TabsList>

        {/* Commits Tab */}
        <TabsContent value="commits">
          <Card className="p-4">
            {githubData.recentCommits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GitCommit className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay commits recientes</p>
              </div>
            ) : (
            <div className="space-y-3">
                {githubData.recentCommits.map((commit) => (
                  <a
                    key={commit.id}
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors block"
                  >
                  <GitCommit className="h-5 w-5 text-[#4514F9] mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-[#0E0734]">{commit.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {commit.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(commit.date).toLocaleDateString("es-ES")}
                      </div>
                      <Badge variant="outline" className="text-[#95C900]">
                        +{commit.additions}
                      </Badge>
                      <Badge variant="outline" className="text-[#E02814]">
                        -{commit.deletions}
                      </Badge>
                    </div>
                  </div>
                  </a>
              ))}
            </div>
            )}
          </Card>
        </TabsContent>

        {/* Pull Requests Tab */}
        <TabsContent value="prs">
          <Card className="p-4">
            {githubData.pullRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GitPullRequest className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay pull requests</p>
              </div>
            ) : (
            <div className="space-y-3">
                {githubData.pullRequests.map((pr) => (
                  <a
                    key={pr.id}
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors block"
                  >
                  <GitPullRequest className="h-5 w-5 text-[#4514F9] mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-[#0E0734]">{pr.title}</p>
                        <Badge variant="outline" className={pr.status === "open" ? "text-[#4BBAFF]" : "text-gray-500"}>
                        {pr.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {pr.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {pr.reviews} reviews
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {pr.created}
                      </div>
                    </div>
                  </div>
                  </a>
              ))}
            </div>
            )}
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#4514F9]/10 rounded-lg">
                  <GitCommit className="h-5 w-5 text-[#4514F9]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0E0734]">{githubData.metrics.totalCommits}</p>
                  <p className="text-sm text-muted-foreground">Total Commits</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#4BBAFF]/10 rounded-lg">
                  <GitPullRequest className="h-5 w-5 text-[#4BBAFF]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0E0734]">{githubData.metrics.totalPRs}</p>
                  <p className="text-sm text-muted-foreground">Pull Requests</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#95C900]/10 rounded-lg">
                  <Clock className="h-5 w-5 text-[#95C900]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0E0734]">{githubData.metrics.averageReviewTime}</p>
                  <p className="text-sm text-muted-foreground">Tiempo Promedio Review</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-4 mt-4">
            <h3 className="font-semibold text-[#0E0734] mb-4">Estado de Pull Requests</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Abiertos</span>
                  <span className="text-sm font-medium">{githubData.metrics.openPRs}</span>
                </div>
                <Progress value={githubData.metrics.totalPRs > 0 ? (githubData.metrics.openPRs / githubData.metrics.totalPRs) * 100 : 0} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Merged</span>
                  <span className="text-sm font-medium">{githubData.metrics.mergedPRs}</span>
                </div>
                <Progress
                  value={githubData.metrics.totalPRs > 0 ? (githubData.metrics.mergedPRs / githubData.metrics.totalPRs) * 100 : 0}
                  className="[&>div]:bg-[#95C900]"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Card className="p-4">
            <h3 className="font-semibold text-[#0E0734] mb-4">Estadísticas del Equipo</h3>
            {githubData.developerStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay estadísticas de desarrolladores disponibles</p>
              </div>
            ) : (
            <div className="space-y-4">
                {githubData.developerStats.map((dev, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-[#4514F9]/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-[#4514F9]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#0E0734]">{dev.name}</p>
                        <p className="text-xs text-muted-foreground">Velocity: {dev.velocity} pts/sprint</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[#4514F9]">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {dev.velocity}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-[#0E0734]">{dev.commits}</p>
                      <p className="text-xs text-muted-foreground">Commits</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#0E0734]">{dev.prs}</p>
                      <p className="text-xs text-muted-foreground">PRs</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#95C900]">+{dev.linesAdded}</p>
                      <p className="text-xs text-muted-foreground">Líneas</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#E02814]">-{dev.linesDeleted}</p>
                      <p className="text-xs text-muted-foreground">Líneas</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para cambiar repositorio */}
      <Dialog open={showAddRepoDialog} onOpenChange={setShowAddRepoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{githubData.repository ? "Cambiar Repositorio" : "Conectar Repositorio"}</DialogTitle>
            <DialogDescription>
              Ingresa el repositorio en formato owner/repo (ej: visionarieshub/frontend-app)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="owner/repo"
              value={newRepoInput}
              onChange={(e) => setNewRepoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConnectRepository()
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Asegúrate de tener configurado el token de GitHub en{" "}
              <a href="/settings" className="text-[#4514F9] hover:underline">
                Settings
              </a>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddRepoDialog(false)
              setNewRepoInput("")
            }}>
              Cancelar
            </Button>
            <Button onClick={handleConnectRepository} disabled={addingRepo || !newRepoInput.trim()}>
              {addingRepo ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                githubData.repository ? "Cambiar" : "Conectar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

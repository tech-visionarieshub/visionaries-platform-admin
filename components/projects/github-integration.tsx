"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { GitBranch, GitCommit, GitPullRequest, TrendingUp, User, Calendar, CheckCircle2, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock GitHub data
const mockGitHubData = {
  connected: true,
  repositories: [
    { name: "frontend-app", url: "https://github.com/visionarieshub/frontend-app" },
    { name: "backend-api", url: "https://github.com/visionarieshub/backend-api" },
  ],
  recentCommits: [
    {
      id: "1",
      message: "[TASK-3] Implement JWT authentication middleware",
      author: "María García",
      date: "2025-01-28T10:30:00",
      branch: "feature/jwt-auth",
      additions: 145,
      deletions: 23,
    },
    {
      id: "2",
      message: "[TASK-6] Add pagination to product grid",
      author: "Ana López",
      date: "2025-01-28T09:15:00",
      branch: "feature/pagination",
      additions: 89,
      deletions: 12,
    },
    {
      id: "3",
      message: "[TASK-1] Fix form validation bugs",
      author: "Juan Pérez",
      date: "2025-01-27T16:45:00",
      branch: "feature/register-form",
      additions: 34,
      deletions: 18,
    },
  ],
  pullRequests: [
    {
      id: "1",
      title: "Feature: JWT Authentication",
      author: "María García",
      status: "open",
      reviews: 2,
      created: "2025-01-27",
    },
    {
      id: "2",
      title: "Feature: Product Pagination",
      author: "Ana López",
      status: "open",
      reviews: 1,
      created: "2025-01-28",
    },
  ],
  metrics: {
    totalCommits: 247,
    totalPRs: 45,
    openPRs: 2,
    mergedPRs: 43,
    averageReviewTime: "4.2 horas",
    codeChurn: 12,
  },
  developerStats: [
    {
      name: "María García",
      commits: 68,
      prs: 12,
      linesAdded: 4523,
      linesDeleted: 1234,
      velocity: 8.5,
    },
    {
      name: "Juan Pérez",
      commits: 54,
      prs: 10,
      linesAdded: 3876,
      linesDeleted: 987,
      velocity: 7.2,
    },
    {
      name: "Ana López",
      commits: 47,
      prs: 9,
      linesAdded: 3245,
      linesDeleted: 876,
      velocity: 6.8,
    },
    {
      name: "Carlos Méndez",
      commits: 42,
      prs: 8,
      linesAdded: 2987,
      linesDeleted: 654,
      velocity: 6.1,
    },
  ],
}

export function GitHubIntegration() {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSyncing(false)
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
          <Badge variant="outline" className="text-[#95C900]">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
          <Button onClick={handleSync} disabled={syncing} variant="outline">
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
      </div>

      {/* Repositories */}
      <Card className="p-4">
        <h3 className="font-semibold text-[#0E0734] mb-3">Repositorios Conectados</h3>
        <div className="space-y-2">
          {mockGitHubData.repositories.map((repo, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-[#4514F9]" />
                <span className="font-medium">{repo.name}</span>
              </div>
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#4514F9] hover:underline"
              >
                Ver en GitHub
              </a>
            </div>
          ))}
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
            <div className="space-y-3">
              {mockGitHubData.recentCommits.map((commit) => (
                <div key={commit.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
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
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Pull Requests Tab */}
        <TabsContent value="prs">
          <Card className="p-4">
            <div className="space-y-3">
              {mockGitHubData.pullRequests.map((pr) => (
                <div key={pr.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <GitPullRequest className="h-5 w-5 text-[#4514F9] mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-[#0E0734]">{pr.title}</p>
                      <Badge variant="outline" className="text-[#4BBAFF]">
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
                </div>
              ))}
            </div>
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
                  <p className="text-2xl font-bold text-[#0E0734]">{mockGitHubData.metrics.totalCommits}</p>
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
                  <p className="text-2xl font-bold text-[#0E0734]">{mockGitHubData.metrics.totalPRs}</p>
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
                  <p className="text-2xl font-bold text-[#0E0734]">{mockGitHubData.metrics.averageReviewTime}</p>
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
                  <span className="text-sm font-medium">{mockGitHubData.metrics.openPRs}</span>
                </div>
                <Progress value={(mockGitHubData.metrics.openPRs / mockGitHubData.metrics.totalPRs) * 100} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Merged</span>
                  <span className="text-sm font-medium">{mockGitHubData.metrics.mergedPRs}</span>
                </div>
                <Progress
                  value={(mockGitHubData.metrics.mergedPRs / mockGitHubData.metrics.totalPRs) * 100}
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
            <div className="space-y-4">
              {mockGitHubData.developerStats.map((dev, index) => (
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
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

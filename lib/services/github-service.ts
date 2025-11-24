import { getInternalFirestore } from '@/lib/firebase/admin-platform';

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  updated_at: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  html_url: string;
}

interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  html_url: string;
  reviews?: number;
}

interface GitHubMetrics {
  totalCommits: number;
  totalPRs: number;
  openPRs: number;
  mergedPRs: number;
  averageReviewTime: string;
  codeChurn: number;
}

interface GitHubDeveloperStats {
  name: string;
  commits: number;
  prs: number;
  linesAdded: number;
  linesDeleted: number;
  velocity: number;
}

export class GitHubService {
  private db = getInternalFirestore();
  private configCollection = this.db.collection('config');
  private readonly GITHUB_API_BASE = 'https://api.github.com';

  /**
   * Obtiene el token de GitHub desde Firestore
   */
  private async getToken(): Promise<string> {
    const doc = await this.configCollection.doc('github').get();
    
    if (!doc.exists) {
      throw new Error('GitHub token no está configurado. Ve a Settings para configurarlo.');
    }

    const data = doc.data();
    if (!data?.token) {
      throw new Error('GitHub token no está configurado. Ve a Settings para configurarlo.');
    }

    return data.token;
  }

  /**
   * Hace una petición autenticada a la API de GitHub
   */
  private async githubRequest<T>(endpoint: string): Promise<T> {
    const token = await this.getToken();
    const url = `${this.GITHUB_API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Visionaries-Platform-Admin',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token de GitHub inválido o expirado');
      }
      if (response.status === 404) {
        throw new Error('Recurso no encontrado en GitHub');
      }
      throw new Error(`Error de GitHub API: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Obtiene información del usuario autenticado
   */
  async getUser(): Promise<GitHubUser> {
    return this.githubRequest<GitHubUser>('/user');
  }

  /**
   * Obtiene todos los repositorios del usuario/organización
   */
  async getRepositories(): Promise<GitHubRepository[]> {
    const repos: GitHubRepository[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `${this.GITHUB_API_BASE}/user/repos?per_page=100&page=${page}&sort=updated`,
        {
          headers: {
            'Authorization': `token ${await this.getToken()}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Visionaries-Platform-Admin',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error obteniendo repositorios: ${response.status}`);
      }

      const pageRepos = await response.json();
      repos.push(...pageRepos);

      hasMore = pageRepos.length === 100;
      page++;
    }

    return repos;
  }

  /**
   * Obtiene los commits recientes de un repositorio
   */
  async getRecentCommits(owner: string, repo: string, limit: number = 10): Promise<GitHubCommit[]> {
    const commits = await this.githubRequest<GitHubCommit[]>(
      `/repos/${owner}/${repo}/commits?per_page=${limit}`
    );

    // Obtener estadísticas de cada commit
    const commitsWithStats = await Promise.all(
      commits.map(async (commit) => {
        try {
          const stats = await this.githubRequest<{ stats: { additions: number; deletions: number; total: number } }>(
            `/repos/${owner}/${repo}/commits/${commit.sha}`
          );
          return {
            ...commit,
            stats: stats.stats,
          };
        } catch (error) {
          // Si falla obtener stats, continuar sin ellas
          return commit;
        }
      })
    );

    return commitsWithStats;
  }

  /**
   * Obtiene los pull requests de un repositorio
   */
  async getPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'all'): Promise<GitHubPullRequest[]> {
    const prs = await this.githubRequest<GitHubPullRequest[]>(
      `/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`
    );

    // Obtener número de reviews para cada PR
    const prsWithReviews = await Promise.all(
      prs.map(async (pr) => {
        try {
          const reviews = await this.githubRequest<any[]>(
            `/repos/${owner}/${repo}/pulls/${pr.number}/reviews`
          );
          return {
            ...pr,
            reviews: reviews.length,
          };
        } catch (error) {
          return { ...pr, reviews: 0 };
        }
      })
    );

    return prsWithReviews;
  }

  /**
   * Obtiene métricas agregadas de un repositorio
   */
  async getRepositoryMetrics(owner: string, repo: string): Promise<GitHubMetrics> {
    const [allPRs, openPRs, commits] = await Promise.all([
      this.getPullRequests(owner, repo, 'all'),
      this.getPullRequests(owner, repo, 'open'),
      this.getRecentCommits(owner, repo, 100),
    ]);

    const mergedPRs = allPRs.filter(pr => pr.merged_at !== null);
    
    // Calcular tiempo promedio de review (simplificado)
    const reviewTimes: number[] = [];
    for (const pr of mergedPRs.slice(0, 10)) {
      try {
        const prDetails = await this.githubRequest<any>(`/repos/${owner}/${repo}/pulls/${pr.number}`);
        if (prDetails.created_at && prDetails.merged_at) {
          const created = new Date(prDetails.created_at).getTime();
          const merged = new Date(prDetails.merged_at).getTime();
          const hours = (merged - created) / (1000 * 60 * 60);
          reviewTimes.push(hours);
        }
      } catch (error) {
        // Continuar si falla
      }
    }

    const avgReviewTime = reviewTimes.length > 0
      ? (reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length).toFixed(1)
      : '0';

    // Calcular code churn (simplificado)
    const totalAdditions = commits.reduce((sum, commit) => sum + (commit.stats?.additions || 0), 0);
    const totalDeletions = commits.reduce((sum, commit) => sum + (commit.stats?.deletions || 0), 0);
    const codeChurn = totalAdditions > 0 ? Math.round((totalDeletions / totalAdditions) * 100) : 0;

    return {
      totalCommits: commits.length,
      totalPRs: allPRs.length,
      openPRs: openPRs.length,
      mergedPRs: mergedPRs.length,
      averageReviewTime: `${avgReviewTime} horas`,
      codeChurn,
    };
  }

  /**
   * Obtiene estadísticas de desarrolladores de un repositorio
   */
  async getDeveloperStats(owner: string, repo: string): Promise<GitHubDeveloperStats[]> {
    const commits = await this.getRecentCommits(owner, repo, 100);
    const prs = await this.getPullRequests(owner, repo, 'all');

    // Agrupar por autor
    const authorStats = new Map<string, {
      commits: number;
      prs: number;
      linesAdded: number;
      linesDeleted: number;
    }>();

    commits.forEach(commit => {
      const authorName = commit.author?.login || commit.commit.author.name;
      const current = authorStats.get(authorName) || {
        commits: 0,
        prs: 0,
        linesAdded: 0,
        linesDeleted: 0,
      };
      current.commits++;
      current.linesAdded += commit.stats?.additions || 0;
      current.linesDeleted += commit.stats?.deletions || 0;
      authorStats.set(authorName, current);
    });

    prs.forEach(pr => {
      const authorName = pr.user.login;
      const current = authorStats.get(authorName) || {
        commits: 0,
        prs: 0,
        linesAdded: 0,
        linesDeleted: 0,
      };
      current.prs++;
      authorStats.set(authorName, current);
    });

    // Convertir a array y calcular velocity (simplificado)
    return Array.from(authorStats.entries()).map(([name, stats]) => ({
      name,
      commits: stats.commits,
      prs: stats.prs,
      linesAdded: stats.linesAdded,
      linesDeleted: stats.linesDeleted,
      velocity: Math.round((stats.commits + stats.prs * 2) / 10), // Fórmula simplificada
    })).sort((a, b) => b.velocity - a.velocity);
  }

  /**
   * Obtiene el repositorio asociado a un proyecto desde Firestore
   */
  async getProjectRepository(projectId: string): Promise<string | null> {
    const projectDoc = await this.db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return null;
    }
    const data = projectDoc.data();
    return data?.githubRepository || null;
  }

  /**
   * Guarda el repositorio asociado a un proyecto en Firestore
   */
  async saveProjectRepository(projectId: string, repository: string | null): Promise<void> {
    await this.db.collection('projects').doc(projectId).set({
      githubRepository: repository,
      updatedAt: new Date(),
    }, { merge: true });
  }
}

export const githubService = new GitHubService();


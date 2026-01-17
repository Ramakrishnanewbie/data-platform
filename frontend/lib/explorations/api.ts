import type {
  Exploration,
  ExplorationCell,
  ExplorationsListResponse,
  CreateExplorationRequest,
  UpdateExplorationRequest,
  CreateCellRequest,
  UpdateCellRequest,
  ReorderCellsRequest,
  ShareExplorationRequest,
  ExplorationShare,
  CellOutput,
} from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchWithError<T>(url: string, options?: RequestInit & { userId?: string }): Promise<T> {
  const { userId, ...restOptions } = options || {}
  const response = await fetch(url, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'X-User-ID': userId } : {}),
      ...restOptions?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `Request failed with status ${response.status}`)
  }

  return response.json()
}

// Explorations CRUD
export async function fetchExplorations(params: {
  userId: string
  page?: number
  limit?: number
  search?: string
  tags?: string[]
  includeShared?: boolean
}): Promise<ExplorationsListResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.search) searchParams.set('search', params.search)
  if (params.tags?.length) searchParams.set('tags', params.tags.join(','))
  if (params.includeShared) searchParams.set('include_shared', 'true')

  const queryString = searchParams.toString()
  return fetchWithError<ExplorationsListResponse>(
    `${API_BASE}/api/explorations${queryString ? `?${queryString}` : ''}`,
    { userId: params.userId }
  )
}

export async function fetchExploration(id: string, userId: string): Promise<Exploration> {
  return fetchWithError<Exploration>(
    `${API_BASE}/api/explorations/${id}`,
    { userId }
  )
}

export async function createExploration(
  userId: string,
  data: CreateExplorationRequest
): Promise<Exploration> {
  return fetchWithError<Exploration>(
    `${API_BASE}/api/explorations`,
    {
      method: 'POST',
      body: JSON.stringify(data),
      userId,
    }
  )
}

export async function updateExploration(
  id: string,
  userId: string,
  data: UpdateExplorationRequest
): Promise<Exploration> {
  return fetchWithError<Exploration>(
    `${API_BASE}/api/explorations/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
      userId,
    }
  )
}

export async function deleteExploration(id: string, userId: string): Promise<void> {
  await fetchWithError<{ status: string }>(
    `${API_BASE}/api/explorations/${id}`,
    { method: 'DELETE', userId }
  )
}

export async function duplicateExploration(
  id: string,
  userId: string
): Promise<Exploration> {
  return fetchWithError<Exploration>(
    `${API_BASE}/api/explorations/${id}/duplicate`,
    { method: 'POST', userId }
  )
}

// Cell operations
export async function createCell(
  explorationId: string,
  userId: string,
  data: CreateCellRequest
): Promise<ExplorationCell> {
  return fetchWithError<ExplorationCell>(
    `${API_BASE}/api/explorations/${explorationId}/cells`,
    {
      method: 'POST',
      body: JSON.stringify(data),
      userId,
    }
  )
}

export async function updateCell(
  explorationId: string,
  cellId: string,
  userId: string,
  data: UpdateCellRequest
): Promise<ExplorationCell> {
  return fetchWithError<ExplorationCell>(
    `${API_BASE}/api/explorations/${explorationId}/cells/${cellId}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
      userId,
    }
  )
}

export async function deleteCell(
  explorationId: string,
  cellId: string,
  userId: string
): Promise<void> {
  await fetchWithError<{ status: string }>(
    `${API_BASE}/api/explorations/${explorationId}/cells/${cellId}`,
    { method: 'DELETE', userId }
  )
}

export async function reorderCells(
  explorationId: string,
  userId: string,
  data: ReorderCellsRequest
): Promise<{ status: string }> {
  return fetchWithError<{ status: string }>(
    `${API_BASE}/api/explorations/${explorationId}/cells/reorder`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
      userId,
    }
  )
}

export async function executeCell(
  explorationId: string,
  cellId: string,
  userId: string
): Promise<CellOutput> {
  return fetchWithError<CellOutput>(
    `${API_BASE}/api/explorations/${explorationId}/cells/${cellId}/execute`,
    { method: 'POST', userId }
  )
}

// Sharing
export async function shareExploration(
  id: string,
  userId: string,
  data: ShareExplorationRequest
): Promise<ExplorationShare> {
  return fetchWithError<ExplorationShare>(
    `${API_BASE}/api/explorations/${id}/shares`,
    {
      method: 'POST',
      body: JSON.stringify(data),
      userId,
    }
  )
}

export async function fetchSharedExploration(token: string): Promise<Exploration> {
  return fetchWithError<Exploration>(
    `${API_BASE}/api/explorations/shared/${token}`
  )
}

// Export
export async function exportExploration(
  id: string,
  userId: string,
  format: 'json' | 'html'
): Promise<Blob> {
  const response = await fetch(
    `${API_BASE}/api/explorations/${id}/export?format=${format}`,
    {
      headers: {
        'X-User-ID': userId,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to export exploration')
  }

  return response.blob()
}

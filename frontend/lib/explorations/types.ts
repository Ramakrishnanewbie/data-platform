export interface Exploration {
  id: string
  user_id: string
  project_id: string | null
  name: string
  description: string | null
  tags: string[]
  is_public: boolean
  created_at: string
  updated_at: string
  last_accessed_at: string
  cell_count: number
  cells?: ExplorationCell[]
}

export interface ExplorationCell {
  id: string
  exploration_id: string
  cell_type: 'sql' | 'markdown' | 'visualization'
  order_index: number
  content: CellContent
  output: CellOutput | null
  executed_at: string | null
  execution_time_ms: number | null
  is_collapsed: boolean
  created_at: string
  updated_at: string
}

export interface SQLCellContent {
  query: string
}

export interface MarkdownCellContent {
  text: string
}

export interface VisualizationCellContent {
  source_cell_id: string
  chart_type: 'line' | 'bar' | 'pie' | 'scatter' | 'area'
  config: {
    x_axis?: string
    y_axis?: string | string[]
    title?: string
    colors?: string[]
  }
}

export type CellContent = SQLCellContent | MarkdownCellContent | VisualizationCellContent

export interface CellOutput {
  schema?: Array<{ name: string; type: string }>
  rows?: Record<string, unknown>[]
  total_rows?: number
  execution_time_ms?: number
  executed_at?: string
  cached?: boolean
  error?: string
}

export interface ExplorationShare {
  id: string
  exploration_id: string
  shared_by_user_id: string
  shared_with_user_id: string | null
  shared_with_email: string | null
  permission_level: 'view' | 'edit' | 'admin'
  share_token: string | null
  expires_at: string | null
  created_at: string
}

export interface ExplorationsListResponse {
  items: Exploration[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// Alias for backward compatibility
export interface ExplorationsListResponseLegacy {
  explorations: Exploration[]
  total: number
  page: number
  limit: number
}

export interface CreateExplorationRequest {
  name: string
  description?: string
  tags?: string[]
  is_public?: boolean
}

export interface UpdateExplorationRequest {
  name?: string
  description?: string
  tags?: string[]
  is_public?: boolean
}

export interface CreateCellRequest {
  cell_type: 'sql' | 'markdown' | 'visualization'
  content: CellContent
  order_index?: number
}

export interface UpdateCellRequest {
  content?: CellContent
  is_collapsed?: boolean
}

export interface ReorderCellsRequest {
  cells: Array<{ id: string; order_index: number }>
}

export interface ShareExplorationRequest {
  shared_with_email?: string
  permission_level: 'view' | 'edit' | 'admin'
  generate_link?: boolean
  expires_in_days?: number
}

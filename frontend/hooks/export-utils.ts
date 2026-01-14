import { toPng, toSvg } from 'html-to-image'
import { Node, Edge } from 'reactflow'

export interface ExportOptions {
  fileName?: string
  backgroundColor?: string
  imageWidth?: number
  imageHeight?: number
}

/**
 * Export React Flow graph as PNG
 */
export async function exportAsPng(
  elementId: string = '.react-flow',
  options: ExportOptions = {}
): Promise<void> {
  const {
    fileName = 'lineage-graph.png',
    backgroundColor = '#ffffff',
    imageWidth = 1920,
    imageHeight = 1080,
  } = options

  const element = document.querySelector(elementId) as HTMLElement
  
  if (!element) {
    throw new Error('React Flow element not found')
  }

  try {
    const dataUrl = await toPng(element, {
      backgroundColor,
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
      },
    })

    const link = document.createElement('a')
    link.download = fileName
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Error exporting PNG:', error)
    throw error
  }
}

/**
 * Export React Flow graph as SVG
 */
export async function exportAsSvg(
  elementId: string = '.react-flow',
  options: ExportOptions = {}
): Promise<void> {
  const {
    fileName = 'lineage-graph.svg',
    backgroundColor = '#ffffff',
  } = options

  const element = document.querySelector(elementId) as HTMLElement
  
  if (!element) {
    throw new Error('React Flow element not found')
  }

  try {
    const dataUrl = await toSvg(element, {
      backgroundColor,
    })

    const link = document.createElement('a')
    link.download = fileName
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Error exporting SVG:', error)
    throw error
  }
}

/**
 * Export lineage data as JSON
 */
export function exportAsJson(
  nodes: Node[],
  edges: Edge[],
  fileName: string = 'lineage-data.json'
): void {
  const data = {
    nodes: nodes.map(n => ({
      id: n.id,
      label: n.data.label,
      type: n.data.type,
      projectId: n.data.projectId,
      datasetId: n.data.datasetId,
      tableName: n.data.tableName,
    })),
    edges: edges.map(e => ({
      source: e.source,
      target: e.target,
      type: e.type,
    })),
    exportedAt: new Date().toISOString(),
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = fileName
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Export lineage as Mermaid diagram syntax
 */
export function exportAsMermaid(
  nodes: Node[],
  edges: Edge[],
  fileName: string = 'lineage-diagram.md'
): void {
  // Create Mermaid syntax
  let mermaidCode = 'graph LR\n'
  
  // Add nodes with labels
  nodes.forEach(node => {
    const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_')
    const label = node.data.label
    const shape = getNodeShape(node.data.type)
    mermaidCode += `  ${nodeId}${shape[0]}${label}${shape[1]}\n`
  })
  
  mermaidCode += '\n'
  
  // Add edges
  edges.forEach(edge => {
    const sourceId = edge.source.replace(/[^a-zA-Z0-9]/g, '_')
    const targetId = edge.target.replace(/[^a-zA-Z0-9]/g, '_')
    mermaidCode += `  ${sourceId} --> ${targetId}\n`
  })
  
  // Add styling
  mermaidCode += '\n  classDef table fill:#93c5fd,stroke:#3b82f6,stroke-width:2px\n'
  mermaidCode += '  classDef view fill:#d8b4fe,stroke:#a855f7,stroke-width:2px\n'
  mermaidCode += '  classDef materializedView fill:#86efac,stroke:#22c55e,stroke-width:2px\n'

  const content = `# Data Lineage Diagram

\`\`\`mermaid
${mermaidCode}
\`\`\`

Generated on: ${new Date().toLocaleString()}
`

  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = fileName
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

function getNodeShape(type: string): [string, string] {
  switch (type) {
    case 'view':
      return ['[', ']']  // Rectangle
    case 'materialized_view':
      return ['[(', ')]']  // Cylinder
    default:
      return ['(', ')']  // Rounded rectangle
  }
}

/**
 * Copy lineage to clipboard as text
 */
export async function copyLineageAsText(nodes: Node[], edges: Edge[]): Promise<void> {
  let text = 'DATA LINEAGE\n\n'
  
  text += `Total Tables: ${nodes.length}\n`
  text += `Total Connections: ${edges.length}\n\n`
  
  text += 'TABLES:\n'
  nodes.forEach(node => {
    text += `- ${node.data.label} (${node.data.datasetId}) [${node.data.type}]\n`
  })
  
  text += '\nCONNECTIONS:\n'
  edges.forEach(edge => {
    const sourceName = nodes.find(n => n.id === edge.source)?.data.label || edge.source
    const targetName = nodes.find(n => n.id === edge.target)?.data.label || edge.target
    text += `- ${sourceName} → ${targetName}\n`
  })
  
  await navigator.clipboard.writeText(text)
}
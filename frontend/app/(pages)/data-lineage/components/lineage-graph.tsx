"use client"

import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Table2, Eye, Database } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface LineageNode {
  id: string
  label: string
  type: string
  projectId: string
  datasetId: string
  tableName: string
  level: number
}

interface LineageEdge {
  source: string
  target: string
  type: string
}

interface LineageGraphProps {
  nodes: LineageNode[]
  edges: LineageEdge[]
  rootNodeId: string
}

// Custom node component
function CustomNode({ data }: { data: any }) {
  const getIcon = () => {
    switch (data.type) {
      case 'view':
        return <Eye className="h-4 w-4 text-purple-500" />
      case 'materialized_view':
        return <Database className="h-4 w-4 text-green-500" />
      default:
        return <Table2 className="h-4 w-4 text-blue-500" />
    }
  }

  const isRoot = data.isRoot
  
  return (
    <Card className={`px-4 py-3 min-w-[200px] ${isRoot ? 'border-2 border-primary shadow-lg' : 'shadow-md'}`}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="font-semibold text-sm">{data.label}</span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="truncate">{data.datasetId}</div>
          <Badge variant={isRoot ? "default" : "secondary"} className="text-xs">
            {data.type}
          </Badge>
        </div>
      </div>
    </Card>
  )
}

const nodeTypes = {
  custom: CustomNode,
}

export default function LineageGraph({ nodes, edges, rootNodeId }: LineageGraphProps) {
  // Convert lineage data to React Flow format
  const { flowNodes, flowEdges } = useMemo(() => {
    // Use Dagre or manual layout algorithm
    const layoutNodes = layoutGraph(nodes, edges, rootNodeId)
    
    const flowNodes: Node[] = layoutNodes.map((node) => ({
      id: node.id,
      type: 'custom',
      position: node.position,
      data: {
        label: node.label,
        type: node.type,
        projectId: node.projectId,
        datasetId: node.datasetId,
        tableName: node.tableName,
        isRoot: node.id === rootNodeId,
      },
    }))

    const flowEdges: Edge[] = edges.map((edge, index) => ({
      id: `e${index}-${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      style: {
        strokeWidth: 2,
      },
    }))

    return { flowNodes, flowEdges }
  }, [nodes, edges, rootNodeId])

  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.isRoot) return '#3b82f6'
            switch (node.data.type) {
              case 'view':
                return '#a855f7'
              case 'materialized_view':
                return '#22c55e'
              default:
                return '#64748b'
            }
          }}
          maskColor="rgb(240, 240, 240, 0.8)"
        />
      </ReactFlow>
    </div>
  )
}

// Simple layout algorithm - you can replace with Dagre for better layouts
function layoutGraph(
  nodes: LineageNode[],
  edges: LineageEdge[],
  rootNodeId: string
): Array<LineageNode & { position: { x: number; y: number } }> {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const positioned: Array<LineageNode & { position: { x: number; y: number } }> = []
  
  // Build adjacency lists
  const upstreamMap = new Map<string, string[]>()
  const downstreamMap = new Map<string, string[]>()
  
  edges.forEach((edge) => {
    if (!upstreamMap.has(edge.target)) upstreamMap.set(edge.target, [])
    upstreamMap.get(edge.target)!.push(edge.source)
    
    if (!downstreamMap.has(edge.source)) downstreamMap.set(edge.source, [])
    downstreamMap.get(edge.source)!.push(edge.target)
  })
  
  // BFS layout from root
  const visited = new Set<string>()
  const levelMap = new Map<number, string[]>()
  
  const queue: Array<{ id: string; level: number }> = [{ id: rootNodeId, level: 0 }]
  visited.add(rootNodeId)
  
  while (queue.length > 0) {
    const { id, level } = queue.shift()!
    
    if (!levelMap.has(level)) levelMap.set(level, [])
    levelMap.get(level)!.push(id)
    
    // Add upstream (left side)
    const upstream = upstreamMap.get(id) || []
    upstream.forEach((upId) => {
      if (!visited.has(upId)) {
        visited.add(upId)
        queue.push({ id: upId, level: level - 1 })
      }
    })
    
    // Add downstream (right side)
    const downstream = downstreamMap.get(id) || []
    downstream.forEach((downId) => {
      if (!visited.has(downId)) {
        visited.add(downId)
        queue.push({ id: downId, level: level + 1 })
      }
    })
  }
  
  // Position nodes
  const nodeWidth = 250
  const nodeHeight = 100
  const horizontalGap = 150
  const verticalGap = 50
  
  levelMap.forEach((nodeIds, level) => {
    nodeIds.forEach((nodeId, index) => {
      const node = nodeMap.get(nodeId)
      if (node) {
        const x = level * (nodeWidth + horizontalGap)
        const y = index * (nodeHeight + verticalGap) - (nodeIds.length * (nodeHeight + verticalGap)) / 2
        
        positioned.push({
          ...node,
          position: { x, y },
        })
      }
    })
  })
  
  return positioned
}
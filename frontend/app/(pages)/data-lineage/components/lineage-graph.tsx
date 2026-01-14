"use client"

import { useMemo, memo, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  Handle,
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
  onNodeClick?: (projectId: string, datasetId: string, tableName: string) => void
  onEdgeClick?: (sourceTable: string, targetTable: string) => void
}

const CustomNode = memo(({ data }: { data: any }) => {
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
    <>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      
      <Card 
        className={`px-3 py-2 min-w-[180px] cursor-pointer hover:shadow-lg transition-shadow ${
          isRoot ? 'border-2 border-primary shadow-md' : 'shadow-sm'
        }`}
        onClick={() => data.onClick?.(data.projectId, data.datasetId, data.tableName)}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="font-semibold text-xs truncate">{data.label}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            <div className="truncate">{data.datasetId}</div>
          </div>
        </div>
      </Card>
    </>
  )
})

CustomNode.displayName = 'CustomNode'

const nodeTypes = {
  custom: CustomNode,
}

function layoutGraph(
  nodes: LineageNode[],
  edges: LineageEdge[],
  rootNodeId: string
): Array<LineageNode & { position: { x: number; y: number } }> {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const positioned: Array<LineageNode & { position: { x: number; y: number } }> = []
  
  const upstreamMap = new Map<string, string[]>()
  const downstreamMap = new Map<string, string[]>()
  
  edges.forEach((edge) => {
    if (!upstreamMap.has(edge.target)) upstreamMap.set(edge.target, [])
    upstreamMap.get(edge.target)!.push(edge.source)
    
    if (!downstreamMap.has(edge.source)) downstreamMap.set(edge.source, [])
    downstreamMap.get(edge.source)!.push(edge.target)
  })
  
  const visited = new Set<string>()
  const levelMap = new Map<number, string[]>()
  
  const queue: Array<{ id: string; level: number }> = [{ id: rootNodeId, level: 0 }]
  visited.add(rootNodeId)
  
  while (queue.length > 0) {
    const { id, level } = queue.shift()!
    
    if (!levelMap.has(level)) levelMap.set(level, [])
    levelMap.get(level)!.push(id)
    
    const upstream = upstreamMap.get(id) || []
    upstream.forEach((upId) => {
      if (!visited.has(upId)) {
        visited.add(upId)
        queue.push({ id: upId, level: level - 1 })
      }
    })
    
    const downstream = downstreamMap.get(id) || []
    downstream.forEach((downId) => {
      if (!visited.has(downId)) {
        visited.add(downId)
        queue.push({ id: downId, level: level + 1 })
      }
    })
  }
  
  const nodeWidth = 200
  const nodeHeight = 80
  const horizontalGap = 180
  const verticalGap = 60
  
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

function LineageGraphInner({ nodes, edges, rootNodeId, onNodeClick, onEdgeClick }: LineageGraphProps) {
  const { fitView } = useReactFlow()

  const { flowNodes, flowEdges } = useMemo(() => {
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
        onClick: onNodeClick,
      },
    }))

    const flowEdges: Edge[] = edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      type: 'default',  // ✅ Changed from 'smoothstep' - gives smooth curves!
      animated: true,
      style: {
        strokeWidth: 2.5,
        stroke: '#3b82f6',
        cursor: 'pointer',  // Show it's clickable
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: '#3b82f6',
      },
      // Store source/target for click handler
      data: {
        sourceTable: edge.source,
        targetTable: edge.target,
      },
    }))

    return { flowNodes, flowEdges }
  }, [nodes, edges, rootNodeId, onNodeClick])

  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  useEffect(() => {
    setTimeout(() => {
      fitView({ padding: 0.3, duration: 400 })
    }, 50)
  }, [flowNodes, flowEdges, fitView])

  // Handle edge clicks
  const handleEdgeClick = (event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation()
    if (onEdgeClick && edge.data) {
      onEdgeClick(edge.data.sourceTable, edge.data.targetTable)
    }
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeClick={handleEdgeClick}  // ✅ Edge click handler
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 1.2,
        }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background gap={20} size={2} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.isRoot) return '#3b82f6'
            switch (node.data.type) {
              case 'view': return '#a855f7'
              case 'materialized_view': return '#22c55e'
              default: return '#64748b'
            }
          }}
          maskColor="rgb(240, 240, 240, 0.6)"
        />
      </ReactFlow>
    </div>
  )
}

export default function LineageGraph(props: LineageGraphProps) {
  return (
    <ReactFlowProvider>
      <LineageGraphInner {...props} />
    </ReactFlowProvider>
  )
}
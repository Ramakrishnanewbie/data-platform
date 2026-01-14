"use client"

import { useState } from 'react'
import { Download, FileImage, FileCode, FileJson, FileText, Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Node, Edge } from 'reactflow'
import { exportAsPng, exportAsSvg, exportAsJson, exportAsMermaid, copyLineageAsText } from '@/hooks/export-utils'

interface ExportMenuProps {
  nodes: Node[]
  edges: Edge[]
  selectedAsset?: {
    projectId: string
    datasetId: string
    assetName: string
  }
}

export default function ExportMenu({ nodes, edges, selectedAsset }: ExportMenuProps) {
  const [exporting, setExporting] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  const showNotification = (message: string) => {
    setNotification(message)
    setTimeout(() => setNotification(null), 3000)
  }

  const handleExportPng = async () => {
    try {
      setExporting(true)
      const fileName = selectedAsset 
        ? `${selectedAsset.datasetId}_${selectedAsset.assetName}_lineage.png`
        : 'lineage-graph.png'
      
      await exportAsPng('.react-flow', { fileName })
      showNotification('✅ Exported as PNG!')
    } catch (error) {
      showNotification('❌ Export failed')
      console.error(error)
    } finally {
      setExporting(false)
    }
  }

  const handleExportSvg = async () => {
    try {
      setExporting(true)
      const fileName = selectedAsset 
        ? `${selectedAsset.datasetId}_${selectedAsset.assetName}_lineage.svg`
        : 'lineage-graph.svg'
      
      await exportAsSvg('.react-flow', { fileName })
      showNotification('✅ Exported as SVG!')
    } catch (error) {
      showNotification('❌ Export failed')
      console.error(error)
    } finally {
      setExporting(false)
    }
  }

  const handleExportJson = () => {
    try {
      const fileName = selectedAsset 
        ? `${selectedAsset.datasetId}_${selectedAsset.assetName}_lineage.json`
        : 'lineage-data.json'
      
      exportAsJson(nodes, edges, fileName)
      showNotification('✅ Exported as JSON!')
    } catch (error) {
      showNotification('❌ Export failed')
      console.error(error)
    }
  }

  const handleExportMermaid = () => {
    try {
      const fileName = selectedAsset 
        ? `${selectedAsset.datasetId}_${selectedAsset.assetName}_lineage.md`
        : 'lineage-diagram.md'
      
      exportAsMermaid(nodes, edges, fileName)
      showNotification('✅ Exported as Mermaid!')
    } catch (error) {
      showNotification('❌ Export failed')
      console.error(error)
    }
  }

  const handleCopyText = async () => {
    try {
      await copyLineageAsText(nodes, edges)
      showNotification('✅ Copied to clipboard!')
    } catch (error) {
      showNotification('❌ Copy failed')
      console.error(error)
    }
  }

  return (
    <>
      {notification && (
        <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top duration-200">
          <div className="bg-background border rounded-lg shadow-lg p-3">
            <p className="text-sm font-medium">{notification}</p>
          </div>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={exporting || nodes.length === 0}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Graph
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Export As</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleExportPng}>
            <FileImage className="h-4 w-4 mr-2" />
            PNG Image
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleExportSvg}>
            <FileCode className="h-4 w-4 mr-2" />
            SVG Vector
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleExportJson}>
            <FileJson className="h-4 w-4 mr-2" />
            JSON Data
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleExportMermaid}>
            <FileText className="h-4 w-4 mr-2" />
            Mermaid Diagram
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleCopyText}>
            <Copy className="h-4 w-4 mr-2" />
            Copy as Text
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
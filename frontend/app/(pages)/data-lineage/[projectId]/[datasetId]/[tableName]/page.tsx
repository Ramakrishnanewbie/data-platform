"use client"

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ContentLayout } from '@/components/admin-panel/content-layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Database,
  Target,
  AlertCircle,
  GitBranch,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MetadataPanel = dynamic(() => import('@/app/(pages)/data-lineage/components/metadata-panel'), {
  loading: () => <div className="p-8 text-center text-muted-foreground">Loading metadata...</div>,
  ssr: false,
})

const ImpactAnalysis = dynamic(() => import('@/app/(pages)/data-lineage/components/impact-analysis'), {
  loading: () => <div className="p-8 text-center text-muted-foreground">Loading impact analysis...</div>,
  ssr: false,
})

const RootCauseAnalysis = dynamic(() => import('@/app/(pages)/data-lineage/components/RootCauseAnalysis'), {
  loading: () => <div className="p-8 text-center text-muted-foreground">Loading root cause analysis...</div>,
  ssr: false,
})

export default function AssetDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string
  const datasetId = params.datasetId as string
  const tableName = params.tableName as string

  const [activeTab, setActiveTab] = useState('overview')

  return (
    <ContentLayout title="Asset Details">
      <div className="h-[calc(100vh-120px)] flex flex-col animate-in fade-in duration-300">
        {/* Header with breadcrumb */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/data-lineage')}
              className="hover-lift"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Graph
            </Button>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <Database className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">{tableName}</h2>
                <code className="text-xs text-muted-foreground">
                  {projectId}.{datasetId}
                </code>
              </div>
            </div>
          </div>

          <Badge variant="secondary" className="text-xs">TABLE</Badge>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger
              value="overview"
              className={cn(
                "rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent",
                "hover-lift px-6 py-3"
              )}
            >
              <Info className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="impact"
              className={cn(
                "rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent",
                "hover-lift px-6 py-3"
              )}
            >
              <Target className="h-4 w-4 mr-2" />
              Impact Analysis
            </TabsTrigger>
            <TabsTrigger
              value="root-cause"
              className={cn(
                "rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent",
                "hover-lift px-6 py-3"
              )}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Root Cause
            </TabsTrigger>
            <TabsTrigger
              value="dependencies"
              className={cn(
                "rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent",
                "hover-lift px-6 py-3"
              )}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Dependencies
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="overview" className="h-full m-0">
              <div className="h-full rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm elevation-sm overflow-hidden">
                <MetadataPanel
                  projectId={projectId}
                  datasetId={datasetId}
                  tableId={tableName}
                  onClose={() => router.push('/data-lineage')}
                />
              </div>
            </TabsContent>

            <TabsContent value="impact" className="h-full m-0">
              <div className="h-full rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm elevation-sm overflow-hidden p-4">
                <ImpactAnalysis
                  nodes={[]} // You'll need to fetch lineage data or pass it via context
                  edges={[]}
                  selectedNode={{ projectId, datasetId, tableName }}
                  onClose={() => router.push('/data-lineage')}
                />
              </div>
            </TabsContent>

            <TabsContent value="root-cause" className="h-full m-0">
              <div className="h-full rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm elevation-sm overflow-hidden p-4">
                <RootCauseAnalysis
                  projectId={projectId}
                  datasetId={datasetId}
                  tableName={tableName}
                  onClose={() => router.push('/data-lineage')}
                  onHighlightPath={(nodeIds) => console.log('Highlight path:', nodeIds)}
                />
              </div>
            </TabsContent>

            <TabsContent value="dependencies" className="h-full m-0">
              <div className="h-full rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm elevation-sm overflow-hidden p-8">
                <div className="text-center">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Dependencies View</h3>
                  <p className="text-sm text-muted-foreground">
                    View direct upstream and downstream dependencies for this asset
                  </p>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </ContentLayout>
  )
}

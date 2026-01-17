"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { CellToolbar } from "./cell-toolbar"
import type {
  ExplorationCell,
  VisualizationCellContent,
  CellOutput,
} from "@/lib/explorations/types"

interface VisualizationCellProps {
  cell: ExplorationCell
  availableSources: Array<{ id: string; name: string; output: CellOutput | null }>
  onContentChange: (content: VisualizationCellContent) => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleCollapse: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

const PIE_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
]

export function VisualizationCell({
  cell,
  availableSources,
  onContentChange,
  onDelete,
  onDuplicate,
  onToggleCollapse,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  dragHandleProps,
}: VisualizationCellProps) {
  const content = cell.content as VisualizationCellContent
  const [sourceCellId, setSourceCellId] = useState(content.source_cell_id || "")
  const [chartType, setChartType] = useState<
    "line" | "bar" | "pie" | "scatter" | "area"
  >(content.chart_type || "bar")
  const [xAxis, setXAxis] = useState(content.config?.x_axis || "")
  const [yAxis, setYAxis] = useState<string | string[]>(
    content.config?.y_axis || ""
  )

  // Get the selected source cell's data
  const sourceCell = availableSources.find((s) => s.id === sourceCellId)
  const sourceOutput = sourceCell?.output

  // Get available columns from source data
  const availableColumns = useMemo(() => {
    if (!sourceOutput?.schema) return []
    return sourceOutput.schema.map((col) => ({
      name: col.name,
      type: col.type,
    }))
  }, [sourceOutput])

  // Update content when config changes
  useEffect(() => {
    onContentChange({
      source_cell_id: sourceCellId,
      chart_type: chartType,
      config: {
        x_axis: xAxis,
        y_axis: yAxis,
        title: content.config?.title,
      },
    })
  }, [sourceCellId, chartType, xAxis, yAxis])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!sourceOutput?.rows || !xAxis) return []
    return sourceOutput.rows.map((row) => ({
      ...row,
      [xAxis]: row[xAxis],
    }))
  }, [sourceOutput, xAxis])

  // Render the appropriate chart
  const renderChart = () => {
    if (!chartData.length || !xAxis || !yAxis) {
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Configure the chart to see visualization
        </div>
      )
    }

    const yAxisArray = Array.isArray(yAxis) ? yAxis : [yAxis]

    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey={xAxis}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              {yAxisArray.map((y, i) => (
                <Line
                  key={y}
                  type="monotone"
                  dataKey={y}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS[i % CHART_COLORS.length] }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey={xAxis}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              {yAxisArray.map((y, i) => (
                <Bar
                  key={y}
                  dataKey={y}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey={xAxis}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              {yAxisArray.map((y, i) => (
                <Area
                  key={y}
                  type="monotone"
                  dataKey={y}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      case "pie":
        const pieY = Array.isArray(yAxis) ? yAxis[0] : yAxis
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={pieY}
                nameKey={xAxis}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      case "scatter":
        const scatterY = Array.isArray(yAxis) ? yAxis[0] : yAxis
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey={xAxis}
                name={xAxis}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                dataKey={scatterY}
                name={scatterY}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Scatter data={chartData} fill={CHART_COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card className="border-border/50">
      <CellToolbar
        cellType="visualization"
        isCollapsed={cell.is_collapsed}
        onToggleCollapse={onToggleCollapse}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        dragHandleProps={dragHandleProps}
      />

      {!cell.is_collapsed && (
        <CardContent className="p-4 space-y-4">
          {/* Configuration */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Data Source</Label>
              <Select value={sourceCellId} onValueChange={setSourceCellId}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select cell" />
                </SelectTrigger>
                <SelectContent>
                  {availableSources
                    .filter((s) => s.output?.schema && !s.output?.error)
                    .map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Chart Type</Label>
              <Select
                value={chartType}
                onValueChange={(v) =>
                  setChartType(v as "line" | "bar" | "pie" | "scatter" | "area")
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">X-Axis / Category</Label>
              <Select value={xAxis} onValueChange={setXAxis}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Y-Axis / Value</Label>
              <Select
                value={Array.isArray(yAxis) ? yAxis[0] : yAxis}
                onValueChange={setYAxis}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns
                    .filter(
                      (col) =>
                        col.type === "INTEGER" ||
                        col.type === "FLOAT" ||
                        col.type === "NUMERIC" ||
                        col.type === "INT64" ||
                        col.type === "FLOAT64"
                    )
                    .map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chart */}
          <div className="border rounded-lg p-4 bg-background">
            {renderChart()}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

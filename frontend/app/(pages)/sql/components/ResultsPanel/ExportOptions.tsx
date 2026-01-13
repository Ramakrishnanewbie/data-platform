
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';

interface ExportOptionsProps {
  data: any[];
  schema: Array<{ name: string; type: string }>;
  filename?: string;
}

export function ExportOptions({ data, schema, filename = 'query-results' }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = schema.map((col) => col.name).join(',');
      const rows = data.map((row) => 
        Object.values(row).map(v => {
          // Escape quotes and wrap in quotes
          const str = v === null ? '' : String(v);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
      );
      
      const csv = [headers, ...rows].join('\n');
      downloadFile(csv, `${filename}.csv`, 'text/csv');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    try {
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, `${filename}.json`, 'application/json');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToTSV = () => {
    setIsExporting(true);
    try {
      const headers = schema.map((col) => col.name).join('\t');
      const rows = data.map((row) => 
        Object.values(row).map(v => v === null ? '' : String(v)).join('\t')
      );
      
      const tsv = [headers, ...rows].join('\n');
      downloadFile(tsv, `${filename}.tsv`, 'text/tab-separated-values');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      // Create HTML table for Excel
      const headers = schema.map(col => `<th>${col.name}</th>`).join('');
      const rows = data.map(row => {
        const cells = Object.values(row).map(v => 
          `<td>${v === null ? '' : String(v)}</td>`
        ).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      
      const html = `
        <html xmlns:x="urn:schemas-microsoft-com:office:excel">
          <head>
            <meta charset="UTF-8">
            <style>
              table { border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; }
              th { background-color: #4CAF50; color: white; }
            </style>
          </head>
          <body>
            <table>
              <thead><tr>${headers}</tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>
      `;
      
      downloadFile(html, `${filename}.xls`, 'application/vnd.ms-excel');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isExporting}
          className="h-7 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          <span className="text-xs">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-700">
        <DropdownMenuItem
          onClick={exportToCSV}
          className="cursor-pointer text-slate-300 hover:text-slate-100 hover:bg-slate-800"
        >
          <FileText className="h-4 w-4 mr-2 text-green-400" />
          Export as CSV
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={exportToTSV}
          className="cursor-pointer text-slate-300 hover:text-slate-100 hover:bg-slate-800"
        >
          <FileText className="h-4 w-4 mr-2 text-blue-400" />
          Export as TSV
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={exportToJSON}
          className="cursor-pointer text-slate-300 hover:text-slate-100 hover:bg-slate-800"
        >
          <FileJson className="h-4 w-4 mr-2 text-yellow-400" />
          Export as JSON
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-slate-700" />
        
        <DropdownMenuItem
          onClick={exportToExcel}
          className="cursor-pointer text-slate-300 hover:text-slate-100 hover:bg-slate-800"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";
import { Button } from '@/components/ui/button';
import { Code } from 'lucide-react';
import { format } from 'sql-formatter';

interface SQLFormatterProps {
  sql: string;
  onFormat: (formatted: string) => void;
}

export const SQLFormatter = ({ sql, onFormat }: SQLFormatterProps) => {
  const handleFormat = () => {
    try {
      const formatted = format(sql, {
        language: 'bigquery',
        tabWidth: 2,
        keywordCase: 'upper',
      });
      onFormat(formatted);
    } catch (err) {
      console.error('Format error:', err);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleFormat} className="gap-1.5 h-8">
      <Code className="h-3.5 w-3.5" />
      <span className="text-sm">Format</span>
    </Button>
  );
};
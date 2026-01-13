// app/(pages)/sql/components/AIAssistant/QueryExplanation.tsx
"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Info, Loader2, X } from 'lucide-react';
import { useAIQueryAssistant } from '../hooks/useAIQueryAssistant';

interface QueryExplanationProps {
  sql: string;
}

export const QueryExplanation = ({ sql }: QueryExplanationProps) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState('');
  const { loading, explainQuery } = useAIQueryAssistant();

  const handleExplain = async () => {
    if (!sql.trim()) return;

    try {
      const result = await explainQuery(sql);
      setExplanation(result);
      setShowExplanation(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleExplain}
        disabled={loading || !sql.trim()}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Info className="h-3 w-3" />
        )}
        Explain Query
      </Button>

      {showExplanation && (
        <Card className="absolute top-16 right-4 w-96 p-4 bg-slate-900 border-slate-700 z-50">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">Query Explanation</h3>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowExplanation(false)}
              className="h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{explanation}</p>
        </Card>
      )}
    </>
  );
};
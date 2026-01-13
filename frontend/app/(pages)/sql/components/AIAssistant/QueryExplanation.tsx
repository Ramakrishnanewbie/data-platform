
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
        className="gap-1.5 h-8"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Info className="h-3.5 w-3.5" />
        )}
        <span className="text-sm">Explain</span>
      </Button>

      {showExplanation && (
        <Card className="absolute top-14 right-4 w-96 p-4 bg-slate-900 border-slate-700 z-50 shadow-xl">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">Query Explanation</h3>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowExplanation(false)}
              className="h-6 w-6 -mt-1 -mr-1"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{explanation}</p>
        </Card>
      )}
    </>
  );
};
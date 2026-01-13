// AIQueryInput.tsx - POLISHED
"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAIQueryAssistant } from '../hooks/useAIQueryAssistant';

interface AIQueryInputProps {
  onQueryGenerated: (sql: string) => void;
  schema: string;
}

export const AIQueryInput = ({ onQueryGenerated, schema }: AIQueryInputProps) => {
  const [prompt, setPrompt] = useState('');
  const { loading, generateSQLFromNaturalLanguage } = useAIQueryAssistant();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    try {
      const sql = await generateSQLFromNaturalLanguage(prompt, schema);
      onQueryGenerated(sql);
      setPrompt('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex gap-2.5 items-center p-2.5 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg">
      <Sparkles className="h-4 w-4 text-purple-400 flex-shrink-0" />
      <Input
        placeholder="Ask me anything... e.g., 'Show top 10 customers by revenue'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        className="flex-1 h-8 text-sm bg-slate-900/50 border-slate-700"
        disabled={loading}
      />
      <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} size="sm" className="h-8">
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            <span className="text-sm">Generating...</span>
          </>
        ) : (
          <span className="text-sm">Generate</span>
        )}
      </Button>
    </div>
  );
};

'use client';

import Editor from '@monaco-editor/react';

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  loading?: boolean;
}

export function SQLEditor({ value, onChange, onExecute, loading }: SQLEditorProps) {
  return (
    <Editor
      height="100%"
      defaultLanguage="sql"
      value={value}
      onChange={(value) => onChange(value || '')}
      theme="vs-dark"
      options={{
        // Font settings
        fontSize: 13,                    // Reduced from default 14
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        lineHeight: 20,                  // Tighter line spacing
        
        // Clean rendering - removes the "layers"
        renderLineHighlight: 'none',     // Removes current line background
        selectionHighlight: false,       // Removes selection layer
        // occurrencesHighlight: false,     // Removes matching word highlights
        renderWhitespace: 'none',        // Cleaner look
        
        // Other improvements
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        lineNumbers: 'on',
        
        // Smoother scrolling
        smoothScrolling: true,
        cursorSmoothCaretAnimation: 'on',
        
        // Padding for breathing room
        padding: { top: 16, bottom: 16 },
        
        // Disable annoying features
        hover: { enabled: true, delay: 300 },
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
      }}
    />
  );
}
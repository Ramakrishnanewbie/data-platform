'use client';
import { useState } from 'react';
import Editor from '@monaco-editor/react';

export default function SQLPage() {
  const [sql, setSql] = useState('SELECT * FROM dataset.table LIMIT 10');

  return (
    <div className="h-screen">
      <Editor
        height="100%"  // ← 100% of container
        width="100%"
        defaultLanguage="sql"
        defaultValue={sql}
        onChange={(value) => setSql(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
        }}
      />
    </div>
  );
}
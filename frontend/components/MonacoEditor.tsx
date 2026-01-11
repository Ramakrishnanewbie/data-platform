'use client'; // if using Next.js app router
import { useState } from 'react';
import Editor from '@monaco-editor/react';

export default function SQLEditor() {
  const [sql, setSql] = useState('SELECT * FROM dataset.table LIMIT 10');

  return (
    <Editor
      height="400px"
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
  );
}
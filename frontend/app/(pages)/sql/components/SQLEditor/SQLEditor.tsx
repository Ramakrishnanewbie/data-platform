// app/(pages)/sql/components/SQLEditor/SQLEditor.tsx - REMOVE RUN BUTTON
import Editor from "@monaco-editor/react";

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  loading: boolean;
}

export const SQLEditor = ({
  value,
  onChange,
}: SQLEditorProps) => {  // Remove onExecute and loading from destructuring
  return (
    <Editor
      height="100%"
      width="100%"
      defaultLanguage="sql"
      value={value}
      onChange={(val) => onChange(val || "")}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 16, bottom: 16 },
      }}
    />
  );
};
// app/(pages)/sql/components/SQLEditor/SQLEditor.tsx - FIXED
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  loading: boolean;
}

export const SQLEditor = ({
  value,
  onChange,
  onExecute,
  loading,
}: SQLEditorProps) => {
  return (
    <div className="h-full border rounded-lg overflow-hidden relative bg-slate-950">
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

      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={onExecute}
          disabled={loading || !value.trim()}
          className="gap-2 shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Query
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
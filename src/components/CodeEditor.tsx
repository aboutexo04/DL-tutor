import React from 'react';
import { Play, RefreshCw, Code2 } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onSubmit,
  isSubmitting,
  disabled
}) => {
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newValue = code.substring(0, start) + '    ' + code.substring(end);
      onChange(newValue);

      // Use setTimeout to set selection after render
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2 text-slate-300">
          <Code2 size={16} />
          <span className="text-sm font-medium font-mono">solution.py</span>
        </div>
        <button
          onClick={onSubmit}
          disabled={disabled || isSubmitting}
          className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-all ${
            disabled
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-500 text-white shadow shadow-green-900/40'
          }`}
        >
          {isSubmitting ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> 채점 중...
            </>
          ) : (
            <>
              <Play size={14} /> 실행 및 제출
            </>
          )}
        </button>
      </div>
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          disabled={disabled}
          className="absolute inset-0 w-full h-full p-4 bg-slate-950 text-slate-300 font-mono text-sm resize-none focus:outline-none leading-6"
          style={{ tabSize: 4 }}
          placeholder="# 여기에 PyTorch 코드를 작성하세요..."
        />
      </div>
    </div>
  );
};

export default CodeEditor;
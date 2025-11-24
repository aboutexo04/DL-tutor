import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Problem, LoadingState } from '../types';
import { AlertCircle, CheckCircle2, Lightbulb, Terminal } from 'lucide-react';

interface ProblemViewProps {
  problem: Problem | null;
  loadingState: LoadingState;
  hintsRevealed: number;
  onRevealHint: () => void;
  evaluation: { feedback: string; score: number; isCorrect: boolean } | null;
}

const ProblemView: React.FC<ProblemViewProps> = ({
  problem,
  loadingState,
  hintsRevealed,
  onRevealHint,
  evaluation
}) => {
  if (loadingState === 'generating_problem') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 animate-pulse">
        <BrainCircuitIcon className="w-16 h-16 mb-4 text-slate-600" />
        <p className="text-lg">새로운 신경망 문제를 설계하는 중...</p>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
        <Terminal className="w-16 h-16 mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">코딩할 준비 되셨나요?</h3>
        <p className="text-center max-w-md">사이드바에서 주제와 난이도를 선택하여 PyTorch 코딩 인터뷰 문제를 생성하세요.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
      
      {/* Problem Header */}
      <div className="border-b border-slate-700 pb-6">
        <h1 className="text-2xl font-bold text-white mb-4">{problem.title}</h1>
        <div className="prose prose-invert prose-sm max-w-none text-slate-300">
          <ReactMarkdown>{problem.description}</ReactMarkdown>
        </div>
      </div>

      {/* Evaluation Result */}
      {evaluation && (
        <div className={`rounded-lg p-5 border ${evaluation.isCorrect ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              {evaluation.isCorrect ? <CheckCircle2 className="text-green-500" /> : <AlertCircle className="text-red-500" />}
              <h3 className={`font-bold ${evaluation.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {evaluation.isCorrect ? '테스트 통과' : '검토 필요'}
              </h3>
            </div>
            <span className="text-lg font-mono font-bold text-slate-200">점수: {evaluation.score}/100</span>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-slate-300">
            <ReactMarkdown>{evaluation.feedback}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Solution Code - shown after evaluation */}
      {evaluation && problem.solutionCode && (
        <div className="rounded-lg border border-blue-800 bg-blue-900/20">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-800">
            <CheckCircle2 size={16} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">정답 코드</h3>
          </div>
          <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-300 whitespace-pre-wrap">
            <code>{problem.solutionCode}</code>
          </pre>
        </div>
      )}

      {/* Hints Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">힌트 (HINTS)</h3>
          {hintsRevealed < problem.hints.length && (
            <button 
              onClick={onRevealHint}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              <Lightbulb size={14} /> 힌트 보기 ({problem.hints.length - hintsRevealed}개 남음)
            </button>
          )}
        </div>
        
        {problem.hints.slice(0, hintsRevealed).map((hint, idx) => (
          <div key={idx} className="bg-amber-900/20 border border-amber-900/50 p-3 rounded text-amber-200 text-sm flex gap-3 items-start animate-fade-in">
             <Lightbulb size={16} className="mt-0.5 shrink-0 opacity-70" />
             <span>{hint}</span>
          </div>
        ))}
        {hintsRevealed === 0 && (
          <div className="p-4 border border-dashed border-slate-700 rounded text-slate-500 text-sm text-center">
            막히셨나요? 힌트를 확인하여 정답을 보지 않고 도움을 받아보세요.
          </div>
        )}
      </div>
    </div>
  );
};

const BrainCircuitIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" />
    <rect x="8" y="8" width="8" height="8" rx="2" />
  </svg>
);

export default ProblemView;
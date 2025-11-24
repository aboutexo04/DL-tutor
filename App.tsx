import React, { useState, useCallback } from 'react';
import TopicSelector from './components/TopicSelector';
import ProblemView from './components/ProblemView';
import CodeEditor from './components/CodeEditor';
import { Topic, Difficulty, Problem, LoadingState } from './types';
import * as GeminiService from './services/geminiService';

const App: React.FC = () => {
  const [topic, setTopic] = useState<Topic>(Topic.BASICS);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.JUNIOR);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userCode, setUserCode] = useState<string>('');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [evaluation, setEvaluation] = useState<{ feedback: string; score: number; isCorrect: boolean } | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateProblem = async () => {
    if (!process.env.API_KEY) {
        setError("API 키가 누락되었습니다. 설정을 확인해주세요.");
        return;
    }

    setLoadingState('generating_problem');
    setError(null);
    setEvaluation(null);
    setHintsRevealed(0);
    
    try {
      const problem = await GeminiService.generateProblem(topic, difficulty);
      setCurrentProblem(problem);
      setUserCode(problem.starterCode);
    } catch (err) {
      setError("문제 생성에 실패했습니다. 다시 시도해주세요.");
      console.error(err);
    } finally {
      setLoadingState('idle');
    }
  };

  const handleSubmit = async () => {
    if (!currentProblem) return;
    
    setLoadingState('evaluating');
    setError(null);

    try {
      const result = await GeminiService.evaluateSubmission(currentProblem, userCode);
      setEvaluation(result);
    } catch (err) {
      setError("채점에 실패했습니다.");
      console.error(err);
    } finally {
      setLoadingState('idle');
    }
  };

  const handleRevealHint = useCallback(() => {
    if (currentProblem && hintsRevealed < currentProblem.hints.length) {
      setHintsRevealed(prev => prev + 1);
    }
  }, [currentProblem, hintsRevealed]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-200 font-sans">
      {/* Mobile Alert: This app is best viewed on desktop */}
      <div className="md:hidden fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-8 text-center">
         <p>최적의 코딩 경험을 위해 데스크탑이나 태블릿을 사용해주세요.</p>
      </div>

      {/* Sidebar */}
      <TopicSelector 
        selectedTopic={topic}
        selectedDifficulty={difficulty}
        onSelectTopic={setTopic}
        onSelectDifficulty={setDifficulty}
        onGenerate={handleGenerateProblem}
        disabled={loadingState !== 'idle'}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row h-full relative">
        {error && (
           <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded shadow-lg animate-bounce">
             {error}
           </div>
        )}

        {/* Left Panel: Problem Description & Feedback */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-slate-900 border-r border-slate-800">
          <ProblemView 
            problem={currentProblem}
            loadingState={loadingState}
            hintsRevealed={hintsRevealed}
            onRevealHint={handleRevealHint}
            evaluation={evaluation}
          />
        </div>

        {/* Right Panel: Code Editor */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full">
          <CodeEditor 
            code={userCode}
            onChange={setUserCode}
            onSubmit={handleSubmit}
            isSubmitting={loadingState === 'evaluating'}
            disabled={!currentProblem || loadingState === 'generating_problem'}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
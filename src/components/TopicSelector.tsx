import React from 'react';
import { Topic, Difficulty } from '../types';
import { BookOpen, BrainCircuit, Layers, GitBranch, Activity, Box } from 'lucide-react';

interface TopicSelectorProps {
  selectedTopic: Topic;
  selectedDifficulty: Difficulty;
  onSelectTopic: (topic: Topic) => void;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onGenerate: () => void;
  disabled: boolean;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedTopic,
  selectedDifficulty,
  onSelectTopic,
  onSelectDifficulty,
  onGenerate,
  disabled
}) => {
  
  const getIcon = (t: Topic) => {
    switch (t) {
      case Topic.CNN: return <Layers size={18} />;
      case Topic.RNN: return <Activity size={18} />;
      case Topic.TRANSFORMERS: return <BrainCircuit size={18} />;
      case Topic.OPTIMIZATION: return <GitBranch size={18} />;
      case Topic.GAN: return <Box size={18} />;
      default: return <BookOpen size={18} />;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-800/50 border-b border-slate-700 md:border-b-0 md:border-r md:w-80 md:h-full md:overflow-y-auto">
      <div>
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <BrainCircuit className="text-purple-400" />
          DL Tutor
        </h2>
        <p className="text-slate-400 text-sm">AI 코딩 인터뷰 완전 정복</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">주제 (Topic)</label>
        <div className="flex flex-col gap-1">
          {Object.values(Topic).map((t) => (
            <button
              key={t}
              onClick={() => onSelectTopic(t)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm transition-all duration-200 ${
                selectedTopic === t
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {getIcon(t)}
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">난이도 (Difficulty)</label>
        <div className="flex bg-slate-900 p-1 rounded-lg">
          {Object.values(Difficulty).map((d) => (
            <button
              key={d}
              onClick={() => onSelectDifficulty(d)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedDifficulty === d
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={disabled}
        className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex justify-center items-center gap-2"
      >
        {disabled ? '생성 중...' : '문제 생성하기'}
      </button>
    </div>
  );
};

export default TopicSelector;
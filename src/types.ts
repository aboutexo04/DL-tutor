export enum Topic {
  BASICS = 'PyTorch 기초',
  CNN = '합성곱 신경망 (CNN)',
  RNN = '순환 신경망 (RNN/LSTM/GRU)',
  TRANSFORMERS = '트랜스포머 & 어텐션',
  OPTIMIZATION = '최적화 & 손실 함수',
  CUSTOM_LAYERS = '커스텀 레이어 & Autograd',
  GAN = '생성적 적대 신경망 (GAN)'
}

export enum Difficulty {
  JUNIOR = '초급',
  MID = '중급',
  SENIOR = '고급'
}

export interface Problem {
  title: string;
  description: string;
  starterCode: string;
  solutionCode: string;
  hints: string[];
}

export interface Feedback {
  isCorrect: boolean;
  feedbackText: string;
  score: number; // 0-100
}

export type LoadingState = 'idle' | 'generating_problem' | 'evaluating' | 'hinting';
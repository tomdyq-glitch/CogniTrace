export enum Subject {
  ARITHMETIC = '四则运算',
  FRACTIONS = '分数与小数',
  ALGEBRA = '代数方程',
  GEOMETRY = '平面几何',
  PROBABILITY = '概率统计'
}

export interface SkillState {
  subject: Subject;
  masteryLevel: number; // 0.0 to 1.0
  confidence: number; // 0.0 to 1.0 (how certain the model is)
  history: { timestamp: number; value: number }[];
}

export interface GlobalStepLog {
  stepIndex: number;
  activeSubject: Subject;
  isCorrect: boolean;
  // Snapshot of all masteries at this point in time
  masterySnapshot: Record<Subject, number>;
}

export interface Question {
  id: string;
  subject: Subject;
  difficulty: number; // 1 to 10
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  reasoningForSelection: string; // Why was this question picked by the KT engine?
}

export interface KTModelConfig {
  learnRate: number;
  slipRate: number; // Probability of making a mistake despite knowing the skill
  guessRate: number; // Probability of guessing correctly despite not knowing
}
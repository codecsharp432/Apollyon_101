export enum AppState {
  BOOTING = 'BOOTING',
  AUTH = 'AUTH',
  MENU = 'MENU',
  GENERATING = 'GENERATING',
  ASSESSMENT = 'ASSESSMENT',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  LEADERBOARD = 'LEADERBOARD',
  ERROR = 'ERROR'
}

export enum QuestionCount {
  SHORT = 20,
  MEDIUM = 50,
  FULL = 100
}

export interface Question {
  id: number;
  text: string;
  dimension: string; // e.g., "Autonomy", "Stability"
  options: string[];
}

export interface Answer {
  questionId: number;
  questionText: string;
  selectedOption: string;
  dimension: string;
  timeTaken: number;
}

export interface PersonalityReport {
  subjectName: string;
  score: number; // 1-100
  dominantTraits: string[];
  strengths: string[];
  weaknesses: string[];
  behavioralTendencies: string[];
  riskIndicators: string[];
  confidenceScore: number; // 1-100
  generatedAt: string;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  date: string;
  id: string;
}
export enum Sender {
  User = 'user',
  Model = 'model',
  System = 'system'
}

export enum MessageType {
  Text = 'text',
  Image = 'image',
  Quiz = 'quiz',
  Error = 'error'
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string; // The text of the correct answer
  explanation: string;
}

export interface QuizData {
  title: string;
  questions: QuizQuestion[];
}

export interface Organism {
  name: string;
  scientificName: string;
  habitat: string;
  description: string;
  characteristics: string[];
  mnemonic: string;
  imagePrompt: string; // A specific prompt to generate the image
}

export interface LessonData {
  kingdom: string;
  organisms: Organism[];
}

export interface WorksheetItem {
  kingdom: string;
  name: string;
  characteristics: string;
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  type: MessageType;
  text?: string;
  imageUrl?: string;
  quizData?: QuizData;
  timestamp: number;
}

export interface LoadingState {
  isActive: boolean;
  message: string;
}
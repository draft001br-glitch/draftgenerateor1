import { AppealPointInstruction } from '../components/InputPanel';

export type HistoryActionType = 
  | 'generate' 
  | 'refine' 
  | 'senior_voice' 
  | 'ng_replace' 
  | 'format' 
  | 'manual_save';

export interface HistoryItem {
  id: string;
  createdAt: number;
  formattedDate: string;
  title: string;
  description: string;
  sources?: { uri: string; title: string }[];
  interviewLog?: string;
  sampleMessage?: string;
  appealPointRules?: AppealPointInstruction[];
  catchphraseTemperature?: number;
  manuscriptTemperature?: number;
  actionType: HistoryActionType;
  actionLabel: string;
  instructionUsed?: string;
  charCount: number;
}

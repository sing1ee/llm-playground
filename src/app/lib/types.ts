// src/lib/types.ts

export interface PlaygroundFormProps {
  setResult: (result: string) => void;
}

export interface TokenInfo {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

export interface Files {
  [key: string]: string;
}

export interface Settings {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  useSystemPrompt: boolean;
  systemPromptType: string;
}

export interface Role {
  name: string;
  systemPrompt: string;
}

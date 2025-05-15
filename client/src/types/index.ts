export interface HistoricalFigure {
  id: string;
  name: string;
  imageSrc: string;
  videoSrc?: string;
  agentKey: string;
  isActive?: boolean;
}

export interface Message {
  id: string;
  sender: 'user' | 'historical-figure';
  text: string;
  timestamp: number;
  figureId: string;
}

export interface Conversation {
  figureId: string;
  messages: Message[];
}

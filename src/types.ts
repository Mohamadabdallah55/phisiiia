export type HotspotCategory =
  | 'figure'
  | 'experiment'
  | 'example'
  | 'formula'
  | 'question'
  | 'review';

export type SimulationId =
  | 'spring-scales'
  | 'vectors-basics'
  | 'vector-products'
  | 'vector-addition'
  | 'vector-resolution'
  | 'air-track'
  | 'motion-1d'
  | 'motion-graphs'
  | 'free-fall'
  | 'projectile-angled'
  | 'projectile-horizontal'
  | 'circular-motion'
  | 'newton-first'
  | 'newton-second'
  | 'newton-third'
  | 'universal-gravity';

export interface FormulaSymbol {
  symbol: string;
  name: string;
  unit: string;
}

export interface FormulaBreakdown {
  equation: string;
  title: string;
  symbols: FormulaSymbol[];
  sampleSubstitution: string[];
}

export interface QuizItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface HotspotBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface InteractiveHotspot {
  id: string;
  page: number;
  category: HotspotCategory;
  title: string;
  box: HotspotBox;
  simpleExplanation: string;
  teachingTip: string;
  formula?: FormulaBreakdown;
  steps?: string[];
  finalAnswer?: string;
  simulation?: SimulationId;
  quiz?: QuizItem[];
}


export interface DesignSystem {
  colors: string[];
  fonts: string[];
  sections: string[];
  variables: Record<string, string>;
}

export interface EditorState {
  html: string;
  selectedElementId: string | null;
  isLoading: boolean;
  aiAnalyzing: boolean;
  designSystem: DesignSystem;
}

export enum ViewMode {
  DESKTOP = '1440px',
  TABLET = '768px',
  MOBILE = '375px'
}

export enum Tab {
  PROJECT = 'PROJECT',
  STYLE = 'STYLE',
  CONTENT = 'CONTENT',
  AI = 'AI'
}

export type ElementType = 'text' | 'image' | 'container' | 'unknown';

// User Area Extensions
export interface Project {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  html: string;
  designSystem: DesignSystem;
  lastUpdated: string;
  thumbnail?: string;
}

export interface Asset {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'svg';
  size: string;
}

declare module 'react-native' {
  export const Platform: {
    OS: 'ios' | 'android' | 'web';
  };
  
  export interface ViewProps {
    style?: any;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export interface TextProps {
    style?: any;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export interface ScrollViewProps {
    style?: any;
    children?: React.ReactNode;
    refreshControl?: React.ReactNode;
    [key: string]: any;
  }
  
  export interface RefreshControlProps {
    refreshing?: boolean;
    onRefresh?: () => void;
    [key: string]: any;
  }
  
  export interface AlertStatic {
    alert(title: string, message?: string, buttons?: any[]): void;
  }
  
  export const View: React.ComponentType<ViewProps>;
  export const Text: React.ComponentType<TextProps>;
  export const ScrollView: React.ComponentType<ScrollViewProps>;
  export const RefreshControl: React.ComponentType<RefreshControlProps>;
  export const Alert: AlertStatic;
  export const StyleSheet: {
    create<T>(styles: T): T;
  };
}

declare module 'jspdf' {
  export default class jsPDF {
    constructor(orientation?: string, unit?: string, format?: string);
    addImage(imageData: string, format: string, x: number, y: number, width: number, height: number): void;
    addPage(): void;
    output(type: string): any;
  }
}

declare module 'html2canvas' {
  interface Html2CanvasOptions {
    scale?: number;
    useCORS?: boolean;
    allowTaint?: boolean;
    backgroundColor?: string;
  }
  
  function html2canvas(element: HTMLElement, options?: Html2CanvasOptions): Promise<HTMLCanvasElement>;
  export default html2canvas;
}

declare module 'expo-print' {
  export function printToFileAsync(options: { html: string; base64?: boolean }): Promise<{ uri: string }>;
}

declare module 'expo-sharing' {
  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(uri: string, options?: { mimeType?: string; dialogTitle?: string }): Promise<void>;
}

// React Native globals
declare global {
  var __DEV__: boolean;
}

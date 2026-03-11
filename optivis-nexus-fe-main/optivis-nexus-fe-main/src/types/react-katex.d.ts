declare module 'react-katex' {
  import { Component, ReactNode } from 'react';

  interface KaTeXOptions {
    throwOnError?: boolean;
    errorColor?: string;
    macros?: Record<string, string>;
    [key: string]: any;
  }

  interface MathComponentProps {
    math: string;
    children?: ReactNode;
    renderError?: (error: Error) => ReactNode;
    errorColor?: string;
    throwOnError?: boolean;
    settings?: KaTeXOptions;
    [key: string]: any;
  }

  export class InlineMath extends Component<MathComponentProps> {}
  export class BlockMath extends Component<MathComponentProps> {}
}


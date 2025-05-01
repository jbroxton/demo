import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react' {
  export interface ReactElement {
    type: any;
    props: any;
    key: string | null;
  }
  
  export function useState<T>(initialState: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>];
  export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  export function forwardRef<T, P = {}>(render: (props: P, ref: React.ForwardedRef<T>) => React.ReactElement | null): ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T>>;
  
  export type ForwardedRef<T> = ((instance: T | null) => void) | React.MutableRefObject<T | null> | null;
  export type RefObject<T> = { readonly current: T | null };
  export type MutableRefObject<T> = { current: T };
  
  export type ReactNode = 
    | ReactElement
    | string
    | number
    | boolean
    | null
    | undefined
    | Iterable<ReactNode>;
    
  export type FC<P = {}> = FunctionComponent<P>;
  
  export interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }): ReactElement | null;
    displayName?: string;
  }
  
  export interface ForwardRefExoticComponent<P> {
    (props: P): ReactElement | null;
    displayName?: string;
  }
  
  export interface RefAttributes<T> {
    ref?: ForwardedRef<T>;
  }
  
  export type PropsWithoutRef<P> = P extends { ref?: infer R } ? Pick<P, Exclude<keyof P, 'ref'>> : P;
  
  export interface PropsWithChildren<P = unknown> {
    children?: ReactNode;
    [key: string]: any;
  }
} 
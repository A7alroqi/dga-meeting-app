declare module "stylis" {
  export type StylisPlugin = (...args: unknown[]) => unknown;
  export const prefixer: StylisPlugin;
  export function middleware(fns: unknown[]): unknown;
  export function serialize(...args: unknown[]): string;
}

import type { Route } from './route.ts';

/** A self-contained feature: plug it into the composition root to expose it. */
export interface AppModule {
  readonly name: string;
  readonly routes: readonly Route[];
}

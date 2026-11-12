export interface PageRequest {
  readonly limit: number;
  readonly offset: number;
}

export interface Page<T> {
  readonly items: T[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

export function mapPage<T, U>(page: Page<T>, map: (item: T) => U): Page<U> {
  return { ...page, items: page.items.map(map) };
}

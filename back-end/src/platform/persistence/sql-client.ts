/** Minimal SQL access used by repository adapters; always parameterised. */
export interface SqlClient {
  query<Row>(text: string, params?: readonly unknown[]): Promise<Row[]>;
  /** Runs a statement and resolves with the number of affected rows. */
  execute(text: string, params?: readonly unknown[]): Promise<number>;
}

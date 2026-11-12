/** What the composition root needs from an HTTP server, whatever framework backs it. */
export interface HttpServer {
  /** Starts accepting connections and resolves with the base URL. */
  listen(): Promise<string>;
  /** Stops accepting connections and waits for in-flight requests. */
  close(): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

/** A dependency whose availability decides whether the service is ready for traffic. */
export interface HealthProbe {
  ping(): Promise<void>;
}

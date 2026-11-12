import { createApplication } from './composition/application.ts';
import { loadConfig } from './config/config.ts';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  for (const warning of config.warnings) console.warn(`[config] ${warning}`);

  const application = await createApplication(config);
  await application.start();

  let stopping = false;
  const shutdown = (signal: string): void => {
    if (stopping) return;
    stopping = true;
    console.info(`${signal} received, shutting down`);
    setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
    application.stop().then(
      () => process.exit(0),
      (error: unknown) => {
        console.error(error);
        process.exit(1);
      },
    );
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  // Configuration errors are written for humans; show them without a stack trace.
  console.error(error instanceof Error && error.name === 'ConfigError' ? error.message : error);
  process.exit(1);
});

import { buildApp } from './app.js';
import { env } from './config/env.js';

// Amra Mohammodpury API entrypoint
const startServer = async () => {
  try {
    const app = await buildApp();

    await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    app.log.info(`🚀 Amra Muhammadpuri API Server running at http://localhost:${env.PORT}`);
    app.log.info(`📚 Swagger Documentation available at http://localhost:${env.PORT}/docs`);

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        app.log.info(`Received ${signal}. Shutting down gracefully...`);
        await app.close();
        process.exit(0);
      });
    }
  } catch (error) {
    console.error('Fatal server startup failure:', error);
    process.exit(1);
  }
};

startServer();

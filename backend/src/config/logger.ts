import { env } from './env.js';

export const loggerConfig = {
  development: {
    level: env.LOG_LEVEL,
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  production: {
    level: env.LOG_LEVEL,
    redact: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.token'],
  },
  test: false,
};

export const getLoggerConfig = () => {
  if (env.NODE_ENV === 'production') return loggerConfig.production;
  if (env.NODE_ENV === 'test') return loggerConfig.test;
  return {
    level: env.LOG_LEVEL,
  };
};

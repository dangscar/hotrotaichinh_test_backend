import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './shared/middlewares/errorHandler.js';
import { requestLogger } from './shared/middlewares/requestLogger.js';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: [config.clientUrl, "http://localhost:5174"], credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.use('/api/v1', routes);

  app.use(errorHandler);

  return app;
};

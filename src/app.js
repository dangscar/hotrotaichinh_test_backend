import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './shared/middlewares/errorHandler.js';
import { requestLogger } from './shared/middlewares/requestLogger.js';
import { connectDatabase } from "../src/config/database.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: [config.clientUrl, "http://localhost:5174", "https://hotrotaichinh-test-frontend.vercel.app/"],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use('/api/v1', routes);

app.use(errorHandler);

await connectDatabase();

export default app;
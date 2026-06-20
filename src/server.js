import 'dotenv/config';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import config from './config/index.js';

const startServer = async () => {
  try {
    await connectDatabase();

    const app = createApp();
    const PORT = config.port;

    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT} (${config.nodeEnv})`);
      console.log(`[Server] API: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error.message);
    process.exit(1);
  }
};

startServer();

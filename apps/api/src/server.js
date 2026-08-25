import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();
const server = app.listen(env.PORT, () => console.log(`API Faculdade Perto em http://localhost:${env.PORT}`));

function shutdown(signal) {
  console.log(`${signal}: encerrando API`);
  server.close(() => process.exit(0));
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

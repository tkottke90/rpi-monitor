const express = require('express');
const { createHttpTerminator } = require('http-terminator');

const environment = require('./lib/environment');
const logger = require('./lib/logger');
const workerFactory = require('./lib/workers');
const http = require('./lib/http');

const app = express();

const main = async () => {
  console.clear();
  app.env = environment();
  app.logger = logger(app.env.LOG_LEVEL);
  app.workers = await workerFactory(app);
  
  const server = http(app);
  
  const httpTerminator = createHttpTerminator({ server }); 
  
  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, async () => {
      app.logger.info(`${signal} Received - Shutting Down`)
      httpTerminator.terminate();
      app.workers.shutdown()
    });
  });
}

main();

module.exports = app;
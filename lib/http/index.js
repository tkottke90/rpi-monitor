const {
  trafficLogger 
} = require('./middleware');

const package = require('../../package.json');

const dataEndpoints = require('./data');

/**
 * Module for managing HTTP communications with this service
 * @param {Express.Application} app Express application created in the index.js file
 * @returns {http.Server} NodeJS http server
 */
module.exports = (app) => {
  app.use(trafficLogger(app));
  
  app.get('/', (req, res) => res.status(200).json({
    app: 'RPI Monitor',
    version: package.version,
    author: package.author
  }));

  app.get('/v1/healthcheck', (req, res) => {
    res.status(200);
    res.json({ status: 'OK' });
  })

  dataEndpoints(app);

  return app.listen(app.env.PORT, () => {
    app.logger.info(`Raspberry Pi system watch started.  Reports can be accessed from port ${app.env.PORT}`);
  });
}
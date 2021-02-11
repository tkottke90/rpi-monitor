/**
 * Module for managing HTTP communications with this service
 * @param {Express.Application} app Express application created in the index.js file
 * @param {Express.Request} req Express application created in the index.js file
 * @param {Express.Response} res Express application created in the index.js file
 * @returns {http.Server} NodeJS http server
 */
module.exports = (app) => (req, res, next) => {
  app.logger.http(`${req.method} ${req.originalUrl}`, { timestamp: new Date().valueOf() });
  next();
}
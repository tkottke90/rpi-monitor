const fileHelper = require('./file-helper');
const { resolve } = require('path');
const appTag = '[TK-SS]';
const defaultLevels = [ 'fatal', 'error', 'warn', 'info', 'http', 'silly', 'debug'  ];

let defaultLevel = 'debug';

const _log = (mode, message, meta = {}) => {
  const modeIndex = defaultLevels.findIndex(m => m.toUpperCase() === mode);
  // Only log if higher priority than default level
  if (modeIndex === -1 || modeIndex <= defaultLevel) {
    const output = `${appTag}${new Date().toISOString()} | ${mode} | ${message} ${JSON.stringify(meta)}`
    console.log(output);
  }
}


module.exports = (logLevel) => {
  const levelString = logLevel || defaultLevel;
  defaultLevel = defaultLevels.findIndex(m => m === levelString);

  if (defaultLevel === -1) {
    defaultLevel = defaultLevels.findIndex(m => m === 'debug');
  }

  const logger = defaultLevels.reduce((output, cur) => ({ ...output, [cur]: (message, meta) => _log(cur.toUpperCase(), message, meta) }), {}); 
  logger._app_tag = appTag;

  return logger;
}

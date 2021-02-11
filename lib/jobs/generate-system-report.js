const { resolve } = require('path');
const { mkdir, readJSON, writeJSON } = require('../file-helper');
const _ = require('lodash');

const leadingZero = (number) => {
  if (number < 10 && number >= 0){
    return `0${number}`;
  } else if (number < 0 && number > -10) {
    return `-0${number}`;
  }

  return number;
}

const setupScriptDir = async (app, directory, successMsg, action) => {
  await mkdir(directory, { recursive: true })
    .then(() => app.logger.debug(successMsg, { task: 'generate-system-report', action }))
    .catch(error => app.logger.error(`Error setting up system- ${error.message}`, { error: {...error}, task: 'generate-system-report', action }));
}

module.exports = async (app) => {
  app.logger.debug('Setting up script directories', { task: 'generate-system-report' });
  await setupScriptDir(app, app.env.DATA_DIR, 'Data directory configured', 'Setup Data Directory');
  await setupScriptDir(app, app.env.JSON_REPORT_DIR, 'JSON Report directory configured', 'Setup JSON Report Directory');

  return {
    name: 'generate-system-report',
    schedule: '30 59 23 * * *',
    action: async () => {
      const { error, data } = await readJSON(resolve(app.env.DATA_DIR, 'data.json'));
      if (error) {
        app.logger.error(`Error loading data file: ${errror.emessage}`, { task: 'generate-system-report', ...error });
        return;
      }

      if (!data.items && !Array.isArray(data.items)) {
        app.logger.info('Missing data, cannot generate reports', { task: 'generate-system-report', conditions: { exists: !!data.items, isArray: Array.isArray(data.items) } });
        return;
      }

      if (data.items.length === 0) {
        app.logger.info('No data in \'data.json\' - skipping execution', { task: 'generate-system-report' })
        return;
      }

      let fileDate = '';
      const output = {
        date: '',
        version: '',
        kernel: '',
      }

      const averages = {
        memoryUsage: 0,
        cpuUsage: 0,
        cpuTemp: 0,
        networkConnections: 0,
        storageUsage: []
      };

      const rawData = {
        timestamps: [],
        release: [],
        mem: [],
        cpu: [],
        temp: [],
        connections: [],
        availableStorage: [],
      };

      const storageEntities = new Set();

      data.items.forEach(item => {
        const { createdAt, system, stats, storage } = item;
        const date = new Date(createdAt);

        if (!output.date) {
          output.date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
          fileDate = `${date.getFullYear()}${leadingZero(date.getMonth() + 1)}${leadingZero(date.getDate())}`;
        }

        if (!output.kernal) {
          output.kernel = system.kernel;
        }

        rawData.timestamps.push(`${leadingZero(date.getHours())}:${leadingZero(date.getMinutes())}:${leadingZero(date.getSeconds())}`);
        rawData.release.push(parseInt(system.release));
        rawData.mem.push(stats.percents.mem);
        rawData.cpu.push(stats.percents.cpu);
        rawData.temp.push(stats.temp);
        rawData.connections.push(stats.network.connections);
        if (rawData.availableStorage.length === 0) {
          rawData.availableStorage.length = stats.storage.length;
          rawData.availableStorage = rawData.availableStorage.fill([]);
        }

        rawData.availableStorage = _.zip(rawData.availableStorage, stats.storage).map(arr => arr.flat());

        storage._entities.forEach(entity => storageEntities.add(entity));
      });

      rawData.storageEntities = [...storageEntities];
      
      averages.memoryUsage = _.sum(rawData.mem) / rawData.mem.length;
      averages.cpuUsage = _.sum(rawData.cpu) / rawData.cpu.length;
      averages.cpuTemp = _.sum(rawData.temp) / rawData.temp.length;
      averages.networkConnections = _.sum(rawData.connections) / rawData.connections.length;
      averages.storageUsage = rawData.availableStorage.map((dataArr) => _.sum(dataArr) / dataArr.length );

      output.version = _.sum(rawData.release) / rawData.release.length;
      output.data = rawData;
      output.averages = averages;
      output.rawData = data;

      try {
        await writeJSON(resolve(app.env.JSON_REPORT_DIR, `daily-report.${fileDate}.json`), output, true);
        app.logger.debug('Report written to storage', { filename: `daily-report.${fileDate}.json`, task: 'generate-system-report' }); 
      } catch (error) {
        app.logger.error(`Issue writing report to storage: ${error.message}`, { error: { ...error }, filename: `daily-report.${fileDate}.json`, task: 'get-system-info' }); 
      }

      try {
        await writeJSON(resolve(app.env.DATA_DIR, 'data.json'), { items: [] })
        app.logger.debug('Data written to storage') 
      } catch (error) {
        app.logger.error(`Issue writing data to storage: ${error.message}`, { error: { ...error }, task: 'get-system-info' }); 
      }
    }
  }
}

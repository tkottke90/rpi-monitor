const express = require('express');
const { createReadStream } = require('fs');
const { resolve } = require('path');
const { readDir, readJSON } = require('../file-helper');
const _ = require('lodash');

const dataErrorCodes = {
  'ENOENT': 404
}

const csvLine = (array) => {
return array.map(item => `${item}`.replace(',', '-')).join(',') + '\n';
}

module.exports = (app) => {
  
  const router =  express.Router();

  router.get('/', (req, res) => {
    const dataLocal = resolve(app.env.DATA_DIR, 'data.json');
    const stream = createReadStream(dataLocal);

    stream.on('error', err => {
      app.logger.error(`Error sending data file: ${err.message}`, { ...err });
      res.end();
    })

    stream.pipe(res);
  });


  router.get('/reports/json', async (req, res) => {
    let result;
    try {
      result = await readDir(resolve(app.env.JSON_REPORT_DIR));
    } catch (error) {
      app.logger.error(`Unable to read reports dir: ${error.message}`, { error: {...error} });
      res.status(500)
      res.json({ message: 'Unable to read reports dir'});
    }

    res.json({ reports: result });
  })

  router.get(/\/reports\/.*\.json/, async (req, res) => {
    const dataLocal = resolve(app.env.JSON_REPORT_DIR, _.last(req.path.split('/')));
    const stream = createReadStream(dataLocal);

    stream.on('error', err => {
      app.logger.error(`Error sending data file: ${err.message}`, { ...err });
      res.status(dataErrorCodes[err.code] || 500);
      res.json({ message: err.message });
    })

    stream.pipe(res);
  });

  router.get(/\/reports\/.*\.csv/, async (req, res) => {
    const filename = _.last(req.path.split('/')).replace(/\.csv/, '');
    res.contentType('text/csv');
    res.set('Content-disposition', `attachment; filename=${filename}.export.csv`)
    
    let dataLocal = './';
    try {
      dataLocal = resolve(app.env.JSON_REPORT_DIR, `${filename}.json`);  
    } catch (error) {
      app.logger.error(error.message, { stack: error.stack });
    }

    
    const {error, data} = await readJSON(dataLocal);
    if (error) {
      app.logger.warn(`Report file not found: ${`${filename}.json`}`);
      res.status(404).json({ message: 'File Not Found' });
      return;
    }

    


    const { timestamps, release, mem, cpu, temp, connections, availableStorage, storageEntities } = data.data;
    
    const headers = [ 'Date', 'Time', 'Release', 'Memory Usage', 'CPU Usage', 'CPU Temp', 'Network Connections', ...storageEntities ]

    res.write(csvLine(headers));
    app.logger.debug('CSV Generator - Headers Sent')
    await Promise.all(timestamps.map((timestamp, index) => {
      try {
      const output = [
        data.date,
        timestamp,
        release[index],
        mem[index],
        cpu[index],
        temp[index],
        connections[index]
      ];

      
        availableStorage.forEach(storageItem => output.push(storageItem));
        app.logger.debug(`CSV Generator - Line ${index} sent`);
        res.write(csvLine(output));
      } catch (error) {
        app.logger.error(error, { stack: error.stack})
      }
    }))
    .catch((errors) => {
      console.error(errors);
    });

    res.end();
  });

  router.get(/\/reports\/.*\.html/, (req, res, next) => { res.status(406).json({ message: '[WIP] Endpoint Not Available'}) }, async (req, res) => {
    const filename = _.last(req.path.split('/')).split('.')[0];
    
    const dataLocal = resolve(app.env.JSON_REPORT_DIR, `${filename}.json`);
    const stream = createReadStream(dataLocal);

    stream.on('error', err => {
      app.logger.error(`Error sending data file: ${err.message}`, { ...err });
      res.status(dataErrorCodes(err.code) || 500);
      res.json({ message: error.message });
    })

    stream.pipe(res);
  })

  router.all('/*', (req, res) => {
    res.sendStatus(405).json({ message: 'Route Not Implemented' });
  });

  app.use('/v1/data', router);
}
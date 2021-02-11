const { resolve } = require('path');
const { mkdir, readJSON, writeJSON } = require('../file-helper');
const sysInfo = require('systeminformation');

const bytesToKilobytes = (bytes) => {
  return bytes / 1024;
}

const bytesToMegabytes = (bytes) => {
  return bytes / 1048576;
}

const bytesToGigabytes = (bytes) => {
  return bytes / 1073741824;
}

module.exports = async (app) => {
  await mkdir(app.env.DATA_DIR, { recursive: true });

  return {
    name: 'get-system-info',
    schedule: '0,30 * * * * *',
    action: async () => {
      const { distro, release, codename, kernel, logofile: logo } = (await sysInfo.osInfo());
      const { manufacturer } = (await sysInfo.cpu());
      const { total: totalMem, used: usedMem } = (await sysInfo.mem());
      const { currentLoad } = (await sysInfo.currentLoad());
      const { main: cpuTemp } = (await sysInfo.cpuTemperature());
      const networkConnections = (await sysInfo.networkConnections());
      const fileSystems = (await sysInfo.fsSize());

      const output = {
        createdAt: new Date().valueOf(),
        system: {
          desc: `${distro} ${release} (${codename}) [kernal: ${kernel}]`,
          logo,
          cpu: manufacturer,
          distro,
          release,
          codename,
          kernel
        },
        stats: {
          percents: {
            mem: ((usedMem / totalMem) * 100),
            cpu: currentLoad
          },
          temp: cpuTemp,
          network: {
            connections: networkConnections.length
          },
          storage: fileSystems.map(fileS => fileS.use)
        },
        storage: fileSystems.reduce((output, current) => ({ ...output, [current.fs]: {
          type: current.type,
          'size(GB)': bytesToGigabytes(current.size).toFixed(2),
          'available(GB)': bytesToGigabytes(current.available).toFixed(2)
        }}), {}),
        network: networkConnections
          .filter(connection => connection.localAddress !== connection.peerAddress)
          .reduce((output, current) => ({ ...output, [current.peerAddress]: {
            protocol: current.protocol,
            port: current.localPort,
            process: current.process,
            state: current.state
          }}), {})
      }

      output.storage._entities = Object.keys(output.storage);

      const { error, data } = await readJSON(resolve(app.env.DATA_DIR, 'data.json'));

      if (error) {
        app.logger.info('Data file not found....creating new one');
      }
      
      if (data.items) {
        data.items.push(output);
      } else {
        data.items = [output];
      }
      try {
        await writeJSON(resolve(app.env.DATA_DIR, 'data.json'), data);
        app.logger.debug('Data written to storage') 
      } catch (error) {
        app.logger.error(`Issue writing data to storage: ${error.message}`, { error: { ...error }, task: 'get-system-info' }); 
      }
    }
  }
};
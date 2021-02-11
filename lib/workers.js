const { readDir } = require('./file-helper');
const { logger } = require('./logger')();
const { resolve } = require('path');
const nodeCron = require('node-cron');

const jobs = [];

module.exports = async (app) => {
  const jobsDir = await readDir(resolve(__dirname, 'jobs'));

  await Promise.allSettled(jobsDir.filter(jobFile => /.js$/.test(jobFile)).map(async jobFile => {
    let job;
    try {
      job = await import(resolve(__dirname, 'jobs', jobFile));
    } catch (error) {
      app.logger.error(`Error loading job file ${jobFile} - ${error.message}`, { ...error });
      return;
    }

    const { name, schedule, action } = await job.default(app);

    const _name = name || jobFile;
    if (!schedule || !action || !nodeCron.validate(schedule)) {
      const details = {
        schedule: {
          exists: !!schedule,
          valid: schedule ? nodeCron.validate(schedule) : 'N/A'
        },
        action: {
          exists: !!action,
          valid: typeof action === 'function'
        }
      };
      app.logger.warn(`Missing schedule configuration or action in ${_name}`, details);
      return;
    }

    jobs.push({ name: _name, task: nodeCron.schedule(schedule, action) });
    app.logger.info(`New job scheduled: ${_name}`, { index: jobs.length - 1 });
  }));

  return {
    shutdown: async () => {
      jobs.forEach(job => {
        app.logger.info(`Shutting down job: ${job.name}`)
        job.task.destroy();
      });
    }
  }
}

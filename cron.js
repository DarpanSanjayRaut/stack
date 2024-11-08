const cron = require('cron');
const Task = require('./models/task');

function scheduleTask(datetime, taskId) {
    const cronTime = new Date(datetime);
    const cronString = `${cronTime.getMinutes()} ${cronTime.getHours()} ${cronTime.getDate()} ${cronTime.getMonth() + 1} *`;

    const job = new cron.CronJob(cronString, async () => {
        console.log(`Task ${taskId} started at ${new Date()}`);
        const task = await Task.findById(taskId);
        const payload = { taskId, ...task.toObject() };
    });

    job.start();
}

module.exports = { scheduleTask };

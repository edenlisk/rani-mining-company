const cron = require('node-cron');
const { logger } = require('./loggers');
const ActivityLogs = require('../models/activityLogsModel');
const Settings = require('../models/settingsModel');



exports.deleteOverDueLogs = () => {
    const task = cron.schedule('0 0 * * *', async () => {
        try {
            const { logsLifeTime } = await Settings.findOne();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - logsLifeTime);
            const result = await ActivityLogs.deleteMany({createdAt: {$lt: startDate}});
            logger.info(`Deleted ${result.deletedCount} logs`);
        } catch (e) {
            logger.warn('Something went wrong with cron job for deleting overdue logs');
            logger.warn(e.message);
        }
    }, {timezone: "Africa/Kigali", scheduled: true});
    task.start();
}

const ActivityLogs = require('../models/activityLogsModel');
const { toInitialCase } = require('./helperFunctions');

const recordLogs = async (logs) => {
    await ActivityLogs.insertMany(logs, {ordered: false});
}

const prepareLog = (logs, link, {userId, username}) => {
    const result = [];
    logs.forEach(log => {
        result.push(
            {
                logSummary: log.summary,
                initialValue: log.initialValue,
                newValue: log.newValue,
                userId,
                username,
                link
            }
        )
    })
    return result;
}





// module.exports = {
//     trackUpdateModifications
// };
const mongoose = require('mongoose');


const activityLogsSchema = new mongoose.Schema(
    {
        logSummary: String,
        username: String,
        userId: mongoose.Schema.Types.ObjectId,
        link: String,
        modifications: {
            type: [
                {
                    fieldName: String,
                    initialValue: mongoose.Schema.Types.Mixed,
                    newValue: mongoose.Schema.Types.Mixed,
                }
            ],
            default: []
        },
        status: {
            type: String,
            enum: ["approved", "failed"],
            default: "approved"
        }
    }, {
        timestamps: true
    }
)



module.exports = mongoose.model('ActivityLog', activityLogsSchema);
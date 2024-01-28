const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
    {
        sfdt: {
            type: String,
        },
        name: {
            type: String,
        },
        fileId: {
            type: String,
        },
        fileUrl: {
            type: String,
        }
    }, {
        timestamps: true,
    }
)


module.exports = mongoose.model('Document', documentSchema);
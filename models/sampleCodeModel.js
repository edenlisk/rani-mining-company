const mongoose = require('mongoose');

const sampleCodeSchema = new mongoose.Schema(
    {
        codeNumber: {
            type: String,
            unique: true,
            required: [true, "Please provide the sample code number"]
        },
        isCodeUsed: {
            type: Boolean,
            default: false
        },
        dateGenerated: Date
    },
    {
        timestamps: true
    }
)


module.exports = mongoose.model('SampleCode', sampleCodeSchema);
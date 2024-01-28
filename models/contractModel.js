const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        minerals: {
            type: [String],
            required: true
        },
        contractStartDate: {
            type: Date,
            required: true
        },
        contractExpiryDate: {
            type: Date,
            required: true
        },
        // grade: {
        //     type: String
        // },
        buyerName: {
            type: String,
            required: [true, "Please provide contract buyer's name"]
        },
        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Buyer',
            required: true
        },
        filePath: {
            type: String,
            default: null
        }
    },
    {timestamps: true}
)

module.exports = mongoose.model('Contract', contractSchema);
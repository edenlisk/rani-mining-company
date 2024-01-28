const mongoose = require('mongoose');

const dueDiligenceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Buyer',
            required: true
        },
        issueDate: {
            type: Date
        },
        expiryDate: {
            type: Date
        }
    },
    {timestamps: true}
)

module.exports = mongoose.model('DueDiligence', dueDiligenceSchema);
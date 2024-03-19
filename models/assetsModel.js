const mongoose = require('mongoose');


const assetsSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide asset name"]
        },
        value: {
            type: Number,
        },
        category: {
            type: String,
            // enum: ['electronics', 'furniture']
        },
        numberOfItems: {
            type: Number
        },
        acquisitionDate: {
            type: Date,
            default: () => new Date()
        },
        comment: {
            type: String
        },
        status: {
            type: String,
            // enum: ["active", "inactive", "damaged", "lost", "retired"],
        },
        currency: {
            type: String,
            enum: ["USD", "RWF"],
            default: () => "RWF"
        },
        type: {
            type: String,
            enum: ["fixed", "current"]
        },
    }
)

module.exports = mongoose.model("Asset", assetsSchema);
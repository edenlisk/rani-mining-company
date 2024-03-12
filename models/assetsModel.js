const mongoose = require('mongoose');


const assetsSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        price: {
            type: String,
        },
        category: {
            type: String,
            enum: ['electronics', 'furniture']
        },
        numberOfItems: {
            type: Number
        }
    }
)

module.exports = mongoose.model("Asset", assetsSchema);
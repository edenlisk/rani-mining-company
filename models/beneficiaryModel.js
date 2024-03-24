const mongoose = require('mongoose');


const beneficiarySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: "Please provide beneficiary name"
        },
        address: {
            province: String,
            district: String,
            sector: String,
        },
        phoneNumber: {
            type: String,
            required: "Please provide beneficiary phone number"
        },
        category: {
            type: String
        }
    },{
        timestamps: true,
    }
)

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
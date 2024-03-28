const mongoose = require('mongoose');


const marketersSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            minLength: 5,
            maxLength: 50,
            required: [true, "Please provide marketer's name"]
        },
        nationalId: {
            type: String,
            unique: true
        },
        phoneNumber: {
            type: String,
            minLength: [10, "Please provide valid phone number. Few numbers"],
            maxLength: [13, "Please provide valid phone number. Many numbers"],
            unique: true
        },
        address: {
            province: String,
            district: String,
            sector: String,
            cell: String
        },
        supportingDoc: {
            fileId: String,
            filePath: String
        },
        supplierIds: {
            type: [
                {
                    type: mongoose.Types.ObjectId,
                    ref: 'Supplier'
                }
            ]
        }
    },
    {
        timestamps: true,
        toJSON: {virtuals: true},
        toObject: {virtuals: true}
    }
)

module.exports = mongoose.model("Marketer", marketersSchema);
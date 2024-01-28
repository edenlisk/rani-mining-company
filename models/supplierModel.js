const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            unique: true
        },
        TINNumber: {
            type: String,
            unique: true
        },
        licenseNumber: {
            type: String,
            unique: true
        },
        companyRepresentative: {
            type: String
        },
        mineralTypes: [String],
        email: {
            type: String
        },
        nationalId: {
            type: String
        },
        phoneNumber: {
            type: String
        },
        address: {
            province: String,
            district: String,
            sector: String,
            cell: String
        },
        mineSites: {
            type: [
                {
                    name: String,
                    code: String,
                    coordinates: {
                        lat: String,
                        long: String
                    },
                }
            ]
        },
        equipmentList: {
            type: [String],
            default: []
        },
        typeOfMining: {
            type: String,
            enum: ['Underground', 'Open Pits', 'Both'],
            default: "Open Pits"
        },
        surfaceArea: {
            type: Number,
            default: null
        },
        categoryOfMine: {
            type: String,
            default: null
        },
        numberOfDiggers: {
            type: Number,
            default: null
        },
        numberOfWashers: {
            type: Number,
            default: null
        },
        numberOfTransporters: {
            type: Number,
            default: null
        },
        typeOfMinerals: [String],
        status: {
            type: String
        },
        observations: [String]
    },
    {timestamps: true}
)

supplierSchema.pre('save', async function (next) {
    const imagekit = require('../utils/imagekit');
    if (this.isNew) {
        imagekit.createFolder(
            {
                folderName: `${this.companyName}`,
                parentFolderPath: `/invoices`
            }, err => {
                if (err) {
                    console.log(err);
                }
            }
        )
    }
    next()
})

module.exports = mongoose.model('Supplier', supplierSchema);
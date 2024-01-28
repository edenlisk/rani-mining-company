const fs = require('fs');
const mongoose = require('mongoose');
const { getModel } = require('../utils/helperFunctions');
const Buyer = require('./buyerModel');
const AppError = require('../utils/appError');
const {decidePricingGrade} = require("../utils/helperFunctions");

const shipmentSchema = new mongoose.Schema(
    {
        entries: {
            type: [
                {
                    entryId: mongoose.Schema.Types.ObjectId,
                    quantity: Number,
                    lotNumber: Number
                }
            ],
            required: [true, "Please provide entries"],
        },
        shipmentGrade: {
            type: Number,
            // required: [true, "Please provide average grade of shipment"],
            validate: {
                validator: (elem) => {
                    return elem >= 0.0;
                },
                message: "Shipment grade can't be negative number"
            },
            default: null
        },
        shipmentPrice: {
            type: Number,
            validate: {
                validator: (elem) => {
                    return elem >= 0.0;
                },
                message: "Shipment price can't be negative number"
            },
            default: null
        },
        shipmentMinerals: {
            type: String,
            default: null
        },
        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Buyer',
            default: null
            // required: [true, "Please select the buyer"],
            // immutable: true
        },
        shipmentSamplingDate: {
            type: Date,
            default: null
        },
        shipmentContainerLoadingDate: {
            type: String,
            default: null
        },
        buyerName: {
            type: String,
            default: null
        },
        shipmentNumber: {
            type: String,
            unique: true,
            required: [true, "Please provide shipment number"],
        },
        analysisCertificate: {
            type: String,
        },
        containerForwardNote: {
            fileId: {
                type: String,
                default: null,
            },
            url: {
                type: String,
                default: null,
            }
        },
        certificateOfOrigin: {
            type: String,
        },
        rmbIcglrCertificate: {
            fileId: {
                type: String,
                default: null
            },
            url: {
                type: String,
                default: null
            }
        },
        model: String,
        tagListFile: {
            fileId: {
                type: String,
                default: null
            },
            url: {
                type: String,
                default: null
            }
        },
        negociantTagListFile: {
            fileId: {
                type: String,
                default: null
            },
            url: {
                type: String,
                default: null
            }
        },
        packingListFile: {
            fileId: {
                type: String,
                default: null
            },
            url: {
                type: String,
                default: null
            }
        },
        iTSCiShipmentNumber: {
            type: String,
            default: null
        },
        sampleWeight: {
            type: Number,
            default: null
        },
        dustWeight: {
            type: Number,
            default: null
        },
        shipmentDate: {
            type: Date,
            default: null
        },
    },
    {
        timestamps: true,
        toJSON: {virtuals: true},
        toObject: {virtuals: true}
    }
)

// TODO 24: REPLACE TOTAL SHIPMENT QUANTITY WITH NET WEIGHT -----> DONE


// TODO 8: PRE `SAVE` FOR SHIPMENT

shipmentSchema.virtual('netWeight').get(function () {
    if (!this.entries?.length) return null;
    return this.entries.reduce((acc, curr) => {
        return acc + curr.quantity;
    }, 0);
})

shipmentSchema.virtual('averageNiobium').get(async function () {
    if (!this.entries.length) return null;
    if (this.entries) {
        const Entry = getModel(this.model);
        if (!this.netWeight) return null;
        const entries = await Entry.find({_id: {$in: this.entries.map(item => item.entryId)}});
        const weightNiobium = entries.reduce((acc, curr) => {
            const lot = curr.output.find(value => parseInt(value.lotNumber) === (parseInt(this.entries.find(item => item.entryId.toString() === curr._id.toString()).lotNumber)));
            const lotShipment = lot.shipmentHistory.find(value => value.shipmentNumber === this.shipmentNumber);
            if (!lotShipment) return acc;
            return acc + (lotShipment.weight *  (lot.niobium ? lot.niobium : 0));
        }, 0);
        return (weightNiobium / parseFloat(this.netWeight)).toFixed(5);
    }
})

shipmentSchema.virtual('averageGrade').get(async function () {
    if (!this.entries?.length) return null;
    if (this.entries) {
        const Entry = getModel(this.model);
        const entries = await Entry.find({_id: {$in: this.entries.map(item => item.entryId)}});
        // const totalWeight = this.entries.reduce((acc, curr) => {
        //     return acc + curr.quantity;
        // }, 0);
        if (!this.netWeight) return null;
        const totalGrade = entries.reduce((acc, curr) => {
            const lot = curr.output.find(value => parseInt(value.lotNumber) === (parseInt(this.entries.find(item => item.entryId.toString() === curr._id.toString()).lotNumber)));
            const lotShipment = lot.shipmentHistory.find(value => value.shipmentNumber === this.shipmentNumber);
            if (!lotShipment) return acc;
            return acc + (lotShipment.weight * lot[decidePricingGrade(lot.pricingGrade)] || lot.ASIR || lot.mineralGrade || 0);
        }, 0);
        return (totalGrade / this.netWeight).toFixed(5);
    }
})

shipmentSchema.virtual('averagePrice').get(async function () {
    if (!this.entries?.length) return null;
    const Entry = getModel(this.model);
    const entries = await Entry.find({_id: {$in: this.entries.map(item => item.entryId)}});
    // const totalWeight = this.entries.reduce((acc, curr) => {
    //     return acc + curr.quantity;
    // }, 0);
    if (!this.netWeight) return null;
    const totalPrice = entries.reduce((acc, curr) => {
        const lot = curr.output.find(value => parseInt(value.lotNumber) === (parseInt(this.entries.find(item => item.entryId.toString() === curr._id.toString()).lotNumber)));
        const lotShipment = lot.shipmentHistory.find(value => value.shipmentNumber === this.shipmentNumber);
        if (!lotShipment) return acc;
        return acc + (lotShipment.weight * lot.mineralPrice || 0);
    }, 0);
    return (totalPrice / this.netWeight).toFixed(5);
})

shipmentSchema.pre('save', async function (next) {
    // if (this.isNew) {
    //     // TODO 18: REPLACE this._id with this.shipmentNumber
    //     const filePath = `${__dirname}/../public/data/shipment/${this._id}`;
    //     fs.mkdir(filePath, {recursive: true}, err => {
    //         if (err) {
    //             console.log(err);
    //         }
    //     });
    // }
    if (this.buyerId && !this.buyerName) {
        const buyer = await Buyer.findById(this.buyerId).select({name: 1});
        this.buyerName = buyer.name;
    }
    
    next();
})

shipmentSchema.pre('save', async function (next) {
    const Entry = getModel(this.model);
    const imagekit = require('../utils/imagekit');
    if (this.isNew) {
        imagekit.createFolder(
            {
                folderName: `${this.shipmentNumber}`,
                parentFolderPath: `/shipments`
            }, err => {
                if (err) {
                    console.log(err);
                }
            }
        )
        this.shipmentMinerals = this.model.charAt(0).toUpperCase() + this.model.slice(1);
        if (this.entries?.length > 0) {
            // console.log(this.entries);
            // const promises = this.entries.map(async (item) => {
            //     console.log(item.entryId);
            //     const entry = await Entry.findById(item.entryId);
            //     console.log(entry);
            //     if (!entry) return next(new AppError("Something went wrong, entry is missing", 400));
            //     const lot = entry.output?.find(value => parseInt(value.lotNumber) === parseInt(item.lotNumber));
            //     if (!lot) return next(new AppError("Something went wrong, lot is missing", 400));
            //     lot.shipmentHistory.push({ shipmentNumber: this.shipmentNumber, weight: item.quantity, date: new Date() });
            //     await entry.save({ validateModifiedOnly: true });
            // });
            // await Promise.all(promises);

            for (const item of this.entries) {
                const entry = await Entry.findById(item.entryId);
                if (!entry) return next(new AppError("Something went wrong, entry is missing", 400));
                const lot = entry.output?.find(value => parseInt(value.lotNumber) === (parseInt(item.lotNumber)));
                if (!lot) return next(new AppError("Something went wrong, lot is missing", 400));
                lot.shipmentHistory.push({shipmentNumber: this.shipmentNumber, weight: item.quantity, date: new Date()});
                await entry.save({validateModifiedOnly: true});
            }
        }
    }
    // if (this.isModified('entries') && !this.isNew) {
    //     const totalWeight = this.entries?.reduce(
    //         (total, item) => total + parseFloat(item.quantity),
    //         0
    //     );
    //     let totalGrade = 0
    //     // const totalGrade = this.entries.reduce(
    //     //     (total, item) => total + (parseFloat(item.toBeExported) * item.mineralPrice ? item.mineralPrice : 0),
    //     //     0
    //     // );
    //
    //     let totalPrice = 0;
    //     // const totalPrice = selectedData.reduce(
    //     //     (total, item) => total + (parseFloat(item.toBeExported) * item.mineralPrice ? item.mineralPrice : 0),
    //     //     0
    //     // );
    //     if (["cassiterite", "coltan", "wolframite"].includes(this.model)) {
    //         for (const item of this.entries) {
    //             const entry = await Entry.findById(item.entryId);
    //             if (!entry) continue;
    //             const lot = entry.output?.find(value => parseInt(value.lotNumber) === parseInt(item.lotNumber));
    //             if (!lot || !entry) continue;
    //             totalGrade += (parseFloat(item.quantity) * lot[decidePricingGrade(lot.pricingGrade)] || lot.ASIR || lot.mineralGrade || 0);
    //             totalPrice += (parseFloat(item.quantity) * lot.mineralPrice ? lot.mineralPrice : 0);
    //         }
    //     } else if (["lithium", "beryllium"].includes(this.model)) {
    //         for (const item of this.entries) {
    //             const entry = await Entry.findById(item.entryId);
    //             if (!entry) continue;
    //             totalGrade += (parseFloat(item.quantity) * entry.mineralGrade ? entry.mineralGrade : 0);
    //             totalPrice += (parseFloat(item.quantity) * entry.mineralPrice ? entry.mineralPrice : 0);
    //         }
    //     }
    //     this.netWeight = totalWeight;
    //     this.averageGrade = (totalGrade / totalWeight) ? (totalGrade / totalWeight).toFixed(5) : 0;
    //     this.averagePrice = (totalPrice / totalWeight) ? (totalPrice / totalWeight).toFixed(5) : 0;
    // }
    next();
})


module.exports = mongoose.model('Shipment', shipmentSchema);
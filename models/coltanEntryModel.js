const mongoose = require('mongoose');
const { entrySchema, lotSchema } = require('../models/entryModel');
const Supplier = require('./supplierModel');
const AppError = require('../utils/appError');

const coltanLotSchema = lotSchema.clone();
coltanLotSchema.add(
    {
        tantal: {
            type: Number
        },
        niobium: {
            type: Number,
            default: null
        },
        iron: {
            type: Number,
            default: null
        }
    }
);

const coltanSchema = entrySchema.clone();
coltanSchema.add({
    output:  {
        type: [coltanLotSchema],
        default: []
    },
})

coltanSchema.set('toObject', { virtuals: true });
coltanSchema.set('toJSON', { virtuals: true });

coltanLotSchema.pre('save', async function(next) {
    const {decidePricingGrade} = require("../utils/helperFunctions");
    const Settings = require('../models/settingsModel');
    if (this.isModified(["pricingGrade", "tantal", "mineralGrade", "ASIR"]) && !this.isNew) {
        if (this[decidePricingGrade(this.pricingGrade)] && this.tantal) {
            this.pricePerUnit = this.tantal * this[decidePricingGrade(this.pricingGrade)];
        }
    }
    if (this.isModified('pricePerUnit') && !this.isNew) {
        if (this.pricePerUnit && this.weightOut) {
            this.mineralPrice = (this.pricePerUnit * this.weightOut).toFixed(5);
        }
    }
    if (this.isModified(["weightOut"])) {
        const { rmaFeeColtan } = await Settings.findOne();
        if (this.weightOut && rmaFeeColtan) {
            this.rmaFeeRWF = this.weightOut * rmaFeeColtan;
        }
    }
    next();
})



// const coltanSchema = new mongoose.Schema(
//     {
//         name: {
//             type: String,
//             default: "coltan",
//             immutable: true
//         },
//         weightIn: Number,
//         numberOfTags: Number,
//         mineTags: {
//             type: [
//                 {
//                     type: mongoose.Schema.Types.ObjectId,
//                     ref: "Tag"
//                 }
//             ],
//             default: []
//         },
//         negociantTags: {
//             type: [
//                 {
//                     type: mongoose.Schema.Types.ObjectId,
//                     ref: "Tag"
//                 }
//             ],
//             default: []
//         },
//         output: {
//             type: [coltanLotSchema],
//             default: [],
//         },
//     },
//     {
//         timestamps: true,
//         toJSON: {virtuals: true},
//         toObject: {virtuals: true}
//     }
// )


// {
//     lotNumber: Number,
//     weightOut: Number,
//     mineralGrade: Number,
//     mineralPrice: Number,
//     exportedAmount: Number,
//     cumulativeAmount: Number,
//     rmaFee: Number,
//     USDRate: Number,
//     rmaFeeUSD: Number,
//     rmaFeeDecision: {
//     type: String,
// default: "pending"
// },
//     paid: Number,
//         unpaid: Number,
//     settled: Boolean,
//     pricePerUnit: Number,
//     nonSellAgreement: {
//     weight: {
//         type: Number,
//     default: 0
//     },
//     date:  {
//         type: Date,
//     default: null
//     }
// },
//     gradeImg: {
//         filename: String,
//             createdAt: Date,
//             filePath: String,
//             fileId: String
//     },
//     shipments: {
//         type: [
//             {
//                 shipmentNumber: String,
//                 weight: Number,
//                 date: {
//                     type: Date,
//                     default: null
//                 }
//             }
//         ]
//     },
//     status: {
//         type: String,
//     default: "in stock"
//     },
//     tantalum: Number,
//         paymentHistory: {
//     type: [
//         {
//             paymentId: mongoose.Schema.Types.ObjectId,
//             beneficiary: {
//                 type: String,
//                 default: null
//             },
//             nationalId: {
//                 type: String,
//                 default: null
//             },
//             phoneNumber:  {
//                 type: String,
//                 default: null
//             },
//             location: {
//                 type: Object,
//                 default: null
//             },
//             currency:  {
//                 type: String,
//                 default: null
//             },
//             paymentDate: {
//                 type: Date,
//                 default: null
//             },
//             paymentAmount: {
//                 type: Number,
//                 default: null
//             }
//         }
//     ],
// default: []
// }
// },


// coltanSchema.virtual('finalPrice').get(function () {
//     return this.totalPrice - this.rmaFee;
// })


coltanSchema.pre('save', async function (next) {
    const { handleChangeSupplier, handlePaidSpecific } = require('../utils/helperFunctions');
    await handleChangeSupplier(this, next);
    if (this.isModified('output') && !this.isNew) {
        if (this.output) handlePaidSpecific(this.output);
    }
    next();
    // formula = tantal * grade
})

coltanSchema.statics.findCurrentStock = async function () {
    const result = await this.find(
        {
            $and: [
                {
                    $expr: {
                        $gt: ['$output.cumulativeAmount', 0]
                    }
                },
            ]
        }
    );
    return {
        entries: result,
        balance: result.reduce((acc, curr) => acc + curr.output.reduce((acc, curr) => acc + curr.cumulativeAmount, 0), 0)
    };}


coltanSchema.methods.requestEditPermission = function (editExpiresIn = 30) {
    this.editRequestedAt = Date.now();
    this.editExpiresAt = this.editRequestedAt + (editExpiresIn * 60000);
}


module.exports = mongoose.model('Coltan', coltanSchema);
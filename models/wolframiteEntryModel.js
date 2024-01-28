const mongoose = require('mongoose');
const {entrySchema, lotSchema} = require('../models/entryModel');
const Supplier = require('../models/supplierModel');
const AppError = require('../utils/appError');

const wolframiteLotSchema = lotSchema.clone();
wolframiteLotSchema.add(
    {
        metricTonUnit: {
            type: Number,
            default: null
        }
    }
);

const wolframiteSchema = entrySchema.clone();
wolframiteSchema.add({
    output: {
        type: [wolframiteLotSchema],
        default: []
    }
})



// const wolframiteSchema = new mongoose.Schema(
//     {
//         ...entry,
//         name: {
//             type: String,
//             default: "wolframite",
//             immutable: true
//         },
//         weightIn: {
//             type: Number,
//             default: null
//         },
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
//             type: [wolframiteLotSchema],
//             default: []
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
//         weightOut: Number,
//     mineralGrade: Number,
//     mineralPrice: Number,
//     metricTonUnit: Number,
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
//     status: String,
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


// wolframiteSchema.virtual('finalPrice').get(function () {
//     return this.totalPrice - this.rmaFee;
// })

wolframiteLotSchema.pre('save', async function (next) {
    const {decidePricingGrade} = require("../utils/helperFunctions");
    const Settings = require('../models/settingsModel');
    if (this.isModified(['pricingGrade', 'metricTonUnit', 'mineralGrade', 'ASIR']) && !this.isNew) {
        if (this[decidePricingGrade(this.pricingGrade)] && this.metricTonUnit) {
            this.pricePerUnit = ((this.metricTonUnit * this[decidePricingGrade(this.pricingGrade)]/100) * 0.1);
        }
    }
    if (this.isModified("pricePerUnit") && !this.isNew) {
        if (this.pricePerUnit && this.metricTonUnit) {
            this.mineralPrice = this.pricePerUnit * this.metricTonUnit;
        }
    }
    if (this.isModified('weightOut')) {
        const { rmaFeeWolframite } = await Settings.findOne();
        if (this.weightOut && rmaFeeWolframite) {
            this.rmaFeeRWF = this.weightOut * rmaFeeWolframite;
        }
    }
    next();
})

wolframiteSchema.statics.findCurrentStock = async function () {
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

module.exports = mongoose.model('Wolframite', wolframiteSchema);


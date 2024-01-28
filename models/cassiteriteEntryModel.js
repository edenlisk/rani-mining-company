const mongoose = require('mongoose');
const { entrySchema, lotSchema } = require('../models/entryModel');
const Supplier = require('../models/supplierModel');
const AppError = require('../utils/appError');

const cassiteriteLotSchema = lotSchema.clone();
cassiteriteLotSchema.add(
    {
        londonMetalExchange: {
            type: Number,
            default: null
        },
        treatmentCharges: {
            type: Number,
            default: null
        }
    }
)

const cassiteriteSchema = entrySchema.clone();
cassiteriteSchema.add({
    output:  {
        type: [cassiteriteLotSchema],
        default: []
    }
})

// const cassiteriteSchema = new mongoose.Schema(
//     {
//         ...entry,
//         name: {
//             type: String,
//             default: "cassiterite",
//             immutable: true
//         },
//         numberOfTags: Number,
//         weightIn: Number,
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
//             type: [cassiteriteLotSchema],
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
//     status: String,
//         londonMetalExchange: Number,
//     treatmentCharges: Number,
//     shipments: {
//     type: [
//         {
//             shipmentNumber: String,
//             weight: Number,
//             date: {
//                 type: Date,
//                 default: null
//             }
//         }
//     ]
// },
//     paymentHistory: {
//         type: [
//             {
//                 paymentId: mongoose.Schema.Types.ObjectId,
//                 beneficiary: {
//                     type: String,
//                     default: null
//                 },
//                 nationalId: {
//                     type: String,
//                     default: null
//                 },
//                 phoneNumber:  {
//                     type: String,
//                     default: null
//                 },
//                 location: {
//                     type: Object,
//                     default: null
//                 },
//                 currency:  {
//                     type: String,
//                     default: null
//                 },
//                 paymentDate: {
//                     type: Date,
//                     default: null
//                 },
//                 paymentAmount: {
//                     type: Number,
//                     default: null
//                 }
//             }
//         ],
//     default: []
//     }
// },


// cassiteriteSchema.virtual('finalPrice').get(function () {
//     return this.totalPrice - this.rmaFee;
// })

cassiteriteLotSchema.pre('save', async function (next) {
    const { decidePricingGrade } = require('../utils/helperFunctions');
    const Settings = require('../models/settingsModel');
    if (this.isModified(["pricingGrade", "londonMetalExchange", "treatmentCharges", "mineralGrade", "ASIR"]) && !this.isNew) {
        if (this[decidePricingGrade(this.pricingGrade)] && this.londonMetalExchange && this.treatmentCharges) {
            this.pricePerUnit = (((this.londonMetalExchange * (this[decidePricingGrade(this.pricingGrade)]/100)) - this.treatmentCharges)/1000);
        }
    }
    if (this.isModified('pricePerUnit') && !this.isNew) {
        if (this.pricePerUnit && this.weightOut) {
            this.mineralPrice = (this.pricePerUnit * this.weightOut).toFixed(5);
        }
    }
    if (this.isModified('weightOut')) {
        const { rmaFeeCassiterite } = await Settings.findOne();
        if (this.weightOut && rmaFeeCassiterite) {
            this.rmaFeeRWF = this.weightOut * rmaFeeCassiterite;
        }
    }
    next();
    // formula = ((LME * Grade/100) - TC)/1000
})

cassiteriteSchema.statics.findCurrentStock = async function () {
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

module.exports = mongoose.model('Cassiterite', cassiteriteSchema);
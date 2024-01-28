const mongoose = require('mongoose');
const { lotSchema, entrySchema } = require('../models/entryModel');

const lithiumLotSchema = lotSchema.clone();
lithiumLotSchema.remove('rmaFeeDecision');
lithiumLotSchema.add(
    {
        rmaFeeDecision: {
            type: String,
            default: "exempted"
        }
    }
)

const lithiumSchema = entrySchema.clone();
lithiumSchema.remove(["mineTags", "negociantTags", "numberOfTags"]);
lithiumSchema.add(
    {
        output: {
            type: [lithiumLotSchema],
            default: []
        }
    }
)

// const lithiumSchema = new mongoose.Schema(
//     {
//         // supplierId: {
//         //     type: mongoose.Schema.Types.ObjectId,
//         //     default: null
//         // },
//         // companyName: String,
//         // phoneNumber: String,
//         // supplyDate: {
//         //     type: Date
//         // },
//         // time: {
//         //     type: String
//         // },
//         mineralType: {
//             type: String,
//             default: "lithium",
//         },
//         // weightIn: Number,
//         // weightOut: {
//         //     type: Number,
//         //     validate: {
//         //         validator: function (val) {
//         //             if (val && this.weightIn) {
//         //                 return val <= this.weightIn;
//         //             }
//         //         },
//         //         message: "Weight out must be less than or equal to weight in."
//         //     }
//         // },
//         // mineralPrice: {
//         //     type: Number
//         // },
//         name: {
//             type: String,
//             default: "lithium",
//             immutable: true
//         },
//         mineralGrade: Number,
//         output: {
//             type: [lithiumLotSchema],
//             default: []
//         },
//         // sampleIdentification: {
//         //     type: String,
//         //     default: null
//         // },
//         // exportedAmount: {
//         //     type: Number,
//         //     validate: {
//         //         validator: function (val) {
//         //             if (val && this.weightOut) {
//         //                 return val <= this.weightOut;
//         //             }
//         //         },
//         //         message: "Exported amount must be less than or equal to weight out."
//         //     }
//         // },
//         // cumulativeAmount: {
//         //     type: Number,
//         //     validate: {
//         //         validator: function (val) {
//         //             if (val && this.weightOut) {
//         //                 return val <= this.weightOut;
//         //             }
//         //         },
//         //         message: "Balance amount must be less than or equal to weight out."
//         //     }
//         // },
//         // paid: Number,
//         // unpaid: Number,
//         // status: String,
//         // settled: Boolean,
//         // pricePerUnit: Number,
//         // nonSellAgreement: {
//         //     weight: {
//         //         type: Number,
//         //         validate: {
//         //             validator: function (val) {
//         //                 if (val && this.weightOut) {
//         //                     return val <= this.weightOut;
//         //                 }
//         //             },
//         //             message: "Non sell agreement must be less than or equal to weight out."
//         //         },
//         //         default: 0
//         //     },
//         //     date:  {
//         //         type: Date,
//         //         default: null
//         //     }
//         // },
//         // rmaFee: {
//         //     type: Number,
//         //     default: 0,
//         //     immutable: true
//         // },
//         // gradeImg: {
//         //     filename: String,
//         //     createdAt: Date,
//         //     filePath: String,
//         //     fileId: String
//         // },
//         // shipmentsHistory: {
//         //     type: [
//         //         {
//         //             shipmentNumber: String,
//         //             weight: Number,
//         //             date: {
//         //                 type: Date,
//         //                 default: null
//         //             }
//         //         }
//         //     ]
//         // },
//         // rmaFeeDecision: {
//         //     type: String,
//         //     default: "exempted"
//         // },
//         // paymentHistory: {
//         //     type: [
//         //         {
//         //             paymentId: mongoose.Schema.Types.ObjectId,
//         //             beneficiary: {
//         //                 type: String,
//         //                 default: null
//         //             },
//         //             nationalId: {
//         //                 type: String,
//         //                 default: null
//         //             },
//         //             phoneNumber:  {
//         //                 type: String,
//         //                 default: null
//         //             },
//         //             location: {
//         //                 type: String,
//         //                 default: null
//         //             },
//         //             currency:  {
//         //                 type: String,
//         //                 default: null
//         //             },
//         //             paymentDate: {
//         //                 type: Date,
//         //                 default: null
//         //             },
//         //             paymentAmount: {
//         //                 type: Number,
//         //                 default: null
//         //             }
//         //         }
//         //     ],
//         //     default: []
//         // },
//         comment: {
//             type: String,
//             default: null
//         }
//     },
//     {
//         timestamps: true,
//         toJSON: {virtuals: true},
//         toObject: {virtuals: true}
//     }
// )

lithiumLotSchema.pre('save', async function (next) {
    const { decidePricingGrade } = require("../utils/helperFunctions");
    const Settings = require('../models/settingsModel');
    if (this.isModified(['pricingGrade', 'pricePerUnit', 'weightOut']) && !this.isNew) {
        if (this[decidePricingGrade(this.pricingGrade)] && this.weightOut) {
            this.mineralPrice = (this.pricePerUnit * this.weightOut).toFixed(5);
        }
    }
    if (this.isModified('weightOut')) {
        const { rmaFeeLithium } = await Settings.findOne();
        this.rmaFeeRWF = this.weightOut * rmaFeeLithium ? rmaFeeLithium : 0;
    }
    next();
})

lithiumSchema.statics.findCurrentStock = async function () {
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


module.exports = mongoose.model('Lithium', lithiumSchema);

// gross, net, company name, license number, company representative, representative ID number,
//     representative phone number, date, type of minerals (cassiterite, coltan, wolframite, berylium,
//     lithium, mixed minerals), number of mine tags

const mongoose = require('mongoose');


const entrySchema = new mongoose.Schema(
    {
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
            // required: [true, "Please you must select supplier"]
        },
        mineralType: {
            type: String,
            default: null
        },
        companyName: {
            type: String,
            required: [true, "Please provide company name"]
        },
        licenseNumber: {
            type: String,
            default: null
        },
        TINNumber: {
            type: String,
            default: null
        },
        companyRepresentative: {
            type: String,
            default: null
            // required: [true, "Please provide company representative"]
        },
        beneficiary: {
            type: String,
            default: null
        },
        mineTags: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Tag"
                }
            ],
            default: []
        },
        negociantTags: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Tag"
                }
            ],
            default: []
        },
        numberOfTags: {
            type: Number,
            default: null
        },
        weightIn: {
            type: Number,
            default: null
        },
        // representativeId: {
        //     type: String,
        //     immutable: true,
        // },
        representativePhoneNumber: {
            type: String
        },
        supplyDate: {
            type: Date
        },
        time: {
            type: String
        },
        comment: {
            type: String,
            default: null
        },
        visible: {
            type: Boolean,
            default: true
        }
    },{
        timestamps: true,
        toJSON: {virtuals: true},
        toObject: {virtuals: true}
    }
)


const lotSchema = new mongoose.Schema(
    {
        lotNumber: {
            type: Number,
            required: [true, "Please provide lot number"],
        },
        weightOut: {
            type: Number,
            required: [true, "Please provide weight out"],
        },
        mineralGrade: {
            type: Number,
            default: null
        },
        mineralPrice: {
            type: Number,
            default: null
        },
        ASIR: {
            type: Number,
            default: null
        },
        pricingGrade: {
            type: String,
            default: function () {
                if (this.ASIR) {
                    return "ASIR"
                } else {
                    return null;
                }
            }
        },
        // netPrice: {
        //     type: Number,
        //     default: null
        // },
        sampleIdentification: {
            type: String,
            default: null
        },
        // exportedAmount: {
        //     type: Number,
        //     validate: {
        //         validator: function (val) {
        //             if (val && this.weightOut) {
        //                 return val <= this.weightOut;
        //             }
        //         },
        //         message: "Exported amount must be less than or equal to weight out."
        //     }
        // },
        // cumulativeAmount: {
        //     type: Number,
        //     validate: {
        //         validator: function (val) {
        //             if (val && this.weightOut) {
        //                 return val <= this.weightOut;
        //             }
        //         },
        //         message: "Balance amount must be less than or equal to weight out."
        //     }
        // },
        rmaFeeRWF: {
            type: Number,
            default: null
        },
        USDRate: {
            type: Number,
            default: null
        },
        // rmaFeeUSD: {
        //     type: Number,
        //     default: null
        // },
        rmaFeeDecision: {
            type: String,
            default: "pending"
        },
        // paid: Number,
        // unpaid: {
        //     type: Number,
        // },
        // settled: {
        //     type: Boolean,
        //     default: false
        // },
        pricePerUnit: {
            type: Number,
            default: null
        },
        nonSellAgreement: {
            weight: {
                type: Number,
                validate: {
                    validator: function (val) {
                        if (val && this.weightOut) {
                            return val <= this.weightOut;
                        }
                    },
                    message: "Non sell agreement must be less than or equal to weight out."
                },
                default: 0
            },
            date: {
                type: Date,
                default: null
            }
        },
        gradeImg: {
            filename: {
                type: String,
                default: null
            },
            createdAt: {
                type: Date,
                default: null
            },
            filePath: {
                type: String,
                default: null
            },
            fileId: {
                type: String,
                default: null
            }
        },
        shipmentHistory: {
            type: [
                {
                    shipmentNumber: String,
                    weight: Number,
                    date: {
                        type: Date,
                        default: null
                    }
                }
            ],
            default: []
        },
        // status: {
        //     type: String,
        //     default: "in stock"
        // },
        paymentHistory: {
            type: [
                {
                    paymentId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Payment"
                    },
                    paymentAmount: Number,
                    paymentDate: Date,
                    paymentMode: String,
                    beneficiary: String,
                    currency: {
                        type: String,
                        default: "USD"
                    },
                    phoneNumber: {
                        type: String,
                        default: null
                    },
                    location: {
                        type: String,
                        default: null
                    }
                }
            ],
            default: []
        },
        comment: {
            type: String,
            default: null
        }
    }, {
        toJSON: {virtuals: true},
        toObject: {virtuals: true}
    }
)


entrySchema.pre('save', async function (next) {
    const { handleChangeSupplier } = require('../utils/helperFunctions');
    if (this.isModified('supplierId') && !this.isNew) {
        await handleChangeSupplier(this, next);
    }
})

lotSchema.virtual('paid').get(function () {
    if (!this.paymentHistory.length) return 0;
    return this.paymentHistory.reduce((acc, curr) => {
        if (curr.paymentAmount) {
            return acc + curr.paymentAmount;
        } else {
            return acc;
        }
    }, 0);

})

lotSchema.virtual('rmaFeeUSD').get(function () {
    if (this.rmaFeeRWF && this.USDRate) {
        return (this.rmaFeeRWF / this.USDRate).toFixed(5);
    } else {
        return null;
    }

})

lotSchema.virtual('netPrice').get(function () {
    if (this.mineralPrice && this.rmaFeeUSD) {
        return (this.mineralPrice - parseFloat(this.rmaFeeUSD)).toFixed(5);
    } else {
        return null;
    }

})
lotSchema.virtual('unpaid').get(function () {
    if (!this.netPrice) return null;
    return (parseFloat(this.netPrice) - parseFloat(this.paid)).toFixed(5);

})
lotSchema.virtual('exportedAmount').get(function () {
    if (!this.shipmentHistory.length) return 0;
    return this.shipmentHistory.reduce((acc, curr) => {
        return acc + curr.weight;
    }, 0);
})
lotSchema.virtual('cumulativeAmount').get(function () {
    if (this.nonSellAgreement.weight > 0) return 0;
    if (!this.shipmentHistory.length) return this.weightOut;
    return this.weightOut - this.exportedAmount;
})
lotSchema.virtual('status').get(function () {
    if (this.nonSellAgreement.weight > 0) {
        return "non-sell agreement";
    } else if (this.cumulativeAmount > 0) {
        return "in stock";
    } else if (this.shipmentHistory.length > 0 && this.cumulativeAmount === 0) {
        return "sold out";
    }
})
lotSchema.virtual('settled').get(function () {
    if (!this.netPrice) return false;
    if (this.unpaid === 0 || this.paid === this.netPrice) return true;

})


// TODO 25: HOW TO CALCULATE RMA FEE RWF
// lotSchema.virtual('rmaFeeRWF').get(function () {
//     if (!this.weightOut) return null;
// })

exports.lotSchema = lotSchema;
exports.entrySchema = entrySchema;


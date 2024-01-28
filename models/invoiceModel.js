const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
    {
        supplierId: {
            type: mongoose.Schema.Types.ObjectId
        },
        invoiceNo: {
            type: String,
            unique: true,
            required: [true, "Please provide invoice number"]
        },
        dateOfIssue: {
            type: Date,
            default: null
        },
        items: {
            type: [
                {
                    itemName: {
                        type: String,
                        default: null
                    },
                    entryId: {
                        type: mongoose.Schema.Types.ObjectId,
                        default: null
                    },
                    quantity: {
                        type: Number,
                        default: null
                    },
                    mineralType: {
                        type: String,
                    },
                    rmaFeeUSD: {
                        type: Number
                    },
                    lotNumber: {
                        type: Number
                    },
                    supplyDate: {
                        type: Date
                    },
                    pricePerUnit: {
                        type: Number,
                        default: null
                    },
                    concentration: {
                        type: Number,
                        default: null
                    },
                    amount: {
                        type: Number,
                        default: null
                    }
                }
            ],
            required: [true, "Please add items to this invoice"],
            default: []
        },
        beneficiary: {
            type: String,
            required: [true, "Please provide beneficiary's name"]
        },
        supplierCompanyName: {
            type: String
        },
        supplierAddress: {
            province: String,
            district: String,
            sector: String,
        },
        // processorEmail: {
        //     type: String,
        //     default: null
        // },
        // supplierEmail: {
        //     type: String,
        //     default: null
        // },
        processorCompanyName: {
            type: String,
            default: null
        },
        mineralsSupplied: {
            type: [String],
            default: []
        },
        extraNotes: {
            type: String,
            default: ""
        },
        paymentId: {
            type: mongoose.Schema.Types.ObjectId
        },
        invoiceFile: {
            fileId: {
                type: String,
                default: null
            },
            url: {
                type: String,
                default: null
            }
        }
    },
    {
        timestamps: true,
        toJSON: {virtuals: true},
        toObject: {virtuals: true}
    }
)

invoiceSchema.virtual('total').get(function () {
    let totalAmount = 0;
    if (this.items) {
        for (const { amount } of this.items) {
            totalAmount += amount;
        }
    }
    return totalAmount;
})


module.exports = mongoose.model('Invoice', invoiceSchema);
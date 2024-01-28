const mongoose = require('mongoose');
const isEmail = require('validator/lib/isEmail');
const AppError = require('../utils/appError');
const { handleConvertToUSD } = require('../utils/helperFunctions');

const advancePaymentSchema = new mongoose.Schema(
    {
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        companyName: {
            type: String,
        },
        beneficiary: {
            type: String,
            required: [true, "Please provide beneficiary's name"]
        },
        nationalId: {
            type: String,
        },
        phoneNumber: {
            type: String,
        },
        location: {
            province: String,
            district: String,
            sector: String,
            cell: String,
        },
        email: {
            type: String,
            validate: [isEmail, "Please provide valid email address"]
        },
        paymentAmount: {
            type: Number,
            validate: {
                validator: (value) => {
                    return value >= 0;
                },
                message: "Payment Amount can't be negative number"
            },
            required: [true, "Please provide payment amount"]
        },
        currency: {
            type: String,
            enum: ["RWF", "USD"],
            default: "USD"
        },
        paymentDate: {
            type: Date,
        },
        remainingAmount: {
            type: Number,
        },
        USDRate: {
            type: Number,
            default: null
        },
        contractName: String,
        consumed: {
            type: Boolean,
            default: false
        },
        consumptionDetails: {
            type: [
                {
                    date: Date,
                    action: String
                }
            ],
            default: []
        },
        message: String,
        comment: String,
        paymentMode: {
            type: String,
            default: null
        },
        sfdt: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
)

advancePaymentSchema.pre('save', async function (next) {
    if (this.isModified('remainingAmount') && !this.isNew) {
        this.consumptionDetails.push(
            {
                date: (new Date()).toDateString(),
                comment: this.comment
            }
        )
        if (this.remainingAmount === 0) {
            this.consumed = true;
        }
    }
    if (this.comment) {
        this.comment = undefined;
    }
    if (this.isNew) {
        if (this.currency === "RWF") {
            this.paymentAmount = handleConvertToUSD(this.paymentAmount, this.USDRate);
            this.remainingAmount = this.paymentAmount;
        } else {
            this.remainingAmount = this.paymentAmount;
        }
    }
    next();
})

module.exports = mongoose.model('AdvancePayment', advancePaymentSchema);
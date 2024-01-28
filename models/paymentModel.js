const mongoose = require('mongoose');
const isEmail = require('validator/lib/isEmail');
const AdvancePayment = require('../models/advancePaymentModel');
const AppError = require('../utils/appError');
const { getModel } = require('../utils/helperFunctions');


const paymentSchema = new mongoose.Schema(
    {
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            rel: 'Supplier'
        },
        entryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Entry'
        },
        lotNumber: Number,
        companyName: {
            type: String,
        },
        beneficiary: {
            type: String
        },
        nationalId: {
            type: String,
            // required: [true, "Please provide representative's national Id"]
        },
        licenseNumber: {
            type: String
        },
        phoneNumber: {
            type: String,
            // required: [true, "Please provide representative phone number"]
        },
        TINNumber: {
            type: String
        },
        email: {
            type: String,
            validate: [isEmail, 'Please provide valid email address']
        },
        location: {
            type: String
        },
        paymentAmount: {
            type: Number,
        },
        currency: {
            type: String,
            enum: ['RWF', 'USD'],
            default: () => 'USD'
        },
        paymentDate: {
            type: Date
        },
        paymentInAdvanceId: {
            type: mongoose.Schema.Types.ObjectId,
            rel: 'Payment'
        },
        model: String,
        paymentMode: {
            type: String,
            default: null
        }
    },
    {timestamps: true}
)

// paymentSchema.pre('save', async function (next) {
//     const { getModel } = require('../utils/helperFunctions');
//     const Entry = getModel(this.model);
//     const entry = await Entry.findById(this.entryId);
//     if (this.paymentInAdvanceId) {
//         const payment = await AdvancePayment.findById(this.paymentInAdvanceId);
//         if (payment) {
//             this.supplierId = payment.supplierId;
//             this.companyName = payment.companyName;
//             this.licenseNumber = payment.licenseNumber;
//             this.TINNumber = payment.TINNumber;
//             this.nationalId = payment.nationalId;
//             this.email = payment.email;
//         }
//     } else {
//         this.supplierId = entry.supplierId;
//         this.companyName = entry.companyName;
//         this.licenseNumber = entry.licenseNumber;
//         this.TINNumber = entry.TINNumber;
//         // TODO 20: CHECK AGAIN NATIONALID
//         this.nationalId = entry.representativeId;
//         this.email = entry.email;
//     }
//     next();
// })


paymentSchema.pre('save', async function (next) {
    const { getModel } = require('../utils/helperFunctions');
    if (this.isNew) {
        const Entry = getModel(this.model);
        const entry = await Entry.findById(this.entryId);
        const lot = entry?.output?.find(lot => parseInt(lot.lotNumber) === parseInt(this.lotNumber));
        if (lot.settled === true) return next(new AppError("This lot is already paid", 400));
        if (this.paymentInAdvanceId) {
            const payment = await AdvancePayment.findById(this.paymentInAdvanceId);
            if (!payment.consumed) {
                if (payment.remainingAmount >= lot.mineralPrice) {
                    lot.rmaFeeDecision = "pending";
                    payment.remainingAmount -= lot.mineralPrice;
                    // TODO 12: FIND APPROPRIATE COMMENT.
                    payment.consumptionDetails.push(
                        {
                            date: (new Date()).toDateString(),
                            comment: `Deducted ${lot.rmaFeeUSD} for paying Rwanda Mining Association fee.`
                        }
                    )
                    payment.consumptionDetails.push(
                        {
                            date: (new Date()).toDateString(),
                            comment: `Deducted ${lot.netPrice} for paying mineral price of ${this.lotNumber} of minerals supplied on ${entry.supplyDate}.`
                        }
                    )
                    // TODO 14: A. NORMALIZE ADVANCE PAYMENT TO MATCH. -> DONE
                    const {beneficiary, phoneNumber, location, currency} = payment;
                    lot.paymentHistory.push(
                        {
                            paymentId: this._id,
                            beneficiary,
                            phoneNumber,
                            location: location?.district,
                            paymentAmount: payment.paymentAmount - payment.remainingAmount,
                            paymentDate: new Date(),
                            currency,
                            paymentMode: payment.paymentMode
                        }
                    );
                } else {
                    if (payment.remainingAmount >= lot.rmaFeeUSD) {
                        lot.rmaFeeDecision = "pending";
                        // TODO 14: B. NORMALIZE ADVANCE PAYMENT TO MATCH. -> DONE
                        payment.remainingAmount -= (payment.remainingAmount - lot.rmaFeeUSD);
                        const {beneficiary, phoneNumber, location, currency} = payment;
                        lot.paymentHistory.push(
                            {
                                paymentId: this._id,
                                beneficiary,
                                phoneNumber,
                                location: location?.district,
                                paymentAmount: payment.remainingAmount,
                                paymentDate: new Date(),
                                currency,
                                paymentMode: payment.paymentMode
                            }
                        );
                    }
                    // else {
                        // lot.rmaFeeDecision = "pending";
                        // // TODO 14: C. NORMALIZE ADVANCE PAYMENT TO MATCH. -> DONE
                        // payment.remainingAmount = 0;
                        // const {beneficiary, phoneNumber, location, currency} = payment;
                        // lot.paymentHistory.push(
                        //     {
                        //         paymentId: this._id,
                        //         beneficiary,
                        //         phoneNumber,
                        //         location: location?.district,
                        //         paymentAmount: payment.remainingAmount,
                        //         paymentDate: new Date(),
                        //         currency,
                        //         paymentMode: payment.paymentMode
                        //     }
                        // );
                    // }
                }
            }
            await payment.save({validateModifiedOnly: true});
        } else {
            const self = this;
            const { beneficiary, phoneNumber, location, currency } = self;
            const singlePayment = {
                paymentId: this._id,
                beneficiary,
                phoneNumber,
                location,
                currency,
                paymentDate: this.paymentDate,
                paymentAmount: this.paymentAmount,
                paymentMode: this.paymentMode
            }
            if (parseInt(lot.paid) >= parseInt(lot.netPrice)) return next(new AppError("This lot is already paid", 400));
            if (parseInt(lot.paid) + parseInt(this.paymentAmount) > parseInt(lot.netPrice)) return next(new AppError("Payment amount exceeds the net price of this lot", 400));
            // lot.paid += this.paymentAmount;
            // lot.unpaid -= this.paymentAmount;
            lot.paymentHistory.push(singlePayment);
        }
        await entry.save({validateModifiedOnly: true});
        if (["lithium", "beryllium"].includes(this.model)) {
            const entry = await Entry.findById(this.entryId);
            if (entry.settled) return next(new AppError("This entry is already paid", 400));
            if (this.paymentInAdvanceId) {
                const payment = await AdvancePayment.findById(this.paymentInAdvanceId);
                if (!payment.consumed) {
                    if (payment.remainingAmount >= entry.mineralPrice) {
                        entry.paid += entry.mineralPrice;
                        entry.unpaid -= entry.mineralPrice;
                        entry.settled = true;
                        payment.remainingAmount -= entry.mineralPrice;
                        payment.consumptionDetails.push(
                            {
                                date: (new Date()).toDateString(),
                                comment: `Deducted ${entry.mineralPrice} for paying mineral price of ${this.entryId} of minerals supplied on ${entry.supplyDate}.`
                            }
                        )
                        const { beneficiary, nationalId, phoneNumber, location, email, currency } = payment;
                        entry.paymentHistory.push(
                            {
                                paymentId: this._id,
                                beneficiary,
                                nationalId,
                                phoneNumber,
                                location: location?.district,
                                email,
                                currency,
                                paymentDate: new Date(),
                                paymentAmount: payment.paymentAmount - payment.remainingAmount,
                                paymentMode: this.paymentMode,
                            }
                        )
                    }
                    await payment.save({validateModifiedOnly: true});
                }
            } else {
                entry.paid += this.paymentAmount;
                entry.unpaid -= this.paymentAmount;
                const self = this;
                const { beneficiary, nationalId, phoneNumber, location, email, currency } = self;
                entry.paymentHistory.push(
                    {
                        paymentId: this._id,
                        beneficiary,
                        nationalId,
                        phoneNumber,
                        location,
                        email,
                        currency,
                        paymentDate: new Date(),
                        paymentAmount: this.paymentAmount,
                        paymentMode: this.paymentMode
                    }
                );
            }
            await entry.save({validateModifiedOnly: true});
        }
    }
    this.model = undefined;
    next();
})


module.exports = mongoose.model('Payment', paymentSchema);

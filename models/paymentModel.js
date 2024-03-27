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
        },
        supportingDoc: {
            fileId: String,
            filePath: String
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
        if (entry.settled) return next(new AppError("This Entry is already paid!", 400));
        if (entry) entry.paymentHistory.push(this._id);
        await entry.save({validateModifiedOnly: true});
    }
    this.model = undefined;
    next();
})


module.exports = mongoose.model('Payment', paymentSchema);

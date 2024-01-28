const Payment = require('../models/paymentModel');
const AdvancePayment = require('../models/advancePaymentModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {getModel} = require("../utils/helperFunctions");

exports.getAllPayments = catchAsync(async (req, res, next) => {
    const payments = await Payment.find();
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    payments
                }
            }
        )
    ;
})

exports.getOnePayment = catchAsync(async (req, res, next) => {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return next(new AppError("Something went wrong, please try again", 400));
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    payment
                }
            }
        )
    ;
})

exports.addPayment = catchAsync(async (req, res, next) => {
    const payment = new Payment(
        {
            entryId: req.body.entryId,
            lotNumber: req.body.lotNumber,
            beneficiary: req.body.beneficiary,
            phoneNumber: req.body.phoneNumber,
            location: req.body.location,
            paymentAmount: req.body.paymentAmount,
            paymentDate: req.body.paymentDate,
            paymentInAdvanceId: req.body.paymentInAdvanceId,
            model: req.body.model,
            paymentMode: req.body.paymentMode
        }
    )
    if (req.body.paymentInAdvanceId) {
        const advancePayment = await AdvancePayment.findById(req.body.paymentInAdvanceId);
        if (advancePayment) {
            payment.supplierId = advancePayment.supplierId;
            payment.companyName = advancePayment.companyName;
            payment.licenseNumber = advancePayment.licenseNumber;
            payment.TINNumber = advancePayment.TINNumber;
            payment.nationalId = advancePayment.nationalId;
            payment.email = advancePayment.email;
        }
    } else {
        const { getModel } = require('../utils/helperFunctions');
        const Entry = getModel(req.body.model);
        const entry = await Entry.findById(req.body.entryId);
        payment.supplierId = entry.supplierId;
        payment.companyName = entry.companyName;
        payment.licenseNumber = entry.licenseNumber;
        payment.TINNumber = entry.TINNumber;
        // TODO 20: CHECK AGAIN NATIONALID
        // payment.nationalId = entry.representativeId;
        payment.email = entry.email;
    }
    await payment.save({validateModifiedOnly: true});

    // await Payment.create(
    //     {
    //         // supplierId: req.body.supplierId,
    //         // supplierName: req.body.supplierName,
    //         entryId: req.body.entryId,
    //         lotNumber: req.body.lotNumber,
    //         beneficiary: req.body.beneficiary,
    //         // nationalId: req.body.nationalId,
    //         // licenseNumber: req.body.licenseNumber,
    //         phoneNumber: req.body.phoneNumber,
    //         // TINNumber: req.body.TINNumber,
    //         // email: req.body.email,
    //         location: req.body.location,
    //         paymentAmount: req.body.paymentAmount,
    //         currency: req.body.currency,
    //         paymentDate: req.body.paymentDate,
    //         paymentInAdvanceId: req.body.paymentInAdvanceId,
    //         model: req.body.model
    //     }
    // )
    res
        .status(201)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.updatePayment = catchAsync(async (req, res, next) => {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return next(new AppError("Selected Payment does not exists!", 400));
    const Entry = getModel(req.params.model);
    const entry = await Entry.findById(payment.entryId);
    if (entry) {
        entry.output?.map(lot => {
            if (parseInt(lot.lotNumber) === parseInt(payment.lotNumber)) {
                if (req.body.paymentAmount) {
                    if (parseFloat(req.body.paymentAmount) !== parseFloat(payment.paymentAmount)) {
                        if (parseFloat(req.body.paymentAmount) > parseFloat(payment.paymentAmount)) {
                            lot.paid += (parseFloat(req.body.paymentAmount) - parseFloat(payment.paymentAmount));
                            lot.unpaid -= (parseFloat(req.body.paymentAmount) - parseFloat(payment.paymentAmount));
                        } else if (parseFloat(req.body.paymentAmount) < parseFloat(payment.paymentAmount)) {
                            lot.paid -= (parseFloat(payment.paymentAmount) - parseFloat(req.body.paymentAmount));
                            lot.unpaid += (parseFloat(payment.paymentAmount) - parseFloat(req.body.paymentAmount));
                        }
                    }
                }
                lot.paymentHistory?.map(pment => {
                    if (pment.paymentId.equals(req.params.paymentId)) {
                        if (req.body.paymentAmount) {
                            payment.paymentAmount = req.body.paymentAmount;
                            pment.paymentAmount = req.body.paymentAmount;
                        }
                        if (req.body.paymentMode) {
                            payment.paymentMode = req.body.paymentMode;
                            pment.paymentMode = req.body.paymentMode;
                        }
                        if (req.body.paymentDate) {
                            payment.paymentDate = req.body.paymentDate;
                            pment.paymentDate = req.body.paymentDate;
                        }
                        if (req.body.beneficiary) {
                            payment.beneficiary = req.body.beneficiary;
                            pment.beneficiary = req.body.beneficiary;
                        }
                        if (req.body.phoneNumber) {
                            payment.phoneNumber = req.body.phoneNumber;
                            pment.phoneNumber = req.body.phoneNumber;
                        }
                        if (req.body.location) {
                            payment.location = req.body.location;
                            pment.location = req.body.location;
                        }
                    }
                })

            }
        })
        await entry.save({validateModifiedOnly: true});
        await payment.save({validateModifiedOnly: true});
    }
    res
        .status(201)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

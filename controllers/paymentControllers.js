const fs = require('fs');
const Payment = require('../models/paymentModel');
const AdvancePayment = require('../models/advancePaymentModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {getModel} = require("../utils/helperFunctions");
const multer = require("multer");
const path = require("path");
const imagekit = require('../utils/imagekit');

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
            beneficiary: req.body.beneficiary,
            phoneNumber: req.body.phoneNumber,
            location: req.body.location,
            paymentAmount: req.body.paymentAmount,
            paymentDate: req.body.paymentDate,
            paymentInAdvanceId: req.body.paymentInAdvanceId,
            model: req.body.model,
            paymentMode: req.body.paymentMode,
            currency: req.body.currency
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
    // if (req.file) {
    //     const data = fs.readFileSync(req.file.path);
    //     const response = await imagekit.upload(
    //         {
    //             file: data,
    //             fileName: `${req.body.beneficiary}_${req.body.paymentAmount}_${req.file.filename}`,
    //             folder: "payment-supporting-documents"
    //         }
    //     )
    //     if (response) {
    //         payment.supportingDoc.fileId = response.fileId;
    //         payment.supportingDoc.filePath = response.url;
    //     }
    // }
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

    if (req.file) {
        const data = fs.readFileSync(req.file.path);
        const response = await imagekit.upload(
            {
                file: data,
                fileName: `${payment.beneficiary}_${payment.paymentAmount}_${req.file.filename}`,
                folder: "payment-supporting-documents"
            }
        )
        if (response) {
            payment.supportingDoc.fileId = response.fileId;
            payment.supportingDoc.filePath = response.url;

        }
    }

    if (req.body.paymentAmount) {
        payment.paymentAmount = req.body.paymentAmount;
    }
    if (req.body.paymentMode) {
        payment.paymentMode = req.body.paymentMode;
    }
    if (req.body.paymentDate) {
        payment.paymentDate = req.body.paymentDate;
    }
    if (req.body.beneficiary) {
        payment.beneficiary = req.body.beneficiary;
    }
    if (req.body.phoneNumber) {
        payment.phoneNumber = req.body.phoneNumber;
    }
    if (req.body.location) {
        payment.location = req.body.location;
    }
    await payment.save({validateModifiedOnly: true});
    res
        .status(201)
        .json(
            {
                status: "Success"
            }
        )
    ;
})


const multerStorage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, `${__dirname}/../public/data/temp`);
        },
        filename: function (req, file, cb) {
            // const fileExtension = path.extname(file.originalname);
            // const filePath = `${__dirname}/../public/data/shipment/${req.params.shipmentId}/${file.originalname}`;
            cb(null, file.originalname);
        }
    }
)

const multerFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const allowExtension = ['.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx'];
    if (allowExtension.includes(fileExtension.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new AppError("Invalid File format. Please upload picture, document or pdf!", 400), false);
    }
}

const upload = multer(
    {
        storage: multerStorage,
        fileFilter: multerFilter
    }
)

exports.uploadPaymentSupportingDoc = upload;
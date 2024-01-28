const path = require('path');
const multer = require("multer");
const fs = require('fs');
const AdvancePayment = require('../models/advancePaymentModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const axios = require("axios");
const { trackUpdateModifications, trackCreateOperations } = require('../controllers/activityLogsControllers');

exports.getAllAdvancePayments = catchAsync(async (req, res, next) => {
    const payments = await AdvancePayment.find();
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

exports.addAdvancePayment = catchAsync(async (req, res, next) => {
    const log = trackCreateOperations("payment", req);
    let sfdt
    if (req.file) {
        const buffer = fs.readFileSync(req.file.path);
        const formData = new FormData();
        formData.append('file', new Blob([buffer]), {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // Set the content type for DOCX
        });
        const response = await axios.post('https://services.syncfusion.com/react/production/api/documenteditor/Import', formData, {
            headers: {
                filename: 'file.docx', // Specify the desired file name
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // Set the content type for DOCX
            } // Set the appropriate headers for FormData
        });
        if (response.data) {
            sfdt = response.data;
        }
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.error(err);
            }
        });
            // .then((response) => {
            //     res
            //         .status(200)
            //         .json(
            //             {
            //                 status: "Success",
            //                 sfdt: response.data,
            //             }
            //         )
            //     ;
            // })
            // .catch((error) => {
            //     return next(new AppError(error.message, 400));
            //     // console.error('Error:', error.message); // Handle any errors
            // });
    }
    const payment = await AdvancePayment.create(
        {
            companyName: req.body.companyName,
            supplierId: req.body.supplierId ? req.body.supplierId : null,
            beneficiary: req.body.beneficiary,
            nationalId: req.body.nationalId,
            phoneNumber: req.body.phoneNumber,
            email: req.body.email,
            paymentAmount: req.body.paymentAmount,
            currency: req.body.currency,
            location: JSON.parse(req.body.location),
            paymentDate: req.body.paymentDate?.split('T')[0],
            USDRate: req.body.USDRate,
            paymentMode: req.body.paymentMode,
            sfdt: JSON.stringify(sfdt),
            // contractName: req.file.filename,
            // message: req.body.message,
        }
    )
    if (!payment) {
        log.status = "failed";
    }
    await log.save({validateBeforeSave: false});
    res
        .status(202)
        .json(
            {
                status: "Success",
            }
        )
    ;
})

exports.getOneAdvancePayment = catchAsync(async (req, res, next) => {
    const payment = await AdvancePayment.findById(req.params.paymentId);
    if (!payment) return next(new AppError("The Selected payment no longer exists!", 400));
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

exports.updateAdvancePayment = catchAsync(async (req, res, next) => {
    const payment = await AdvancePayment.findById(req.params.paymentId);
    if (!payment) return next(AppError("Advanced payment was not found, please try again", 400));
    let sfdt;
    if (req.file) {
        const buffer = fs.readFileSync(req.file.path);
        const formData = new FormData();
        formData.append('file', new Blob([buffer]), {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // Set the content type for DOCX
        });
        const response = await axios.post('https://services.syncfusion.com/react/production/api/documenteditor/Import', formData, {
            headers: {
                filename: 'file.docx', // Specify the desired file name
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // Set the content type for DOCX
            } // Set the appropriate headers for FormData
        });
        if (response.data) {
            sfdt = response.data;
            payment.sfdt = JSON.stringify(response.data);
            await payment.save({validateBeforeSave: true})
        }
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.error(err);
            }
        });
    }
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    sfdt
                }
            }
        )
    ;
})

exports.getAdvancePaymentsForSupplier = catchAsync(async (req, res, next) => {
    let payments;
    if (req.params.supplierId) {
        payments = await AdvancePayment.find({supplierId: req.params.supplierId, consumed: false});
    } else {
        payments = await AdvancePayment.find({consumed: false, supplierId: null});
    }
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
    cb(null, true);
}

const upload = multer(
    {
        storage: multerStorage,
        fileFilter: multerFilter
    }
)

exports.uploadContract = upload;
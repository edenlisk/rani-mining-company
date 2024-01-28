const fs = require("fs");
const path = require('path');
const multer = require('multer');
const DueDiligence = require('../models/dueDiligenceModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendAttachment } = require('../utils/helperFunctions');

exports.getAllDueDiligenceDocuments = catchAsync(async (req, res, next) => {
    const documents = await DueDiligence.find();
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    documents
                }
            }
        )
    ;
})

exports.downloadDueDiligenceDocument = catchAsync(async (req, res, next) => {
    const document = await DueDiligence.findById(req.params.documentId);
    if (!document) return next(new AppError("The Selected document no longer exists!", 400));
    const fileName = document.name;
    const filePath = `${__dirname}/../public/data/duediligence/${fileName}`;
    if (!fs.existsSync(filePath)) {
        return next(new AppError("File not found", 404));
    }
    // res.download(filePath);
    sendAttachment(filePath, fileName, res);
})

exports.addDueDiligenceDocument = catchAsync(async (req, res, next) => {
    await DueDiligence.create(
        {
            name: req.file.filename,
            buyerId: req.body.buyerId,
            issueDate: req.body.issueDate,
            expiryDate: req.body.expiryDate
        }
    );
    res
        .status(201)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.updateDiligence = catchAsync(async (req, res, next) => {
    const document = await DueDiligence.findById(req.params.documentId);
    if (!document) return next(new AppError("The Selected document no longer exists!", 400));
    if (req.file) document.name = req.file.filename;
    if (req.body.issueDate) document.issueDate = req.body.issueDate;
    if (req.body.expiryDate) document.expiryDate = req.body.expiryDate;
    await document.save({validateModifiedOnly: true});
    res
        .status(202)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.deleteDiligence = catchAsync(async (req, res, next) => {
    const document = await DueDiligence.findByIdAndDelete(req.params.documentId);
    const filePath = `${__dirname}/../public/data/duediligence/${document.name}`;
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, err => {
            if (err) {
                console.log(err);
            }
            console.log('File removed successfully');
        })
    } else {
        return next(new AppError("File not found", 404));
    }
    if (!document) return next(new AppError("This document no longer exists!", 400));
    res
        .status(204)
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
            cb(null, 'public/data/duediligence/');
        },
        filename: function (req, file, cb) {
            const filePath = `${__dirname}/../public/data/duediligence/${file.originalname}`;
            if (fs.existsSync(filePath)) {
                fs.rename(filePath, `${__dirname}/../public/data/duediligence/ex-${file.originalname}`, (err) => {
                    if (err) {
                        console.log(err);
                    }
                    console.log('File renamed successfully');
                });
            }
            cb(null, file.originalname);
        }
    }
)

const multerFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const allowExtension = ['.doc', '.docx', '.pdf'];
    if (allowExtension.includes(fileExtension.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new AppError("Not a .doc, .docx, or .pdf selected", 400), false);
    }
}

const upload = multer(
    {
        storage: multerStorage,
        fileFilter: multerFilter
    }
)

exports.uploadDueDiligence = upload.single('diligence');
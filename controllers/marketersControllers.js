const Marketers = require('../models/marketersModel');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const {readFileSync} = require("fs");
const imagekit = require('../utils/imagekit');



exports.getAllMarketers = catchAsync(async (req, res, next) => {
    const result = new APIFeatures(Marketers.find().populate('Supplier'), req.query);
    const marketers = await result.mongooseQuery;
    const numberOfDocuments = marketers.length;
    const totalPages = Math.ceil(numberOfDocuments / 100);
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    marketers,
                    numberOfDocuments,
                    totalPages
                }
            }
        )
    ;
})


exports.getOneMarketer = catchAsync(async (req, res, next) => {
    const marketer = await Marketers.findById(req.params.marketerId)
        .populate('Supplier');
    if (!marketer) return next(new AppError("The Selected marketer no longer exists!", 400));
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    marketer
                }
            }
        )
    ;
})


exports.addMarketer = catchAsync(async (req, res, next) => {
    const marketer = new Marketers(
        {
            name: req.body.name,
            phoneNumber: req.body.phoneNumber,
            nationalId: req.body.nationalId,
            address: req.body.address,
            supplierIds: req.body.supplierIds
        }
    )
    if (req.file) {
        const data = readFileSync(req.file.path);
        const response = await imagekit.upload(
            {
                file: data,
                fileName: `${req.body.name}_${req.file.filename}`,
                folder: "marketers-supporting-documents"
            }
        )
        if (response) marketer.supportingDoc = { fileId: response.fileId, filePath: response.url };
    }
    await marketer.save({validateModifiedOnly: true});
    res
        .status(202)
        .json(
            {
                status: "Success",
                data: {
                    marketer
                }
            }
        )
    ;
})


exports.updateMarketer = catchAsync(async (req, res, next) => {
    const marketer = await Marketers.findById(req.body.marketerId);
    if (!marketer) return next(new AppError("The Selected marketer no longer exists!", 401));
    if (req.body.name) marketer.name = req.body.name;
    if (req.body.phoneNumber) marketer.phoneNumber = req.body.phoneNumber;
    if (req.body.nationalId) marketer.nationalId = req.body.nationalId;
    if (req.body.supplierIds) marketer.supplierIds = req.body.supplierIds;
    if (req.body.supportingDoc.fileId === "") marketer.supportingDoc.fileId  = "";
    if (req.body.supportingDoc.filePath === "") marketer.supportingDoc.filePath  = "";
    if (req.file) {
        const data = readFileSync(req.file.path);
        const response = await imagekit.upload(
            {
                file: data,
                fileName: `${marketer.name}_${req.file.filename}`,
                folder: "marketers-supporting-documents"
            }
        )
        if (response) marketer.supportingDoc = { fileId: response.fileId, filePath: response.url };
    }
    await marketer.save({validateModifiedOnly: true});
    res
        .status(201)
        .json(
            {
                status: "Success",
                data: {
                    marketer
                }
            }
        )
    ;
})
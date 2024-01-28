const fs = require('fs');
const path = require("path");
const exifreader = require('exifreader');
const multer = require("multer");
const Wolframite = require('../models/wolframiteEntryModel');
const catchAsync = require('../utils/catchAsync');
const Supplier = require('../models/supplierModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const Settings = require('../models/settingsModel');
const {handleConvertToUSD, updateNegociantTags, updateMineTags} = require("../utils/helperFunctions");
const imagekit = require('../utils/imagekit');
const { trackUpdateModifications,
    trackDeleteOperations,
    trackCreateOperations } = require('./activityLogsControllers');


exports.getAllWolframiteEntries = catchAsync(async (req, res, next) => {
    const result = new APIFeatures(Wolframite.find().populate('mineTags').populate('negociantTags'), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()
    ;
    const entries = await result.mongooseQuery;
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    entries
                }
            }
        )
    ;
})

exports.createWolframiteEntry = catchAsync(async (req, res, next) => {
    const entry = await Wolframite.create(
        {
            supplierId: req.body.supplierId,
            companyName: req.body.companyName,
            licenseNumber: req.body.licenseNumber,
            companyRepresentative: req.body.companyRepresentative,
            beneficiary: req.body.companyRepresentative,
            TINNumber: req.body.TINNumber,
            email: req.body.email,
            representativeId: req.body.representativeId,
            representativePhoneNumber: req.body.representativePhoneNumber,
        }
    );
    entry.mineralType = req.body.mineralType;
    entry.numberOfTags = req.body.numberOfTags;
    entry.weightIn = req.body.weightIn;
    if (req.body.comment) entry.comment = req.body.comment;
    entry.supplyDate = req.body.supplyDate;
    entry.time = req.body.time;
    if (req.body.output) {
        for (const lot of req.body.output) {
            entry.output.push(
                {
                    lotNumber: lot.lotNumber,
                    weightOut: lot.weightOut,
                    exportedAmount: 0,
                    cumulativeAmount: lot.weightOut,
                    rmaFee: null,
                    USDRate: null,
                    rmaFeeUSD: null,
                    rmaFeeDecision: "pending",
                    paid: 0,
                    mineralGrade: null,
                    mineralPrice: null,
                    metricTonUnit: null,
                    pricePerUnit: null,
                    unpaid: null,
                    settled: false,
                    netPrice: null,
                    ASIR: null,
                    sampleIdentification: null,
                    // TODO 10: REQUIREMENTS TO CALCULATE WOLFRAMITE PRICES --> DONE
                    status: "in stock"
                }
            )
        }
    }
    const log = trackCreateOperations("wolframite", req);
    log.logSummary = `${req.user?.username} created new wolframite entry for ${entry.companyName} - ${entry.beneficiary}`;
    const result = await entry.save({validateModifiedOnly: true});
    if (!result) {
        log.status = "failed";
    }
    await log?.save({validateBeforeSave: false});
    // io.emit('operation-update', {message: "New Coltan Entry was record"});
    res
        .status(204)
        .json(
            {
                status: "Success",
            }
        )
    ;
})

exports.getOneWolframiteEntry = catchAsync(async (req, res, next) => {
    const entry = await Wolframite.findById(req.params.entryId)
        .populate('mineTags').populate('negociantTags');
    if (!entry) return next(new AppError("This Entry no longer exists!", 400));
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    entry
                }
            }
        )
    ;
})

exports.updateWolframiteEntry = catchAsync(async (req, res, next) => {
    const entry = await Wolframite.findById(req.params.entryId);
    // if (!entry.visible) return next(new AppError("Please restore this entry to update it!", 400));
    if (!entry) return next(new AppError("This Entry no longer exists!", 400));
    const logs = trackUpdateModifications(req.body, entry, req);
    if (req.files) {
        const filePromises = req.files.map(async (file) => {
            const fileData = fs.readFileSync(file.path);
            const response = await imagekit.upload({
                file: fileData,
                fileName: file.originalname,
                folder: `/wolframite`
            });

            if (response) {
                return new Promise((resolve, reject) => {
                    fs.readFile(file.path, (err, data) => {
                        if (err) {
                            reject(new AppError("Error occurred while processing file"));
                        } else {
                            const tags = exifreader.load(data);
                            const imageDate = tags['CreateDate'];
                            const lot = entry.output.find(item => parseInt(item.lotNumber) === parseInt(file.fieldname));
                            lot.gradeImg.filename = response.name;
                            if (logs && logs.modifications) {
                                logs.modifications.push({
                                    fieldName: "gradeImg",
                                    initialValue: `${lot.gradeImg.filePath}--${lot.gradeImg?.createdAt}`,
                                    newValue: `${response.url}--${imageDate ? imageDate.description : null}`,
                                });
                            }
                            lot.gradeImg.filePath = response.url;
                            lot.gradeImg.fileId = response.fileId;
                            if (imageDate) {
                                lot.gradeImg.createdAt = imageDate.description;
                            }
                            resolve();
                        }
                        fs.unlink(file.path, () => {
                            console.log('file deleted successfully from file system');
                        });
                    });
                });
            }
        });
        await Promise.all(filePromises);
    }
    if (req.body.supplierId) entry.supplierId = req.body.supplierId;
    if (req.body.numberOfTags) entry.numberOfTags = req.body.numberOfTags;
    if (req.body.companyName) entry.companyName = req.body.companyName;
    if (req.body.beneficiary) entry.beneficiary = req.body.beneficiary;
    if (req.body.comment) entry.comment = req.body.comment;
    if (req.body.TINNumber) entry.TINNumber = req.body.TINNumber;
    if (req.body.mineTags) await updateMineTags(req.body.mineTags, entry);
    if (req.body.negociantTags) await updateNegociantTags(req.body.negociantTags, entry);
    const { rmaFeeWolframite } = await Settings.findOne();
    if (req.body.output) {
        for (const lot of req.body.output) {
            const existingLot = entry.output.find(value => parseInt(value.lotNumber) === parseInt(lot.lotNumber));
            if (existingLot) {
                if (lot.mineralGrade) existingLot.mineralGrade = parseFloat(lot.mineralGrade);
                if (lot.mineralPrice) existingLot.mineralPrice = parseFloat(lot.mineralPrice);
                if (lot.metricTonUnit) existingLot.metricTonUnit = parseFloat(lot.metricTonUnit);
                if (lot.pricePerUnit) existingLot.pricePerUnit = parseFloat(lot.pricePerUnit);
                if (lot.USDRate) existingLot.USDRate = parseFloat(lot.USDRate);
                if (lot.rmaFeeDecision) existingLot.rmaFeeDecision = lot.rmaFeeDecision;
                if (lot.netPrice) existingLot.netPrice = parseFloat(lot.netPrice);
                if (lot.pricingGrade) existingLot.pricingGrade = lot.pricingGrade;
                if (lot.ASIR) existingLot.ASIR = parseFloat(lot.ASIR);
                if (lot.sampleIdentification) existingLot.sampleIdentification = lot.sampleIdentification;
                // if (lot.nonSellAgreement?.weight) existingLot.nonSellAgreement.weight = lot.nonSellAgreement.weight;
                if (lot.nonSellAgreement?.weight !== existingLot.nonSellAgreement?.weight) {
                    if (lot.nonSellAgreement?.weight > 0) {
                        existingLot.cumulativeAmount = 0;
                        existingLot.nonSellAgreement.weight = existingLot.weightOut;
                        existingLot.status = "non-sell agreement"
                        existingLot.nonSellAgreement.date = new Date();
                    } else {
                        if (lot.nonSellAgreement?.weight === 0) {
                            existingLot.cumulativeAmount = existingLot.weightOut;
                            existingLot.nonSellAgreement.weight = 0;
                            existingLot.status = "in stock"
                            existingLot.nonSellAgreement.date = null;
                        }
                    }
                }
                if (existingLot.weightOut && rmaFeeWolframite) {
                    existingLot.rmaFee = rmaFeeWolframite * existingLot.weightOut;
                }
                if (existingLot.rmaFee && existingLot.USDRate) {
                    existingLot.rmaFeeUSD = handleConvertToUSD(existingLot.rmaFee, existingLot.USDRate).toFixed(5);
                }
                if (existingLot.mineralPrice && parseFloat(lot.mineralPrice)) {
                    if (!existingLot.unpaid && existingLot.unpaid !== 0) {
                        if (existingLot.rmaFeeUSD) {
                            existingLot.unpaid = existingLot.mineralPrice - existingLot.rmaFeeUSD;
                        }
                    } else if (parseFloat(lot.mineralPrice) > existingLot.mineralPrice) {
                        existingLot.unpaid += parseFloat(lot.mineralPrice) - existingLot.mineralPrice;
                        if (Boolean(parseFloat(existingLot.paid))) {
                            existingLot.paid -= parseFloat(lot.mineralPrice) - existingLot.mineralPrice;
                        }
                    } else if (parseFloat(lot.mineralPrice) < existingLot.mineralPrice) {
                        existingLot.unpaid -= existingLot.mineralPrice - parseFloat(lot.mineralPrice);
                        if (Boolean(parseFloat(existingLot.paid))) {
                            existingLot.paid += existingLot.mineralPrice - parseFloat(lot.mineralPrice);
                        }
                    }
                }
                if (lot.comment) existingLot.comment = lot.comment;
            } else {
                if (lot.lotNumber && lot.weightOut) {
                    entry.output.push(
                        {
                            lotNumber: lot.lotNumber,
                            weightOut: lot.weightOut,
                            exportedAmount: 0,
                            cumulativeAmount: lot.weightOut,
                            rmaFee: null,
                            USDRate: null,
                            rmaFeeUSD: null,
                            rmaFeeDecision: "pending",
                            paid: 0,
                            mineralGrade: null,
                            mineralPrice: null,
                            metricTonUnit: null,
                            pricePerUnit: null,
                            netPrice: null,
                            ASIR: null,
                            sampleIdentification: null,
                            unpaid: null,
                            settled: false,
                            status: "in stock"
                        }
                    )
                }
            }
        }
    }
    const result = await entry.save({validateModifiedOnly: true});
    if (!result) {
        logs.status = "failed";
    }
    await logs?.save({validateBeforeSave: false});
    res
        .status(202)
        .json(
            {
                status: "Success",
            }
        )
    ;
})

exports.deleteWolframiteEntry = catchAsync(async (req, res, next) => {
    const log = trackDeleteOperations(req.params?.entryId, "wolframite", req);
    const entry = await Wolframite.findByIdAndUpdate(req.params.entryId, {visible: false});
    if (!entry) {
        log.status = "failed";
        log.link = `/wolframite`;
        await log?.save({validateBeforeSave: false});
        return next(new AppError("The selected entry no longer exists!", 400));
    } else {
        await log?.save({validateBeforeSave: false});
    }
    res
        .status(204)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.trashEntries = catchAsync(async (req, res, next) => {
    const entries = await Wolframite.find({visible: false});
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    entries
                }
            }
        )
    ;
})


const multerStorage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, `${__dirname}/../public/data/wolframite`);
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
    const allowExtension = ['.png', '.jpg', '.jpeg'];
    if (allowExtension.includes(fileExtension.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new AppError("Not a .jpg, .jpeg or .png file selected", 400), false);
    }
}

const upload = multer(
    {
        storage: multerStorage,
        fileFilter: multerFilter
    }
)

exports.uploadGradeImg = upload;
const multer = require('multer');
const path = require('path');
const exifreader = require('exifreader');
const fs = require('fs');
const Coltan = require('../models/coltanEntryModel');
const Tag = require('../models/tagsModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Supplier = require('../models/supplierModel');
const APIFeatures = require('../utils/apiFeatures');
const Settings = require('../models/settingsModel');
const { handleConvertToUSD, getSFDT, filterResponse } = require('../utils/helperFunctions');
const imagekit = require('../utils/imagekit');
const { getModel, updateMineTags, updateNegociantTags } = require('../utils/helperFunctions');
const { generateLabReport } = require('../utils/docTemplater');
const { trackUpdateModifications,
    trackDeleteOperations,
    trackCreateOperations } = require('./activityLogsControllers');

// const io = require('../bin/www').io;


exports.getAllColtanEntries = catchAsync(async (req, res, next) => {
    const result = new APIFeatures(Coltan.find().populate('mineTags').populate('negociantTags'), req.query)
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

exports.createColtanEntry = catchAsync(async (req, res, next) => {
    const entry = await Coltan.create(
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
    if (req.body.mineralType) entry.mineralType = req.body.mineralType;
    if (req.body.numberOfTags) entry.numberOfTags = req.body.numberOfTags;
    if (req.body.comment) entry.comment = req.body.comment;
    entry.weightIn = req.body.weightIn;
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
                    pricePerUnit: null,
                    netPrice: null,
                    ASIR: null,
                    sampleIdentification: null,
                    unpaid: null,
                    settled: false,
                    tantalum: null,
                    status: "in stock"
                }
            )
        }
    }
    const log = trackCreateOperations("coltan", req);
    log.logSummary = `${req.user?.username} created a new coltan entry for ${entry.companyName} - ${entry.beneficiary}`;
    const result = await entry.save({validateModifiedOnly: true});
    if (!result) {
        log.status = "failed";
    }
    await log.save({validateBeforeSave: false});
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

exports.getOneColtanEntry = catchAsync(async (req, res, next) => {
    let entry = await Coltan.findById(req.params.entryId)
        .populate('mineTags').populate('negociantTags');
    if (!entry) return next(new AppError("This Entry no longer exists!", 400));
    entry = filterResponse(entry, req.user?.permissions, "coltan");
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

exports.updateColtanEntry = catchAsync(async (req, res, next) => {
    const entry = await Coltan.findById(req.params.entryId);
    // if (!entry.visible) return next(new AppError("Please restore this entry to update it!", 400));
    if (!entry) return next(new AppError("This Entry no longer exists!", 400));
    const logs = trackUpdateModifications(req.body, entry, req);
    if (req.files) {
        const filePromises = req.files.map(async (file) => {
            const fileData = fs.readFileSync(file.path);
            const response = await imagekit.upload({
                file: fileData,
                fileName: file.originalname,
                folder: `/coltan`
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
    if (req.body.TINNumber) entry.TINNumber = req.body.TINNumber;
    if (req.body.mineTags?.length > 0) await updateMineTags(req.body.mineTags, entry);
    if (req.body.negociantTags?.length > 0) await updateNegociantTags(req.body.negociantTags, entry);
    const { rmaFeeColtan } = await Settings.findOne();
    if (req.body.comment) entry.comment = req.body.comment;
    if (req.body.output) {
        for (const lot of req.body.output) {
            const existingLot = entry.output.find(value => parseInt(value.lotNumber) === parseInt(lot.lotNumber));
            if (existingLot) {
                if (lot.mineralGrade) existingLot.mineralGrade = parseFloat(lot.mineralGrade);
                if (lot.pricePerUnit) existingLot.pricePerUnit = parseFloat(lot.pricePerUnit);
                if (lot.mineralPrice) existingLot.mineralPrice = parseFloat(lot.mineralPrice);
                if (lot.weightOut) existingLot.weightOut = parseFloat(lot.weightOut);
                if (lot.tantalum) existingLot.tantalum = parseFloat(lot.tantalum);
                if (lot.USDRate) existingLot.USDRate = parseFloat(lot.USDRate);
                if (lot.netPrice) existingLot.netPrice = parseFloat(lot.netPrice);
                if (lot.pricingGrade) existingLot.pricingGrade = lot.pricingGrade;
                if (lot.ASIR) existingLot.ASIR = parseFloat(lot.ASIR);
                if (lot.sampleIdentification) existingLot.sampleIdentification = lot.sampleIdentification;
                if (lot.niobium) {
                    if (parseFloat(lot.niobium) !== existingLot.niobium) {
                        existingLot.niobium = parseFloat(lot.niobium);
                    }
                }
                if (lot.iron) {
                    if (parseFloat(lot.iron) !== existingLot.iron) {
                        existingLot.iron = parseFloat(lot.iron);
                    }
                }
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
                if (lot.rmaFeeDecision) existingLot.rmaFeeDecision = lot.rmaFeeDecision;
                if (existingLot.weightOut && rmaFeeColtan) {
                    existingLot.rmaFee = rmaFeeColtan * existingLot.weightOut;
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
                            pricePerUnit: null,
                            netPrice: null,
                            ASIR: null,
                            sampleIdentification: null,
                            unpaid: null,
                            settled: false,
                            tantalum: null,
                            status: "in stock",
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

exports.deleteColtanEntry = catchAsync(async (req, res, next) => {
    const log = trackDeleteOperations(req.params?.entryId, "coltan", req);
    const entry = await Coltan.findByIdAndUpdate(req.params.entryId, {visible: false});
    if (!entry) {
        log.status = "failed";
        log.link = `/coltan`;
        await log.save({validateBeforeSave: false});
        return next(new AppError("The selected entry no longer exists!", 400));
    } else {
        await log.save({validateBeforeSave: false});
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

exports.deleteGradeImg = catchAsync(async (req, res, next) => {
    const log = trackDeleteOperations(req.params?.entryId, req.params?.model, req);
    const Entry = getModel(req.params.model);
    const entry = await Entry.findById(req.params.entryId);
    if (!entry) return next(new AppError("Unable to delete gradeImg!", 400));
    if (["lithium", "beryllium"].includes(req.params.model)) {
        if (log) {
            log.modifications = [{fieldName: "gradeImg", initialValue: entry.gradeImg?.filePath, newValue: ""}];
        }
        entry.gradeImg = undefined;
        await entry.save({validateModifiedOnly: true});
    } else {
        const lot = entry.output?.find(item => parseInt(item.lotNumber) === parseInt(req.body.lotNumber));
        // await imagekit.deleteFile(lot.gradeImg.fileId);
        if (log) {
            log.modifications = [{fieldName: "gradeImg", initialValue: lot?.gradeImg?.filePath, newValue: ""}];
        }
        lot.gradeImg = undefined;
        await entry.save({validateModifiedOnly: true});
    }
    if (log) {
        await log.save({validateBeforeSave: false});
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

exports.generateLabReport = catchAsync(async (req, res, next) => {
    const log = trackCreateOperations("lab report", req);
    const Entry = getModel(req.params.model);
    const entry = await Entry.findById(req.body.entryId);
    if (!entry) return next(new AppError("Unable to generate lab report, please try again!", 400));
    const lot = entry.output?.find(item => item.lotNumber === parseInt(req.body.lotNumber));
    // TODO 27: USE CORRECT USER OBJECT
    const buffer = await generateLabReport(entry, lot, req?.user);
    if (log) log.logSummary = `${req.user?.username} generated lab report for ${entry.beneficiary} - ${lot?.lotNumber}`;
    if (buffer) {
        await log?.save({validateBeforeSave: false});
        await getSFDT(Buffer.from(buffer), res, next);
    } else {
        if (log) log.status = "failed";
        await log?.save({validateBeforeSave: false});
    }
})

exports.trashEntries = catchAsync(async (req, res, next) => {
    const entries = await Coltan.find({visible: false});
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

exports.EntryEditPermission = catchAsync(async (req, res, next) => {
    const entry = await Coltan.findById(req.params.entryId);
    if (!entry) return next(new AppError("Entry selected was not found!", 400));
    if (req.body.fields.length > 0) {
        entry.editableFields = req.body.fields;
    }
    entry.requestEditPermission();
})


const multerStorage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, `${__dirname}/../public/data/coltan`);
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
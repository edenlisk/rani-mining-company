const fs = require("fs");
const path = require("path");
const Cassiterite = require('../models/cassiteriteEntryModel');
const Supplier = require('../models/supplierModel');
const Settings = require('../models/settingsModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const multer = require("multer");
const exifreader = require('exifreader');
const {handleConvertToUSD, updateMineTags, updateNegociantTags} = require("../utils/helperFunctions");
const imagekit = require('../utils/imagekit');
const { trackUpdateModifications,
    trackDeleteOperations,
    trackCreateOperations } = require('./activityLogsControllers');


exports.getAllCassiteriteEntries = catchAsync(async (req, res, next) => {
    const result = new APIFeatures(Cassiterite.find().populate('mineTags').populate('negociantTags'), req.query)
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

exports.createCassiteriteEntry = catchAsync(async (req, res, next) => {
    const entry = await Cassiterite.create(
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
    if (req.body.comment) entry.comment = req.body.comment;
    entry.weightIn = req.body.weightIn;
    entry.supplyDate = req.body.supplyDate;
    entry.time = req.body.time;
    if (req.body.output) {
        for (const lot of req.body.output) {
            entry?.output?.push(
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
                    londonMetalExchange: null,
                    treatmentCharges: null,
                    status: "in stock"
                }
            )
        }
    }
    const log = trackCreateOperations("cassiterite", req);
    const result = await entry?.save({validateModifiedOnly: true});
    if (!result) {
        log.status = "failed";
    }
    await log?.save({validateBeforeSave: false});

    res
        .status(204)
        .json(
            {
                status: "Success",
            }
        )
    ;
})

exports.getOneCassiteriteEntry = catchAsync(async (req, res, next) => {
    const entry = await Cassiterite.findById(req.params.entryId)
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

exports.updateCassiteriteEntry = catchAsync(async (req, res, next) => {
    const entry = await Cassiterite.findById(req.params.entryId);
    // if (!entry.visible) return next(new AppError("Please restore this entry to update it!", 400));
    if (!entry) return next(new AppError("This Entry no longer exists!", 400));
    // req.user = {};
    // req.user.username = "admin";
    // req.user.userId = entry._id;
    const logs = trackUpdateModifications(req.body, entry, req);
    if (req.files) {
        const filePromises = req.files.map(async (file) => {
            const fileData = fs.readFileSync(file.path);
            const response = await imagekit.upload({
                file: fileData,
                fileName: file.originalname,
                folder: `/cassiterite`
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
    if (req.body.comment) entry.comment = req.body.comment;
    if (req.body.time) entry.time = req.body.time;
    if (req.body.mineTags) await updateMineTags(req.body.mineTags, entry);
    if (req.body.negociantTags) await updateNegociantTags(req.body.negociantTags, entry);
    const { rmaFeeCassiterite } = await Settings.findOne();
    if (req.body.output) {
        for (const lot of req.body.output) {
            const existingLot = entry.output.find(value => parseInt(value.lotNumber) === parseInt(lot.lotNumber));
            if (existingLot) {
                if (lot.mineralGrade) existingLot.mineralGrade = parseFloat(lot.mineralGrade);
                if (lot.mineralPrice) existingLot.mineralPrice = parseFloat(lot.mineralPrice);
                if (lot.treatmentCharges) existingLot.treatmentCharges = parseFloat(lot.treatmentCharges);
                if (lot.londonMetalExchange) existingLot.londonMetalExchange = parseFloat(lot.londonMetalExchange);
                if (lot.pricePerUnit) existingLot.pricePerUnit = parseFloat(lot.pricePerUnit);
                if (lot.netPrice) existingLot.netPrice = parseFloat(lot.netPrice);
                if (lot.ASIR) existingLot.ASIR = parseFloat(lot.ASIR);
                if (lot.pricingGrade) existingLot.pricingGrade = lot.pricingGrade;
                if (lot.sampleIdentification) existingLot.sampleIdentification = lot.sampleIdentification;
                // if (lot.nonSellAgreement?.weight) {
                //     existingLot.nonSellAgreement.weight = lot.nonSellAgreement.weight;
                // }
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
                if (lot.USDRate) existingLot.USDRate = parseFloat(lot.USDRate);
                if (lot.rmaFeeDecision) existingLot.rmaFeeDecision = lot.rmaFeeDecision;
                if (existingLot.weightOut && rmaFeeCassiterite) {
                    existingLot.rmaFee = rmaFeeCassiterite * existingLot.weightOut;
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
                            londonMetalExchange: null,
                            treatmentCharges: null,
                            status: "in stock"
                        }
                    )
                }
            }
        }
    }
    const result = entry.save({validateModifiedOnly: true});
    if (!result) {
        logs.status = "failed";
    }
    await logs?.save({validateBeforeSave: false});
    res
        .status(201)
        .json(
            {
                status: "Success",
            }
        )
    ;
})

exports.deleteCassiteriteEntry = catchAsync(async (req, res, next) => {
    const log = trackDeleteOperations(req.params.entryId, "cassiterite", req);
    const entry = await Cassiterite.findByIdAndUpdate(req.params.entryId, {visible: false});
    if (!entry) {
        log.status = "failed";
        log.link = `/cassiterite`;
        await log?.save({validateBeforeSave: false});
        return next(new AppError("The selected entry no longer exists!", 400));
    } else {
        await log?.save({validateBeforeSave: false});
    }

    // logs.push(`${req.user.username} deleted this cassiterite entry supplied by: ${entry.companyName} on ${entry.supplyDate}`);
    // const preparedLogs = prepareLog(logs, `/complete/cassiterite/${entry?._id}`,{userId: req.user._id, username: req.user.username});
    // await recordLogs(preparedLogs);
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
    const entries = await Cassiterite.find({visible: false});
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



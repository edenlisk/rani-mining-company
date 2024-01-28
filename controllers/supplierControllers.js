const Supplier = require('../models/supplierModel');
const catchAsync = require('../utils/catchAsync');
const AppError  = require('../utils/appError');
const { getModel } = require('../utils/helperFunctions');
const fs = require('fs');
const {getSFDT} = require("../utils/helperFunctions");
const { trackUpdateModifications, trackCreateOperations, trackDeleteOperations } = require('../controllers/activityLogsControllers');


exports.getAllSuppliers = catchAsync(async (req, res, next) => {
    const suppliers = await Supplier.find();
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    suppliers
                }
            }
        )
    ;
})

exports.addSupplier = catchAsync(async (req, res, next) => {
    const log = trackCreateOperations("supplier", req);
    if (log) log.logSummary = `${req.user.username} registered new supplier with name ${req.body.companyName}`;
    const supplier = await Supplier.create(
        {
            companyName: req.body.companyName,
            TINNumber: req.body.TINNumber,
            licenseNumber: req.body.licenseNumber,
            companyRepresentative: req.body.companyRepresentative,
            email: req.body.email,
            nationalId: req.body.nationalId,
            phoneNumber: req.body.phoneNumber,
            mineSites: req.body.mineSites,
            address: req.body.address,
            equipmentList: req.body.equipmentList,
            typeOfMining: req.body.typeOfMining,
            surfaceArea: req.body.surfaceArea,
            categoryOfMine: req.body.categoryOfMine,
            typeOfMinerals: req.body.typeOfMinerals,
            numberOfDiggers: req.body.numberOfDiggers,
            numberOfWashers: req.body.numberOfWashers,
            numberOfTransporters: req.body.numberOfTransporters
        }
    )
    if (!supplier) {
        log.status = "failed";
    }
    await log?.save({validateBeforeSave: false});
    res
        .status(201)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.updateSupplier = catchAsync(async (req, res, next) => {
    const supplier = await Supplier.findById(req.params.supplierId);
    if (!supplier) return next(new AppError("Selected supplier no longer exists!", 400));
    const log = trackUpdateModifications(req.body, supplier, req);
    if (req.body.companyName) supplier.companyName = req.body.companyName;
    if (req.body.TINNumber) supplier.TINNumber = req.body.TINNumber;
    if (req.body.licenseNumber) supplier.licenseNumber = req.body.licenseNumber;
    if (req.body.companyRepresentative) supplier.companyRepresentative = req.body.companyRepresentative;
    if (req.body.email) supplier.email = req.body.email;
    if (req.body.nationalId) supplier.nationalId = req.body.nationalId;
    if (req.body.address) supplier.address = req.body.address;
    if (req.body.equipmentList) supplier.equipmentList = req.body.equipmentList;
    if (req.body.typeOfMining) supplier.typeOfMining = req.body.typeOfMining;
    if (req.body.typeOfMinerals) supplier.typeOfMinerals = req.body.typeOfMinerals;
    if (req.body.surfaceArea) supplier.surfaceArea = req.body.surfaceArea;
    if (req.body.categoryOfMine) supplier.categoryOfMine = req.body.categoryOfMine;
    if (req.body.numberOfDiggers) supplier.numberOfDiggers = req.body.numberOfDiggers;
    if (req.body.numberOfWashers) supplier.numberOfWashers = req.body.numberOfWashers;
    if (req.body.numberOfTransporters) supplier.numberOfTransporters = req.body.numberOfTransporters;
    if (req.body.status) supplier.status = req.body.status;
    if (req.body.comment) supplier.observations.push(req.body.comment);
    if (req.body.phoneNumber) supplier.phoneNumber = req.body.phoneNumber;
    if (req.body.mineSites) {
        supplier.mineSites = [];
        for (const mineSite of req.body.mineSites) {
            supplier.mineSites.push(mineSite);
        }
    }
    const result = await supplier.save({validateModifiedOnly: true});
    if (!result) {
        log.status = "failed";
    }
    await log?.save({validateBeforeSave: false});
    res
        .status(202)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.getOneSupplier = catchAsync(async (req, res, next) => {
    const supplier = await Supplier.findById(req.params.supplierId);
    if (!supplier) return next(new AppError("Selected supplier no longer exists!", 400));
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    supplier
                }
            }
        )
    ;
})

exports.deleteSupplier = catchAsync(async (req, res, next) => {
    const supplier = await Supplier.findByIdAndDelete(req.params.supplierId);
    if (!supplier) return next(new AppError("Selected supplier no longer exists!", 400));
    res
        .status(204)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.supplierProductionHistory = catchAsync(async (req, res, next) => {
    if (!req.params.supplierId) return next(new AppError("Please provide supplierId", 400));
    const models = ["coltan", "cassiterite", "wolframite"];
    let supplierHistory = [];
    const query = {supplierId: req.params.supplierId};
    if (req.body.startDate && req.body.endDate) {
        query["supplyDate"] = {
            $gte: new Date(req.body.startDate),
            $lte: new Date(req.body.endDate)
        }
    } else if (req.body.startDate) {
        query["supplyDate"] = {
            $gte: new Date(req.body.startDate)
        }
    } else if (req.body.endDate) {
        query["supplyDate"] = {
            $lte: new Date(req.body.endDate)
        }
    }
    for (const model of models) {
        const Entry = getModel(model);
        const entries = await Entry.find(query);
        supplierHistory = [...supplierHistory, ...entries];
    }
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    supplierHistory
                }
            }
        )
    ;
})

exports.getDueDiligence = catchAsync(async (req, res, next) => {
    const data = fs.readFileSync(`${__dirname}/../public/data/templates/dd template suppliers.docx`);
    if (data) {
        await getSFDT(data, res, next);
    }
})
const Coltan = require('../models/coltanEntryModel');
const Cassiterite = require('../models/cassiteriteEntryModel');
const Supplier = require('../models/supplierModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createMixedEntry = catchAsync(async (req, res, next) => {
    const supplier = await Supplier.findById(req.body.supplierId);
    if (!supplier) return next(new AppError("This supplier no longer exists!", 400));
    const minerals = ["cassiterite", "coltan"];
    for (const mineral of minerals) {
        if (mineral === "cassiterite") {
            let entry;
            if (req.body.isSupplierBeneficiary) {
                entry = await Cassiterite.create(
                    {
                        supplierId: supplier._id,
                        companyName: supplier.companyName,
                        licenseNumber: supplier.licenseNumber,
                        beneficiary: supplier.companyRepresentative,
                        TINNumber: supplier.TINNumber,
                        email: supplier.email,
                        representativeId: supplier.representativeId,
                        representativePhoneNumber: supplier.representativePhoneNumber,
                    }
                )
            } else if (supplier.companyName.toLowerCase() === "kanzamin") {
                entry = await Cassiterite.create(
                    {
                        supplierId: supplier._id,
                        companyName: supplier.companyName,
                        licenseNumber: "kanzamin license",
                        beneficiary: req.body.beneficiary,
                        TINNumber: "Kanzamin TIN",
                        email: "kanzamin@gmail.com",
                        representativeId: "Kanzamin representative",
                        representativePhoneNumber: "+250780000000",
                    }
                )
            } else if (req.body.isSupplierBeneficiary === false && supplier.companyName.toLowerCase() !== "kanzamin") {
                entry = await Cassiterite.create(
                    {
                        supplierId: supplier._id,
                        companyName: supplier.companyName,
                        licenseNumber: supplier.licenseNumber,
                        beneficiary: req.body.beneficiary,
                        TINNumber: supplier.TINNumber,
                        email: supplier.email,
                        representativeId: req.body.representativeId,
                        representativePhoneNumber: req.body.representativePhoneNumber,
                    }
                )
            }
            entry.mineralType = req.body.mineralType;
            entry.numberOfTags = req.body.numberOfTags;
            entry.weightIn = req.body.weightIn;
            entry.supplyDate = req.body.supplyDate;
            entry.time = req.body.time;
            if (req.body.cassiteriteOutput) {
                for (const lot of req.body.cassiteriteOutput) {
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
                            unpaid: null,
                            settled: false,
                            londonMetalExchange: null,
                            treatmentCharges: null,
                            status: "in stock"
                        }
                    )
                }
            }
            await entry.save({validateModifiedOnly: true});
        } else if (mineral === "coltan") {
            let entry;
            if (req.body.isSupplierBeneficiary) {
                entry = await Coltan.create(
                    {
                        supplierId: supplier._id,
                        companyName: supplier.companyName,
                        licenseNumber: supplier.licenseNumber,
                        beneficiary: supplier.companyRepresentative,
                        TINNumber: supplier.TINNumber,
                        email: supplier.email,
                        representativeId: supplier.representativeId,
                        representativePhoneNumber: supplier.representativePhoneNumber,
                    }
                )
            } else if (supplier.companyName.toLowerCase() === "kanzamin") {
                entry = await Coltan.create(
                    {
                        supplierId: supplier._id,
                        companyName: supplier.companyName,
                        licenseNumber: "kanzamin license",
                        beneficiary: req.body.beneficiary,
                        TINNumber: "Kanzamin TIN",
                        email: "kanzamin@gmail.com",
                        representativeId: "Kanzamin representative",
                        representativePhoneNumber: "+250780000000",
                    }
                )
            } else if (req.body.isSupplierBeneficiary === false && supplier.companyName.toLowerCase() !== "kanzamin") {
                entry = await Coltan.create(
                    {
                        supplierId: supplier._id,
                        companyName: supplier.companyName,
                        licenseNumber: supplier.licenseNumber,
                        beneficiary: req.body.beneficiary,
                        TINNumber: supplier.TINNumber,
                        email: supplier.email,
                        representativeId: req.body.representativeId,
                        representativePhoneNumber: req.body.representativePhoneNumber,
                    }
                )
            }
            entry.mineralType = req.body.mineralType;
            entry.numberOfTags = req.body.numberOfTags;
            entry.weightIn = req.body.weightIn;
            entry.supplyDate = req.body.supplyDate;
            entry.time = req.body.time;
            if (req.body.coltanOutput) {
                for (const lot of req.body.coltanOutput) {
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
                            unpaid: null,
                            settled: false,
                            tantalum: null,
                            status: "in stock"
                        }
                    )
                }
            }
            await entry.save({validateModifiedOnly: true});
        }
    }
    res
        .status(201)
        .json(
            {
                status: "Success",
            }
        )
    ;
})
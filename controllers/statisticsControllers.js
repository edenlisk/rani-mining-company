const { getModel, getModelAcronym, completeYearStock } = require('../utils/helperFunctions');
const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const Supplier = require('../models/supplierModel');
const {v4: uuidv4} = require('uuid');
const AppError = require('../utils/appError');
const ExcelJS = require('exceljs');
const {decidePricingGrade} = require("../utils/helperFunctions");

exports.detailedStock = catchAsync(async (req, res, next) => {
    const Entry = getModel(req.params.model);
    const detailedStock = [];
    const { entries } = await Entry.findCurrentStock();
    for (const entry of entries) {
        for (const lot of entry.output) {
            if (lot.cumulativeAmount === 0 || lot.status === "sold out") continue;
            if (lot.status === "non-sell agreement") continue;
            detailedStock.push(
                {
                    _id: entry._id,
                    companyName: entry.companyName,
                    beneficiary: entry.beneficiary,
                    supplyDate: entry.supplyDate,
                    mineralType: getModelAcronym(entry.mineralType),
                    lotNumber: lot.lotNumber,
                    weightIn: entry.weightIn,
                    weightOut: lot.weightOut,
                    mineralGrade: lot[decidePricingGrade(lot.pricingGrade)] || lot.ASIR || lot.mineralGrade,
                    mineralPrice: lot.mineralPrice,
                    exportedAmount: lot.exportedAmount,
                    cumulativeAmount: lot.cumulativeAmount,
                    pricePerUnit: lot.pricePerUnit,
                    index: uuidv4(),
                }
            );
        }
    }
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    detailedStock
                }
            }
        )
    ;
})

exports.currentStock = catchAsync(async (req, res, next) => {
    const models = ["coltan", "cassiterite", "wolframite", "lithium", "beryllium"];
    const currentStock = {};
    for (const model of models) {
        const Entry = getModel(model);
        const yearStock = await Entry.aggregate(
            [
                {
                    $match: {
                        "supplyDate": { $gte: new Date(req.params.year ? req.params.year : new Date().getFullYear(), 0, 1) }
                    }
                },
                {
                    $unwind: "$output"
                },
                {
                    $project: {
                        month: { $month: "$supplyDate" },
                        totalWeightOut: "$output.weightOut",
                    }
                },
                {
                    $group: {
                        _id: { month: "$month" },
                        totalWeightOut: { $sum: "$totalWeightOut" },
                    }
                },
                {
                    $group: {
                        _id: "$_id.month",
                        totalWeightOut: { $sum: "$totalWeightOut" },
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                }
            ]
        )
        if (!yearStock) continue;
        completeYearStock(yearStock, currentStock, model);
    }
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    currentStock
                }
            }
        )
    ;
})

exports.paymentHistory = catchAsync(async (req, res, next) => {
    let lotPaymentHistory = [];
    const Entry = getModel(req.params.model);
    const entry = await Entry.findById(req.params.entryId);
    if (!entry) return next(new AppError("The selected entry no longer exists!", 400));
    const lot = entry.output?.find(value => value.lotNumber === parseInt(req.params.lotNumber));
    if (lot) lotPaymentHistory = lot.paymentHistory;
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    lotPaymentHistory
                }
            }
        )
    ;
})
// const entry = await Entry.aggregate(
//     [
//         {
//             $unwind: '$output' // Unwind the "output" array
//         },
//         {
//             $group: {
//                 _id: null, // Group all documents into a single group
//                 balance: {$sum: '$output.cumulativeAmount'}
//             }
//         },
//         {
//             $project: {
//                 _id: 0, // Exclude the "_id" field from the result
//                 balance: 1
//             }
//         }
//     ]
// );
// stock.push({value: entry[0]?.balance, name: model});

exports.stockSummary = catchAsync(async (req, res, next) => {
    const models = ["cassiterite", "coltan", "wolframite", "lithium", "beryllium"];
    const stock = [];
    for (const model of models) {
        const Entry = getModel(model);
        const {balance} = await Entry.findCurrentStock();
        stock.push({value: balance, name: model});
    }
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    stock
                }
            }
        )
    ;
})

exports.lastCreatedEntries = catchAsync(async (req, res, next) => {
    const models = ["coltan", "cassiterite", "wolframite"];
    let lastCreated = [];
    for (const model of models) {
        const Entry = getModel(model);
        const entries = await Entry.find()
            .sort({createdAt: -1})
            .limit(2)
            .select({output: 0, mineTags: 0, negociantTags: 0});
        lastCreated = [...lastCreated, ...entries];
    }

    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    lastCreated
                }
            }
        )
    ;
})

exports.topSuppliers = catchAsync(async (req, res, next) => {
    const models = ["coltan", "cassiterite", "wolframite"];
    let result = [];
    for (const model of models) {
        const Entry = getModel(model);
        const entries = await Entry.aggregate(
            [
                {
                    $match: {}
                },
                {
                    $group: {
                        _id: "$supplierId",
                        totalProduction: {$sum: "$weightIn"},
                        companyName: {$first: "$companyName"},
                        mineralType: {$first: "$mineralType"},
                        licenseNumber: {$first: "$licenseNumber"},
                        TINNumber: {$first: "$TINNumber"},
                        companyRepresentative: {$first: "$companyRepresentative"},
                        representativePhoneNumber: {$first: "$representativePhoneNumber"}
                    }
                },
                // {
                //     $limit: 2
                // }
            ]
        )
        result.push({mineralType: model, entries});
    }

    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    result
                }
            }
        )
    ;
})

exports.unsettledLots = catchAsync(async (req, res, next) => {
    const models = ["cassiterite", "coltan", "wolframite"];
    let lots = [];
    for (const model of models) {
        const Entry = getModel(model);
        const entries = await Entry.aggregate(
            [
                {
                    $match: {
                        supplierId: { $in: [new mongoose.Types.ObjectId(req.params.supplierId)] },
                        // visible: true
                    },
                },
                {
                    $unwind: '$output',
                },
                {
                    $match: {
                        'output.settled': false,
                    },
                },
                {
                    $project: {
                        _id: 1, // Exclude the default _id field
                        // Include other fields from the output array as needed
                        // newId: uuidv4(6),
                        companyName: 1,
                        beneficiary: 1,
                        lotNumber: '$output.lotNumber',
                        weightOut: '$output.weightOut',
                        supplyDate: 1,
                        mineralGrade: '$output.mineralGrade',
                        mineralPrice: '$output.mineralPrice',
                        // exportedAmount: '$output.exportedAmount',
                        // cumulativeAmount: '$output.cumulativeAmount',
                        rmaFee: '$output.rmaFee',
                        // USDRate: '$output.USDRate',
                        // rmaFeeUSD: '$output.rmaFeeUSD',
                        // rmaFeeDecision: '$output.rmaFeeDecision',
                        paid: '$output.paid',
                        unpaid: '$output.unpaid',
                        settled: '$output.settled',
                        pricePerUnit: '$output.pricePerUnit',
                        mineralType: 1,
                        rmaFeeUSD: '$output.rmaFeeUSD',
                        // status: '$output.status',
                        // londonMetalExchange: '$output.londonMetalExchange',
                        // treatmentCharges: '$output.treatmentCharges',
                        // shipments: '$output.shipments',
                        // paymentHistory: '$output.paymentHistory',
                    },
                },
            ]
        )
        lots = [...lots, ...entries];
    }
    const finalLots = [];
    for (const item of lots) {
        const newItem = {...item};
        newItem.index = uuidv4();
        finalLots.push(newItem);
    }

    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    lots: finalLots
                }
            }
        )
    ;
})

exports.generateReconciliationExcelTable = catchAsync(async (req, res, next) => {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate || new Date();
    const model = req.params.model;
    const Entry = getModel(model);
    const entries = await Entry.find({supplyDate: {$gte: startDate, $lte: endDate}}).populate('negociantTags').sort('supplyDate');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`STOCK ${getModelAcronym(model)}`);
    worksheet.columns = [
        { header: 'Date', key: 'supplyDate', width: 15, alignment: "left" },
        { header: 'Company\nRepresentative', key: 'beneficiary', width: 15, style: {alignment: "left"} },
        { header: 'Company Name (by Tags)', key: 'companyName', width: 15, style: {alignment: "left"} },
        { header: 'Type of Minerals', key: 'mineralType', width: 15, style: {alignment: "left"} },
        { header: 'Gross weight in per delivery (kg)', key: "weightIn", width: 15, style: {alignment: "left"} },
        { header: 'Gross weight out (kg)', key: "totalWeightOut", width: 15, style: {alignment: "left"} },
        { header: 'Number of Lot / dispatch', key: "lotNumber", width: 15, style: {alignment: "left"} },
        { header: 'Weight per lot (kg) / dispatch', key: "weightOut", width: 15, style: {alignment: "left"} },
        { header: `Cumulative stock purchased from ${startDate}`, key: "cumulativeStock", width: 15, style: {alignment: "left"} },
        { header: 'Negociant Tags', key: "negociantTags", width: 15, style: {alignment: "left"} },
        { header: 'Date of export/ stock out with non-sell agreement', key: "stockOutDate", width: 15, style: {alignment: "left"} },
        { header: 'Quantity Exported (stock out)', key: "exportedAmount", width: 15, style: {alignment: "left"} },
        { header: 'Stock out with non-sell agreement', key: "nonSellAgreementWeight", width: 15, style: {alignment: "left"} },
        { header: 'Balance', key: "balance", width: 15, style: {alignment: "left"} },
        { header: 'Cumulative Balance After Export', key: "stockAfterExport", width: 15, style: {alignment: "left"} },
    ];

    for (const entry of entries) {
        for (const lot of entry.output) {
            const row = {
                supplyDate: entry.supplyDate,
                beneficiary: entry.beneficiary,
                companyName: entry.companyName,
                mineralType: entry.mineralType,
                weightIn: entry.weightIn,
                totalWeightOut: entry.output.reduce((accumulator, currentObject) => {
                    return accumulator + currentObject.weightOut;
                }, 0),
                lotNumber: lot.lotNumber,
                weightOut: lot.weightOut,
                cumulativeStock: entries.map((record, index, array) => {
                    return array
                        .slice(0, index + 1)
                        .reduce((accumulator, currentRecord) => accumulator + currentRecord.weightIn, 0);
                })[entries.indexOf(entry)],
                negociantTags: entry.negociantTags?.map(tag => tag.tagNumber).join('\n'),
                stockOutDate: lot.nonSellAgreement?.weight > 0 ? lot.nonSellAgreement?.date?.toISOString().split('T')[0] : lot.shipmentHistory?[0].date?.toISOString().split('T')[0] : null,
                exportedAmount: lot.shipmentHistory?[0].weight : null,
                nonSellAgreementWeight: lot.nonSellAgreement?.weight,
                balance: lot.cumulativeAmount,
                stockAfterExport: lot.weightOut - lot.shipmentHistory?[0].weight : null,
            }
            worksheet.addRow(row);
        }
    }
    worksheet.getRow(1).font = {bold: true};
    await workbook.xlsx.writeFile(`All RAMI MINING RECONCILIATION FOR ${getModelAcronym(model)}.xlsx`);
    res
        .status(200)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.getOneEntry = catchAsync(async (req, res, next) => {
    const model = req.params.model;
    const Entry = getModel(model);
    const entry = await Entry.findById(req.params.entryId);
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
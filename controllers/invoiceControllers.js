const Invoice = require('../models/invoiceModel');
const Settings = require('../models/settingsModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const INVOICE = require('../utils/invoiceTemplater');
const {getModelAcronym} = require("../utils/helperFunctions");
const { getModel } = require('../utils/helperFunctions');


exports.getAllInvoices = catchAsync(async (req, res, next) => {
    const result = new APIFeatures(Invoice.find({}), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()
    ;
    const invoices = await result.mongooseQuery;
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    invoices
                }
            }
        )
    ;
})

exports.generateInvoice = catchAsync(async (req, res, next) => {
    const settings = await Settings.findOne();
    const invoicedoc = await Invoice.create(
        {
            dateOfIssue: req.body.dateOfIssue,
            invoiceNo: req.body.invoiceNo,
            items: req.body.items,
            beneficiary: req.body.beneficiary,
            supplierCompanyName: req.body.supplierCompanyName,
            supplierAddress: req.body.supplierAddress,
            // processorEmail: req.body.processorEmail,
            // supplierEmail: req.body.supplierEmail,
            processorCompanyName: settings.nameOfCompany,
            mineralsSupplied: req.body.mineralsSupplied,
            extraNotes: req.body.extraNotes,
            paymentId: req.body.paymentId,
            supplierId: req.body.supplierId
        }
    )
    const invoiceDescription = [
        [
            {
                text: "Date",
                fillColor: '#eaf2f5',
                border: [false, true, false, true],
                margin: [0, 5, 0, 5],
            },
            {
                text: 'Description',
                fillColor: '#eaf2f5',
                border: [false, true, false, true],
                margin: [0, 5, 0, 5],
                textTransform: 'uppercase',
            },
            {
                text: "#",
                fillColor: '#eaf2f5',
                border: [false, true, false, true],
                margin: [0, 3, 0, 3],
            },
            {
                text: 'Quantity(kg)',
                border: [false, true, false, true],
                alignment: 'right',
                fillColor: '#eaf2f5',
                margin: [0, 5, 0, 5],
                textTransform: 'uppercase',
            },
            {
                text: 'Conc.(%)',
                border: [false, true, false, true],
                alignment: 'right',
                fillColor: '#eaf2f5',
                margin: [0, 5, 0, 5],
                textTransform: 'uppercase',
            },
            {
                text: 'Price per unit($)',
                border: [false, true, false, true],
                alignment: 'right',
                fillColor: '#eaf2f5',
                margin: [0, 5, 0, 5],
                textTransform: 'uppercase',
            },
            {
                text: 'Total($)',
                border: [false, true, false, true],
                alignment: 'right',
                fillColor: '#eaf2f5',
                margin: [0, 5, 0, 5],
                textTransform: 'uppercase',
            },
            {
                text: 'RMA Fee($)',
                border: [false, true, false, true],
                alignment: 'right',
                fillColor: '#eaf2f5',
                margin: [0, 5, 0, 5],
                textTransform: 'uppercase',
            },
        ],
        // [
        //     {
        //         text: 'Item 2',
        //         border: [false, false, false, true],
        //         margin: [0, 5, 0, 5],
        //         alignment: 'left',
        //     },
        //     {
        //         border: [false, false, false, true],
        //         text: '2767.4',
        //         fillColor: '#f5f5f5',
        //         alignment: 'right',
        //         margin: [0, 5, 0, 5],
        //     },
        //     {
        //         border: [false, false, false, true],
        //         text: 23.4,
        //         fillColor: '#f5f5f5',
        //         alignment: 'right',
        //         margin: [0, 5, 0, 5],
        //     },
        //     {
        //         border: [false, false, false, true],
        //         text: 25.6,
        //         fillColor: '#f5f5f5',
        //         alignment: 'right',
        //         margin: [0, 5, 0, 5],
        //     },
        //     {
        //         border: [false, false, false, true],
        //         text: 1743.8,
        //         fillColor: '#f5f5f5',
        //         alignment: 'right',
        //         margin: [0, 5, 0, 5],
        //     },
        // ],
    ]

    const bigPaymentHistory = [];

    if (invoicedoc) {
        let paymentTotal = 0;
        let totalRMAFee = 0;
        for (const item of invoicedoc.items) {
            const paymentHistory = [
                [
                    {
                        text: "#",
                        fillColor: '#eaf2f5',
                        border: [false, true, false, true],
                        margin: [0, 3, 0, 3],
                    },
                    {
                        text: "Date",
                        fillColor: '#eaf2f5',
                        border: [false, true, false, true],
                        margin: [0, 5, 0, 5],
                    },
                    {
                        text: 'Company Name',
                        fillColor: '#eaf2f5',
                        border: [false, true, false, true],
                        margin: [0, 5, 0, 5],
                        textTransform: 'uppercase',
                    },
                    {
                        text: 'Beneficiary',
                        border: [false, true, false, true],
                        alignment: 'right',
                        fillColor: '#eaf2f5',
                        margin: [0, 5, 0, 5],
                        textTransform: 'uppercase',
                    },
                    {
                        text: 'Phone Number',
                        border: [false, true, false, true],
                        alignment: 'right',
                        fillColor: '#eaf2f5',
                        margin: [0, 5, 0, 5],
                        textTransform: 'uppercase',
                    },
                    {
                        text: 'Amount($)',
                        border: [false, true, false, true],
                        alignment: 'right',
                        fillColor: '#eaf2f5',
                        margin: [0, 5, 0, 5],
                        textTransform: 'uppercase',
                    },
                ],
            ]
            paymentTotal += item.amount;
            totalRMAFee += item.rmaFeeUSD;
            invoiceDescription.push(
                [
                    {
                        text: item.supplyDate,
                        border: [false, false, false, true],
                        margin: [0, 5, 0, 5],
                        alignment: 'left',
                    },
                    {
                        text: getModelAcronym(item.mineralType),
                        border: [false, false, false, true],
                        margin: [0, 5, 0, 5],
                        alignment: 'left',
                    },
                    {
                        text: item.lotNumber,
                        border: [false, false, false, true],
                        margin: [0, 3, 0, 3],
                        alignment: 'left',
                    },
                    {
                        text: item.quantity,
                        border: [false, false, false, true],
                        fillColor: '#f5f5f5',
                        alignment: 'right',
                        margin: [0, 5, 0, 5],
                    },
                    {
                        text: item.concentration,
                        border: [false, false, false, true],
                        fillColor: '#f5f5f5',
                        alignment: 'right',
                        margin: [0, 5, 0, 5],
                    },
                    {
                        text: item.pricePerUnit,
                        border: [false, false, false, true],
                        fillColor: '#f5f5f5',
                        alignment: 'right',
                        margin: [0, 5, 0, 5],
                    },
                    {
                        text: item.amount,
                        border: [false, false, false, true],
                        fillColor: '#f5f5f5',
                        alignment: 'right',
                        margin: [0, 5, 0, 5],
                    },
                    {
                        text: item.rmaFeeUSD,
                        border: [false, false, false, true],
                        fillColor: '#f5f5f5',
                        alignment: 'right',
                        margin: [0, 5, 0, 5],
                    },
                ],
            )
            const Entry = getModel(item.mineralType);
            const entry = await Entry.findById(item.entryId);
            if (entry) {
                const lot = entry.output.find(lot => parseInt(lot.lotNumber) === parseInt(item.lotNumber));
                if (lot) {
                    if (lot.paymentHistory) {
                        if (lot.paymentHistory.length === 0) continue;
                        for (const payment of lot.paymentHistory) {
                            paymentHistory.push(
                                [
                                    {
                                        text: lot.paymentHistory.indexOf(payment) + 1,
                                        border: [false, false, false, true],
                                        margin: [0, 5, 0, 5],
                                        alignment: 'left',
                                    },
                                    {
                                        text: payment.paymentDate?.toISOString().split('T')[0],
                                        border: [false, false, false, true],
                                        margin: [0, 5, 0, 5],
                                        alignment: 'left',
                                    },
                                    {
                                        text: entry.companyName,
                                        border: [false, false, false, true],
                                        margin: [0, 5, 0, 5],
                                        alignment: 'left',
                                    },
                                    {
                                        text: payment.beneficiary,
                                        border: [false, false, false, true],
                                        fillColor: '#f5f5f5',
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    },
                                    {
                                        text: payment.phoneNumber,
                                        border: [false, false, false, true],
                                        fillColor: '#f5f5f5',
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    },
                                    {
                                        text: payment.paymentAmount,
                                        border: [false, false, false, true],
                                        fillColor: '#f5f5f5',
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    },
                                ],
                            )
                        }
                    }
                    if (paymentHistory.length > 1) bigPaymentHistory.push(paymentHistory);
                }
            }
        }


        const processor = {
            representative: settings.representative,
            companyName: settings.nameOfCompany,
            ...settings.address
        }
        const supplier = {
            companyName: invoicedoc.supplierCompanyName,
            beneficiary: invoicedoc.beneficiary,
            address: {
                ...invoicedoc.supplierAddress,
            }
        }
        const invoiceInfo = {
            invoiceId: invoicedoc._id,
            invoiceNo: invoicedoc.invoiceNo,
            mineralsSupplied: invoicedoc.mineralsSupplied.join(', '),
            dateOfIssue: req.body.dateOfIssue,
            paymentStatus: "",
            extraNotes: invoicedoc.extraNotes,
            invoiceDescription,
            paymentTotal,
            totalRMAFee,
            paymentHistory: bigPaymentHistory,
        }
        const invoice = new INVOICE(processor, supplier, invoiceInfo);
        invoice.populateDoc();
        await invoice.saveDownload(res);
    } else {
        return next(new AppError("Unable to generate invoice!", 400));
    }
    // res
    //     .status(200)
    //     .json(
    //         {
    //             status: "Success",
    //         }
    //     )
    // ;
})

exports.getSuppliersInvoice = catchAsync(async (req, res, next) => {
    const invoices = await Invoice.find({supplierId: req.params.supplierId});
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    invoices
                }
            }
        )
    ;
})

exports.getInvoice = catchAsync(async (req, res, next) => {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) return next(new AppError("Selected invoice no longer exists!", 400));
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    invoice
                }
            }
        )
    ;
})

exports.updateInvoice = catchAsync(async (req, res, next) => {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) return next(new AppError("The Selected invoice no longer exists!", 400));
    if (req.body.items) invoice.items = req.body.items;
    if (req.body.extraNotes) invoice.extraNotes = req.body.extraNotes;
    if (req.body.dateOfIssue) invoice.dateOfIssue = req.body.dateOfIssue;
    if (req.body.mineralsSupplied) invoice.mineralsSupplied = req.body.mineralsSupplied;
    await invoice.save({validateModifiedOnly: true});
    res
        .status(202)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

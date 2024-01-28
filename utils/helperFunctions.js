const path = require('path');
const fs = require('fs');
const multer = require('multer');
const axios = require("axios");
const FormData = require('form-data');
const imagekit = require('./imagekit');
const Supplier = require('../models/supplierModel');
const Coltan = require('../models/coltanEntryModel');
const Cassiterite = require('../models/cassiteriteEntryModel');
const Wolframite = require('../models/wolframiteEntryModel');
const Beryllium = require('../models/berylliumEntryModel');
const Lithium = require('../models/lithiumEntryModel');
const Settings = require('../models/settingsModel');
const Tag = require('../models/tagsModel');
const AppError = require('./appError');
const mongoose = require('mongoose');
const catchAsync = require('./catchAsync');
const { authenticator } = require('otplib');


exports.getModel = (model) => {
    switch (model) {
        case "coltan":
            return Coltan;
        case "cassiterite":
            return Cassiterite;
        case "wolframite":
            return Wolframite;
        case "beryllium":
            return Beryllium;
        case "lithium":
            return Lithium
    }
}


const getHeader = (fileName) => {
    const extension = path.extname(fileName);
    switch (extension) {
        case '.doc':
            return 'application/msword';
        case '.docx':
            return 'application/vdn.openxmlformats-officedocument.wordprocessingml.document';
        case '.pdf':
            return 'application/pdf';
        default:
            return 'application/pdf';
    }
}

exports.multerStorage = (destination, fileName, renameExisting) => multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, destination);
        },
        filename: function (req, file, cb) {
            const extension = path.extname(file.originalname);
            if (renameExisting) {
                const filePath = `${destination}/${fileName ? fileName + extension : file.originalname}`;
                if (fs.existsSync(filePath)) {
                    fs.rename(filePath, `${destination}/ex-${fileName ? fileName + extension : file.originalname}`, (err) => {
                        if (err) {
                            console.log(err);
                        }
                        console.log('File renamed successfully');
                    });
                }
            }
            req.targetField = file.fieldname;
            cb(null, fileName ? fileName + extension : file.originalname);
        }
    }
)

exports.fonts = {
    Courier: {
        normal: 'Courier',
        bold: 'Courier-Bold',
        italics: 'Courier-Oblique',
        bolditalics: 'Courier-BoldOblique'
    },
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    },
    Times: {
        normal: 'Times-Roman',
        bold: 'Times-Bold',
        italics: 'Times-Italic',
        bolditalics: 'Times-BoldItalic'
    },
    Symbol: {
        normal: 'Symbol'
    },
    ZapfDingbats: {
        normal: 'ZapfDingbats'
    }
};

exports.getSixMonthsAgo = endMonth => {
    const currentDate = new Date();
    const specifiedMonth = new Date(
        currentDate.getFullYear(),
        endMonth ? endMonth - 1 : currentDate.getMonth()
    );
    const sixMonthsAgo = new Date(specifiedMonth);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return {specifiedMonth, sixMonthsAgo};
}

exports.handlePaidSpecific = output => {
    for (const item of output) {
        if (item.unpaid) {
            if (item.unpaid <= 0) item.settled = true;
            if (item.cumulativeAmount <= 0 && item.status !== "non-sell agreement") {
                item.status = "sold out";
            }
            if (item.cumulativeAmount > 0 && item.status !== "non-sell agreement") {
                item.status = "in stock"
            }
        }
    }
}

exports.handleChangeSupplier = async (docObject, next) => {
    if (docObject.isModified('supplierId') && !docObject.isNew) {
        const supplier = await Supplier.findById(docObject.supplierId);
        if (!supplier) return next(new AppError("The Selected supplier no longer exists!", 400));
        docObject.companyName = supplier.companyName;
        docObject.licenseNumber = supplier.licenseNumber;
        // docObject.representativeId = supplier.representativeId;
        docObject.representativePhoneNumber = supplier.representativePhoneNumber;
        docObject.companyRepresentative = supplier.companyRepresentative;
        docObject.TINNumber = supplier.TINNumber;
    }
}

exports.getMonthWords = monthNumber => {
    switch (monthNumber) {
        case 1:
            return "January"
        case 2:
            return "February"
        case 3:
            return "March"
        case 4:
            return "April"
        case 5:
            return "May"
        case 6:
            return "June"
        case 7:
            return "July"
        case 8:
            return "August"
        case 9:
            return "September"
        case 10:
            return "October"
        case 11:
            return "November"
        case 12:
            return "December"
        default:
            return "Unclassified"
    }
}

exports.handleConvertToUSD = (amount, USDRate) => {
    return amount / USDRate;
}

exports.decidePricingGrade = (pricingGrade) => {
    if (pricingGrade === "KZM") return "mineralGrade";
    if (pricingGrade === "ASIR") return "ASIR";
}

exports.multerFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const allowExtension = ['.doc', '.docx', '.pdf'];
    if (allowExtension.includes(fileExtension.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new AppError("Not a .doc, .docx, or .pdf selected", 400), false);
    }
}

exports.validateNumber = (elem) => {
    return elem >= 0
}

exports.sendAttachment = (filePath, fileName, res) => {
    const fileStream = fs.createReadStream(filePath);
    res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);
    res.setHeader('Content-Type', getHeader(fileName));
    fileStream.pipe(res);
}

exports.isOTPValid = (secret, userEnteredCode, timeWindow = 30) => {
    // Check if the OTP is valid within the specified time window
    return authenticator
}
// 1                // 2        ....n
// ((quantity * grade) + (quantity * grade))/ total quantity

const storekeeper = {
    entry: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    suppliers: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    payments: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    shipments: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    mineralGrade: {
        view: true,
        create: true,
        edit: true,
    },
    pricePerUnit: {
        view: true,
        create: true,
        edit: true,
    },
    mineralPrice: {
        view: true,
        create: true,
        edit: true,
    },
    gradeImg: {
        view: true,
        create: true,
        edit: true,
    },
    tantal: {
        view: true,
        create: true,
        edit: true,
    },
    londonMetalExchange: {
        view: true,
        create: true,
        edit: true,
    },
    treatmentCharges: {
        view: true,
        create: true,
        edit: true
    },
    metricTonUnit: {
        view: true,
        create: true,
        edit: true
    },
    USDRate: {
        view: true,
        create: true,
        edit: true,
    },
    rmaFee:{
        view: true,
        add: true,
        edit: true
    },
    paymentHistory: {
        view: true,
        create: true,
        edit: true
    },
    settings: {
        view: false,
        edit: false
    },
    buyers: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    users: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    contracts: {
        view: true,
        create: true,
        delete: false
    },
    editRequests: {
        view: true,
        authorize: true,
        reject: true
    }
}

const traceabilityOfficer = {
    entry: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    suppliers: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    payments: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    shipments: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    mineralGrade: {
        view: true,
        create: true,
        edit: true,
    },
    pricePerUnit: {
        view: true,
        create: true,
        edit: true,
    },
    mineralPrice: {
        view: true,
        create: true,
        edit: true,
    },
    gradeImg: {
        view: true,
        create: true,
        edit: true,
    },
    tantal: {
        view: true,
        create: true,
        edit: true,
    },
    londonMetalExchange: {
        view: true,
        create: true,
        edit: true,
    },
    treatmentCharges: {
        view: true,
        create: true,
        edit: true
    },
    metricTonUnit: {
        view: true,
        create: true,
        edit: true
    },
    USDRate: {
        view: true,
        create: true,
        edit: true,
    },
    rmaFee:{
        view: true,
        add: true,
        edit: true
    },
    paymentHistory: {
        view: true,
        create: true,
        edit: true
    },
    settings: {
        view: false,
        edit: false
    },
    buyers: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    users: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    contracts: {
        view: true,
        create: true,
        delete: false
    },
    editRequests: {
        view: true,
        authorize: true,
        reject: true
    }
}

const managingDirector = {
    entry: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    dashboard: {
        view: true
    },
    suppliers: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    payments: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    shipments: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    mineralGrade: {
        view: true,
        create: true,
        edit: true,
    },
    ASIR: {
        view: true,
        create: true,
        edit: true,
    },
    pricingGrade: {
        view: true,
        create: true,
        edit: true,
    },
    pricePerUnit: {
        view: true,
        create: true,
        edit: true,
    },
    mineralPrice: {
        view: true,
        create: true,
        edit: true,
    },
    netPrice: {
        view: true,
        create: true,
        edit: true,
    },
    invoices: {
        view: true,
        create: true,
        edit: true,
    },
    gradeImg: {
        view: true,
        create: true,
        edit: true,
    },
    tantal: {
        view: true,
        create: true,
        edit: true,
    },
    niobium: {
        view: true,
        create: true,
        edit: true,
    },
    iron: {
        view: true,
        create: true,
        edit: true,
    },
    londonMetalExchange: {
        view: true,
        create: true,
        edit: true,
    },
    treatmentCharges: {
        view: true,
        create: true,
        edit: true
    },
    metricTonUnit: {
        view: true,
        create: true,
        edit: true
    },
    negociantTags: {
        view: true,
        create: true,
        edit: true
    },
    mineTags: {
        view: true,
        create: true,
        edit: true
    },
    sampleIdentification: {
        view: true,
        create: true,
        edit: true
    },
    USDRate: {
        view: true,
        create: true,
        edit: true,
    },
    rmaFeeRWF:{
        view: true,
    },
    rmaFeeUSD: {
        view: true,
    },
    paymentHistory: {
        view: true,
        create: true,
        edit: true
    },
    shipmentHistory: {
        view: true,
        create: true,
        edit: true
    },
    settings: {
        view: false,
        edit: false
    },
    buyers: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    users: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    contracts: {
        view: true,
        create: true,
        delete: false
    },
    editRequests: {
        view: true,
        authorize: true,
        reject: true
    },
    nonSellAgreement: {
        view: true,
        edit: true
    },
    tags: {
        view: true,
        create: true,
        edit: true,
    },
    fileDirectory: {
        view: true,
        edit: true
    },
    dueDiligence: {
        view: true,
        create: true,
        edit: true,
    },
    comment: {
        view: true,
        create: true,
        edit: true,
    }
}

const ceo = {
    entry: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    suppliers: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    payments: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    shipments: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    mineralGrade: {
        view: true,
        create: true,
        edit: true,
    },
    pricePerUnit: {
        view: true,
        create: true,
        edit: true,
    },
    mineralPrice: {
        view: true,
        create: true,
        edit: true,
    },
    gradeImg: {
        view: true,
        create: true,
        edit: true,
    },
    tantal: {
        view: true,
        create: true,
        edit: true,
    },
    londonMetalExchange: {
        view: true,
        create: true,
        edit: true,
    },
    treatmentCharges: {
        view: true,
        create: true,
        edit: true
    },
    metricTonUnit: {
        view: true,
        create: true,
        edit: true
    },
    USDRate: {
        view: true,
        create: true,
        edit: true,
    },
    rmaFee:{
        view: true,
        add: true,
        edit: true
    },
    paymentHistory: {
        view: true,
        create: true,
        edit: true
    },
    settings: {
        view: false,
        edit: false
    },
    buyers: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    users: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    contracts: {
        view: true,
        create: true,
        delete: false
    },
    editRequests: {
        view: true,
        authorize: true,
        reject: true
    }
}

const operationsManager = {
    entry: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    suppliers: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    payments: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    shipments: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    mineralGrade: {
        view: true,
        create: true,
        edit: true,
    },
    pricePerUnit: {
        view: true,
        create: true,
        edit: true,
    },
    mineralPrice: {
        view: true,
        create: true,
        edit: true,
    },
    gradeImg: {
        view: true,
        create: true,
        edit: true,
    },
    tantal: {
        view: true,
        create: true,
        edit: true,
    },
    londonMetalExchange: {
        view: true,
        create: true,
        edit: true,
    },
    treatmentCharges: {
        view: true,
        create: true,
        edit: true
    },
    metricTonUnit: {
        view: true,
        create: true,
        edit: true
    },
    USDRate: {
        view: true,
        create: true,
        edit: true,
    },
    rmaFee:{
        view: true,
        add: true,
        edit: true
    },
    paymentHistory: {
        view: true,
        create: true,
        edit: true
    },
    settings: {
        view: false,
        edit: false
    },
    buyers: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    users: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    contracts: {
        view: true,
        create: true,
        delete: false
    },
    editRequests: {
        view: true,
        authorize: true,
        reject: true
    }
}

const accountant = {
    entry: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    suppliers: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    payments: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    shipments: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    mineralGrade: {
        view: true,
        create: true,
        edit: true,
    },
    pricePerUnit: {
        view: true,
        create: true,
        edit: true,
    },
    mineralPrice: {
        view: true,
        create: true,
        edit: true,
    },
    gradeImg: {
        view: true,
        create: true,
        edit: true,
    },
    tantal: {
        view: true,
        create: true,
        edit: true,
    },
    londonMetalExchange: {
        view: true,
        create: true,
        edit: true,
    },
    treatmentCharges: {
        view: true,
        create: true,
        edit: true
    },
    metricTonUnit: {
        view: true,
        create: true,
        edit: true
    },
    USDRate: {
        view: true,
        create: true,
        edit: true,
    },
    rmaFee:{
        view: true,
        add: true,
        edit: true
    },
    paymentHistory: {
        view: true,
        create: true,
        edit: true
    },
    settings: {
        view: false,
        edit: false
    },
    buyers: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    users: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    contracts: {
        view: true,
        create: true,
        delete: false
    },
    editRequests: {
        view: true,
        authorize: true,
        reject: true
    },
    nonSellAgreementWeight: {
        view: true,
        edit: true
    }
}

const labTechnician = {
    entry: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    suppliers: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    payments: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    shipments: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    mineralGrade: {
        view: true,
        create: true,
        edit: true,
    },
    pricePerUnit: {
        view: true,
        create: true,
        edit: true,
    },
    mineralPrice: {
        view: true,
        create: true,
        edit: true,
    },
    gradeImg: {
        view: true,
        create: true,
        edit: true,
    },
    tantal: {
        view: true,
        create: true,
        edit: true,
    },
    londonMetalExchange: {
        view: true,
        create: true,
        edit: true,
    },
    treatmentCharges: {
        view: true,
        create: true,
        edit: true
    },
    metricTonUnit: {
        view: true,
        create: true,
        edit: true
    },
    USDRate: {
        view: true,
        create: true,
        edit: true,
    },
    rmaFee:{
        view: true,
        add: true,
        edit: true
    },
    paymentHistory: {
        view: true,
        create: true,
        edit: true
    },
    settings: {
        view: false,
        edit: false
    },
    buyers: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    users: {
        view: true,
        create: true,
        edit: true,
        delete: true
    },
    contracts: {
        view: true,
        create: true,
        delete: false
    },
    editRequests: {
        view: true,
        authorize: true,
        reject: true
    },
}

exports.permissions = {
    storekeeper,
    traceabilityOfficer,
    managingDirector,
    operationsManager,
    ceo,
    accountant,
    labTechnician
}

const specialStrings = ["TINNumber", "rmaFee", "USDRate", "rmaFeeUSD", "rmaFeeRWF"];


exports.toCamelCase = str => {
    if (specialStrings.includes(str)) return str;
    return str.split(' ').map((word, index) => {
        if (index === 0) {
            return word.toLowerCase();
        } else {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
    }).join('');
}

exports.toInitialCase = str => {
    if (str === "TINNumber") return "TIN Number";
    if (str === "rmaFee") return "RMA Fee";
    if (str === "USDRate") return "USD Rate";
    if (str === "rmaFeeUSD") return "RMA Fee USD";
    if (str === "rmaFeeRWF") return "RMA Fee RWF";
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, function (str) {
            return str.toUpperCase();
        });
}

exports.updateMineTags = async (mineTags, entry) => {
    for (const tag of mineTags) {
        if (tag.tagNumber === "") continue;
        const existingTag = await Tag.findOne({tagNumber: tag.tagNumber, tagType: "mine"});
        if (!existingTag) {
            const newTag = await Tag.create(
                {
                    tagNumber: tag.tagNumber,
                    tagType: "mine",
                    weight: Number(tag.weight),
                    sheetNumber: tag.sheetNumber,
                    supplierId: entry.supplierId,
                    // status: tag.status,
                    entryId: entry._id,
                }
            )
            if (newTag) {
                entry.mineTags.push(newTag._id);
            }
        } else {
            if (existingTag.tagNumber !== tag.tagNumber) existingTag.tagNumber = tag.tagNumber;
            if (existingTag.weight !== tag.weight) existingTag.weight = tag.weight;
            if (existingTag.sheetNumber !== tag.sheetNumber) existingTag.sheetNumber = tag.sheetNumber;
            if (existingTag.supplierId !== entry.supplierId) existingTag.supplierId = entry.supplierId;
            if (existingTag.entryId !== entry._id) existingTag.entryId = entry._id;
            if (!entry.mineTags.includes(new mongoose.Types.ObjectId(existingTag._id))) {
                entry.mineTags.push(existingTag._id);
            }
            // if (existingTag.status !== tag.status) existingTag.status = tag.status;
            await existingTag.save({validateModifiedOnly: true});
        }
    }
}

exports.updateNegociantTags = async (negociantTags, entry) => {
    for (const tag of negociantTags) {
        if (tag.tagNumber === '') continue;
        const existingTag = await Tag.findOne({tagNumber: tag.tagNumber, tagType: "negociant", entryId: entry._id});
        if (!existingTag) {
            const newTag = await Tag.create(
                {
                    tagNumber: tag.tagNumber,
                    tagType: "negociant",
                    weight: tag.weight,
                    sheetNumber: tag.sheetNumber,
                    // status: tag.status,
                    entryId: entry._id,
                }
            )
            if (newTag) entry.negociantTags.push(newTag._id);
        } else {
            if (existingTag.tagNumber !== tag.tagNumber) existingTag.tagNumber = tag.tagNumber;
            if (existingTag.weight !== tag.weight) existingTag.weight = tag.weight;
            if (existingTag.sheetNumber !== tag.sheetNumber) existingTag.sheetNumber = tag.sheetNumber;
            if (existingTag.entryId !== entry._id) existingTag.entryId = entry._id;

            if (!entry.negociantTags.includes(new mongoose.Types.ObjectId(existingTag._id))) {
                entry.negociantTags.push(existingTag._id);
            }
            // if (existingTag.status !== tag.status) existingTag.status = tag.status;
            await existingTag.save({validateModifiedOnly: true});
        }
    }
}

exports.getModelAcronym = (model) => {
    if (model.toLowerCase() === "cassiterite") return "SNO2";
    if (model.toLowerCase() === "coltan") return "TA2O5";
    if (model.toLowerCase() === "wolframite") return "WO3";
    if (model.toLowerCase() === "mixed") return "MIXED";
    if (model.toLowerCase() === "lithium") return "LITHIUM";
    if (model.toLowerCase() === "beryllium") return "BERYLLIUM";
}

exports.completeYearStock = (unCompleteStock, currentStock, model) => {
    // explain code
    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
    const dataMap = new Map(unCompleteStock.map(item => [item._id, item]));
    const result = allMonths.map(month => ({
        _id: month,
        totalWeightOut: dataMap.has(month) ? dataMap.get(month).totalWeightOut : 0
    }));
    result.map(value => {
        if (!currentStock[model])  {
            currentStock[model] = [value.totalWeightOut];
        } else {
            currentStock[model].push(value.totalWeightOut);
        }
    })
}

exports.getSFDT = async (buffer, res, next, options={}) => {
    const formData = new FormData();
    formData.append('file', buffer, {
        filename: 'file.docx', // Specify the desired file name
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // Set the content type for DOCX
    });
    axios.post('https://services.syncfusion.com/react/production/api/documenteditor/Import', formData, {
        headers: formData.getHeaders() // Set the appropriate headers for FormData
    })
        .then((response) => {
            res
                .status(200)
                .json(
                    {
                        status: "Success",
                        sfdt: response.data,
                        ...options
                    }
                )
            ;
        })
        .catch((error) => {
            return next(new AppError(error.message, 400));
            // console.error('Error:', error.message); // Handle any errors
        });
}

exports.replaceSpecialCharacters = (str) => {
    if (!str) return "";
    const regex = /[^a-zA-Z0-9]/g;
    return str.replace(regex, '');
    // return str
    //     .replace(/[\u0300-\u036f]/g, "")
    //     .replace(/[^\w\s]/gi, '')
    //     .replace(/\s+/g, ' ')
    //     .trim()
    //     .toLowerCase();
}

exports.filterResponse = (data, permissions, model) => {
    if (!data) return {};
    const filteredData = {...data};
    if (["cassiterite", "coltan", "wolframite"].includes(model)) {
        filteredData["output"] = [];
        if (filteredData.output) {
            for (const lot of filteredData.output) {
                const filteredLot = {};
                for (const [key, value] of Object.entries(lot)) {
                    if (Object.keys(permissions).includes(key)) {
                        if (permissions[key].view) filteredLot[key] = value;
                    } else {
                        filteredLot[key] = value;
                    }
                }
                filteredData["output"].push(filteredLot);
            }
        }
    } else {
        for (const [key, value] of Object.entries(filteredData)) {
            if (Object.keys(permissions).includes(key)) {
                if (permissions[key].view) filteredData[key] = value;
            } else {
                filteredData[key] = value;
            }
        }
    }
    return filteredData;
}

const decideOutput = (model, type) => {
    if (type === "mixed") {
        if (model === "cassiterite") return "cassiteriteOutput";
        if (model === "coltan") return "coltanOutput";
    }
    return "output";
}

exports.decideRMARate = async (model) => {
    const settings = await Settings.findOne();
    if (!settings) {
        if (model === "cassiterite") return settings["rmaFeeCassiterite"];
        if (model === "coltan") return settings["rmaFeeColtan"];
        if (model === "wolframite") return settings["rmaFeeWolframite"];
        if (model === "lithium") return settings["rmaFeeLithium"];
        if (model === "beryllium") return settings["rmaFeeBeryllium"];
    }
}

exports.createNewEntry = async (req, Entry, model) => {
    return await Entry.create(
        {
            supplierId: req.body.supplierId,
            companyName: req.body.companyName,
            licenseNumber: req.body.licenseNumber,
            beneficiary: req.body.beneficiary,
            TINNumber: req.body.TINNumber,
            mineralType: req.body.mineralType,
            // representativeId: supplier.representativeId,
            email: req.body.email,
            output: req.body[decideOutput(model, req.body.mineralType)],
            representativePhoneNumber: req.body.representativePhoneNumber,
            numberOfTags: req.body.numberOfTags,
            weightIn: req.body.weightIn,
            weightOut: req.body.weightOut,
            supplyDate: req.body.supplyDate,
            time: req.body.time,
        }
    );
}

exports.findCurrentStock = (schema) => async function () {
    const result = await schema.find(
        {
            $and: [
                {
                    $expr: {
                        $gt: ['$output.cumulativeAmount', 0]
                    }
                },
            ]
        }
    );
    return result.reduce((acc, curr) => acc + curr.output.reduce((acc, curr) => acc + curr.cumulativeAmount, 0), 0);
}

exports.generateOTP = () => {
    totp.options = {
        step: 600,
        algorithm: 'sha512',
        digits: 6
    }
    return totp.generate(process.env.TOTP_SECRET);
}

const multerStorage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, `${__dirname}/../public/data/temp-images-dir`);
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


exports.calculatePricePerUnit = (tantal, grade) => {
    if (tantal && grade) {
        return (tantal * grade);
    }
}

const ExpensesModel = require('../models/expensesModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const path = require("path");
const multer = require("multer");
const imagekit = require('../utils/imagekit');
const fs = require('fs');

exports.getExpenses = catchAsync(async (req, res, next) => {
    const result = new APIFeatures(ExpensesModel.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const expenses = await result.mongooseQuery;
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    expenses
                }
            }
        )
    ;
});

exports.getOneExpense = catchAsync(async (req, res, next) => {
    const expense = await ExpensesModel.findById(req.params.expenseId);
    if (!expense) return next(new AppError("No expense found with that ID", 404));
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    expense
                }
            }
        )
    ;
})

exports.addExpense = catchAsync(async (req, res, next) => {
    const newExpense = await ExpensesModel.create(
        {
            name: req.body.name,
            date: req.body.date,
            amount: req.body.amount,
            description: req.body.description,
            typeOfExpense: req.body.typeOfExpense,
        }
    );
    if (req.file) {
        const data = fs.readFileSync(req.file.path);
        const response = await imagekit.upload(
            {
                file: data,
                fileName: `${req.body.name}_${req.body.amount}_${req.body.typeOfExpense}${path.extname(req.file.filename)}`,
                folder: "supporting-documents"
            }
        )
        if (response) {
            newExpense.supportingDocument.fileId = response.fileId;
            newExpense.supportingDocument.filePath = response.url;
        }
    }
    await newExpense.save();
    res
        .status(201)
        .json(
            {
                status: "Success",
                data: {
                    newExpense
                }
            }
        )
    ;
});

exports.updateExpense = catchAsync(async (req, res, next) => {
    const expense = await ExpensesModel.findById(req.params.expenseId);
    if (!expense) return next(new AppError("No expense found with that ID", 404));
    if (req.file) {
        const data = fs.readFileSync(req.file.path);
        const response = await imagekit.upload(
            {
                file: data,
                fileName: `${req.file.filename}`,
                folder: "supporting-documents"
            }
        )
        // TODO 28: DELETE FILE AFTER UPLOADING
        if (response) {
            expense.supportingDocument.fileId = response.fileId;
            expense.supportingDocument.filePath = response.url;
        }
    }
    if (req.body.date) expense.date = req.body.date;
    if (req.body.amount) expense.amount = req.body.amount;
    if (req.body.description) expense.description = req.body.description;
    if (req.body.name) expense.name = req.body.name;
    if (req.body.typeOfExpense) expense.typeOfExpense = req.body.typeOfExpense;
    // if (req.body.supportingDocument.fileId === '') expense.supportingDocument.fileId = '';
    // if (req.body.supportingDocument.filePath === '') expense.supportingDocument.filePath = '';
    await expense.save();
    res
        .status(201)
        .json(
            {
                status: "Success"
            }
        )
    ;
});

exports.deleteExpense = catchAsync(async (req, res, next) => {
    const expense = await ExpensesModel.findByIdAndDelete(req.params.expenseId);
    if (!expense) return next(new AppError("No expense found with that ID", 404));
    res
        .status(204)
        .json(
            {
                status: "Success"
            }
        )
    ;
});



const multerStorage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, `${__dirname}/../public/data/temp`);
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
    const allowExtension = ['.png', '.jpg', '.jpeg', '.pdf', ".doc", '.docx'];
    if (allowExtension.includes(fileExtension.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new AppError("Invalid file format", 400), false);
    }
}

const upload = multer(
    {
        storage: multerStorage,
        fileFilter: multerFilter
    }
)

exports.uploadSupportingDocument = upload;
const ExpensesModel = require('../models/expensesModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');


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
    if (req.body.date) expense.date = req.body.date;
    if (req.body.amount) expense.amount = req.body.amount;
    if (req.body.description) expense.description = req.body.description;
    if (req.body.name) expense.name = req.body.name;
    if (req.body.typeOfExpense) expense.typeOfExpense = req.body.typeOfExpense;
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
const BeneficiaryModel = require('../models/beneficiaryModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');



exports.getBeneficiaries = catchAsync(async (req, res, next) => {
    const beneficiaries = await BeneficiaryModel.find();
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    beneficiaries
                }
            }
        )
    ;
});

exports.getOneBeneficiary = catchAsync(async (req, res, next) => {
    const beneficiary = await BeneficiaryModel.findById(req.params.beneficiaryId);
    if (!beneficiary) return next(new AppError("No beneficiary found with that ID", 404));
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    beneficiary
                }
            }
        )
    ;
});

exports.addBeneficiary = catchAsync(async (req, res, next) => {
    const newBeneficiary = await BeneficiaryModel.create(
        {
            name: req.body.name,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
        }
    );
    res
        .status(201)
        .json(
            {
                status: "Success",
                data: {
                    newBeneficiary
                }
            }
        )
    ;
});

exports.updateBeneficiary = catchAsync(async (req, res, next) => {
    const beneficiary = await BeneficiaryModel.findById(req.params.beneficiaryId);
    if (!beneficiary) return next(new AppError("No beneficiary found. Please try again", 404));
    if (req.body.name) beneficiary.name = req.body.name;
    if (req.body.phoneNumber) beneficiary.phoneNumber = req.body.phoneNumber;
    if (req.body.address) beneficiary.address = req.body.address;
    await beneficiary.save();
    res
        .status(202)
        .json(
            {
                status: "Success",
                data: {
                    beneficiary
                }
            }
        )
    ;
});

exports.deleteBeneficiary = catchAsync(async (req, res, next) => {
    const beneficiary = await BeneficiaryModel.findByIdAndDelete(req.params.beneficiaryId);
    if (!beneficiary) return next(new AppError("No beneficiary found. Please try again", 404));
    res
        .status(204)
        .json(
            {
                status: "Success",
                data: null
            }
        )
    ;
});
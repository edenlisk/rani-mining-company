const Settings = require('../models/settingsModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getSettings = catchAsync(async (req, res, next) => {
    const settings = await Settings.findOne().limit(1);
    if (!settings) return next(new AppError("Settings are currently unavailable", 400));
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    settings
                }
            }
        )
    ;
})

exports.addSetting = catchAsync(async (req, res, next) => {
    await Settings.create(
        {
            rmaFeeColtan: 125,
            rmaFeeCassiterite: 50,
            rmaFeeWolframite: 50,
            nameOfCompany: req.body.nameOfCompany,
            editExpiresIn: req.body.editExpiresIn,
        }
    )
    res
        .status(201)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.updateSettings = catchAsync(async (req, res, next) => {
    const settings = await Settings.findOne().limit(1);
    if (req.body.rmaFeeColtan) settings.rmaFeeColtan = req.body.rmaFeeColtan;
    if (req.body.rmaFeeCassiterite) settings.rmaFeeCassiterite = req.body.rmaFeeCassiterite;
    if (req.body.rmaFeeWolframite) settings.rmaFeeWolframite = req.body.rmaFeeWolframite;
    if (req.body.rmaFeeLithium) settings.rmaFeeLithium = req.body.rmaFeeLithium;
    if (req.body.rmaFeeBeryllium) settings.rmaFeeBeryllium = req.body.rmaFeeBeryllium;
    if (req.body.address) settings.address = req.body.address;
    if (req.representative) settings.representative = req.body.representative;
    if (req.body.nameOfCompany) settings.nameOfCompany = req.body.nameOfCompany;
    if (req.body.editExpiresIn) settings.editExpiresIn = req.body.editExpiresIn;
    if (req.body.logsLifeTime) settings.logsLifeTime = req.body.logsLifeTime;
    await settings.save({validateModifiedOnly: true});
    res
        .status(202)
        .json(
            {
                status: "Success"
            }
        )
    ;
})
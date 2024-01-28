const SampleCode = require('../models/sampleCodeModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');



exports.getAllSampleCodes = catchAsync(async (req, res, next) => {
    const sampleCodes = await SampleCode.find({isCodeUsed: false});
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    sampleCodes
                }
            }
        )
    ;
})

exports.updateSampleCode = catchAsync(async (req, res, next) => {
    const sampleCode = await SampleCode.findById(req.params.sampleId);
    if (!sampleCode) return next(new AppError("This sample code no longer exists!", 400));
    if (req.body.isCodeUsed === false) sampleCode.isCodeUsed = false;
    if (req.body.isCodeUsed === false) sampleCode.isCodeUsed = true;
    await sampleCode.save({validateModifiedOnly: true});
    res
        .status(202)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.generateSampleCode = catchAsync(async (req, res, next) => {
    
})
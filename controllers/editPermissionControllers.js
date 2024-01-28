const EditPermission = require('../models/editPermissionModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');


exports.getAllEditRequests = catchAsync(async (req, res, next) => {
    const result = new APIFeatures(EditPermission.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()
    ;
    const editRequests = await result.mongooseQuery;
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    editRequests
                }
            }
        )
    ;
})

exports.createEditRequest = catchAsync(async (req, res, next) => {
    const editRequest = await EditPermission.create(
        {
            editableFields: req.body.editableFields,
            recordId: req.body.recordId,
            model: req.body.model,
            username: req.body.username
        }
    )
    res
        .status(201)
        .json(
            {
                status: "Success",
                data: {
                    editRequest
                }
            }
        )
    ;
})

exports.updateEditRequest = catchAsync(async (req, res, next) => {
    const editRequest = await EditPermission.findById(req.params.requestId);
    if (!editRequest) return next(new AppError("Edit request was not found!", 400));
    if (!(new Date() > editRequest.editExpiresAt)) {
        if (req.body.decision === true) editRequest.decision = true;
        if (req.body.decision === false) editRequest.decision = false;
        if (req.body.requestStatus) editRequest.requestStatus = req.body.requestStatus;
    }
    await editRequest.save({validateModifiedOnly: true});
    res
        .status(201)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.getOneEditRequest = catchAsync(async (req, res, next) => {
    const editRequest = await EditPermission.findById(req.params.requestId);
    if (!editRequest) return next(new AppError("Selected Request was not found!", 400));
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    editRequest
                }
            }
        )
    ;
})


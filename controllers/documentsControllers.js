const Document = require('../models/documentsModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.createDocument = catchAsync(async (req, res, next) => {
    const document = await Document.create(
        {
            sfdt: req.body.sfdt,
            name: req.body.name,
            fileId: req.body.fileId,
            fileUrl: req.body.fileUrl
        }
    );
    res
        .status(201)
        .json(
            {
                status: "Success",
                data: {
                    document
                }
            }
        )
    ;
})

exports.updateDocument = catchAsync(async (req, res, next) => {
    const document = await Document.findById(req.params.documentId);
    if (!document) return next(new AppError('Document was not found', 400));
    if (req.body.sfdt) document.sfdt = req.body.sfdt;
    if (req.body.name) document.name = req.body.name;
    if (req.body.fileId) document.fileId = req.body.fileId;
    if (req.body.fileUrl) document.fileUrl = req.body.fileUrl;
    await document.save({validateModifiedOnly: true});
    res
        .status(202)
        .json(
            {
                status: "Success",
            }
        )
    ;
})
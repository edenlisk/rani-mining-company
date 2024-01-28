const Tag = require('../models/tagsModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllTags = catchAsync(async (req, res, next) => {
    const tags = await Tag.find().populate({
        path: "entryId supplierId",
        select: "companyName beneficiary weightIn numberOfTags mineralType output supplyDate",
    }).sort({ createdAt: -1 })
    res
        .status(200)
        .json(
            {
                status: "success",
                data: {
                    tags
                }
            }
        )
    ;
})

exports.updateTag = catchAsync(async (req, res, next) => {
    const tag = await Tag.findOneAndUpdate(
        { tagNumber: req.params.tagNumber },
        {
            status: req.body.status,
            exportDate: new Date(),
        },
        {new: true});
    console.log(req.body)
    if (!tag) return next(new AppError("Unable to update tag status"));
    res
        .status(201)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.createTag = catchAsync(async (req, res, next) => {
    await Tag.create(
        {
            tagNumber: req.body.tagNumber,
            supplierId: req.body.supplierId,
            sheetNumber: req.body.sheetNumber,
            weight: req.body.weight,
            status: "in store",
            tagType: "mine"
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

exports.getSupplierTags = catchAsync(async (req, res, next) => {
    const tags = await Tag.find({ supplierId: req.params.supplierId, tagType: "mine", status: "in store", entryId: null });
    res
        .status(200)
        .json(
            {
                status: "success",
                data: {
                    tags
                }
            }
        )
    ;
})

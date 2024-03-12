const AssetsModel = require("../models/assetsModel");
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');


exports.getAllAssets = catchAsync(async (req, res, next) => {
    const result = new APIFeatures(AssetsModel.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()
    ;
    const assets = await result.mongooseQuery;
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    assets
                }
            }
        )
    ;
})

exports.getOneAsset = catchAsync(async (req, res, next) => {
    const asset = await AssetsModel.findById(req.params.assetId);
    if (!asset) return next(new AppError("Selected asset was not found", 401));
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    asset
                }
            }
        )
    ;
})

exports.updateAsset = catchAsync(async (req, res, next) => {
    const asset = await AssetsModel.findById(req.params.assetId);
    if (!asset) return next(new AppError("Selected assets was not found", 400));
    if (req.body.name) asset.name = req.body.name;
    if (req.body.price) asset.price = req.body.price;
    if(req.body.category) asset.category = req.body.category;
    if (req.body.comment) asset.comment = req.body.comment;
    if (req.body.numberOfItems) asset.numberOfItems = req.body.numberOfItems;
    if (req.body.status) asset.status = req.body.status;
    await asset.save({validateModifiedOnly: true});
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    asset
                }
            }
        )
    ;
})

exports.createAsset = catchAsync(async (req, res, next) => {
    const asset = await AssetsModel.create(
        {
            name: req.body.name,
            price: req.body.price,
            category: req.body.category,
            numberOfItems: req.body.numberOfItems,
            comment: req.body.comment,
            status: req.body.status
        }
    )
    res
        .status(204)
        .json(
            {
                status: "Success",
            }
        )
    ;
})

exports.deleteAsset = catchAsync(async (req, res, next) => {
    const asset = await AssetsModel.findByIdAndDelete(req.params.assetId);
    if (!asset) return next(new AppError("Asset was not deleted, Please try again!", 400));
    res
        .status(204)
        .json(
            {
                status: "Success"
            }
        )
    ;
})
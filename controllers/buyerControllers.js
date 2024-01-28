const Buyer = require('../models/buyerModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.getAllBuyers = catchAsync(async (req, res, next) => {
    const buyers = await Buyer.aggregate(
        [
            {
                $match: { }
            },
            {
                $lookup: {
                    from: 'contracts',
                    localField: '_id',
                    foreignField: 'buyerId',
                    as: 'contracts'
                }
            },
            {
                $lookup: {
                    from: 'duediligences',
                    localField: '_id',
                    foreignField: 'buyerId',
                    as: 'duediligences'
                }
            }
        ]
    )
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    buyers
                }
            }
        )
    ;
})

exports.createBuyer = catchAsync(async (req, res, next) => {
    await Buyer.create(
        {
            name: req.body.name,
            email: req.body.email,
            country: req.body.country,
            address: req.body.address,
            destination: req.body.destination,
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

exports.getOneBuyer = catchAsync(async (req, res, next) => {
    const buyer = await Buyer.findOne({_id: req.params.buyerId});
    if (!buyer) return next(new AppError("The Selected buyer no longer exists!", 400));
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    buyer
                }
            }
        )
    ;
})

exports.updateBuyer = catchAsync(async (req, res, next) => {
    const buyer = await Buyer.findOne({_id: req.params.buyerId});
    if (!buyer) return next(new AppError("The selected buyer no longer exists!", 400));
    if (req.body.name) buyer.name = req.body.name;
    if (req.body.email) buyer.email = req.body.email;
    if (req.body.country) buyer.country = req.body.country;
    if (req.body.address) buyer.address = req.body.address;
    if (req.body.destination) buyer.destination = req.body.destination;
    await buyer.save({validateModifiedOnly: true});
    res
        .status(201)
        .json(
            {
                status: "Success",
            }
        )
    ;
})

exports.deleteBuyer = catchAsync(async (req, res, next) => {
    const buyer = await Buyer.findByIdAndDelete(req.params.buyerId);
    if (!buyer) return next(new AppError("The Selected buyer no longer exists!", 400));
    res
        .status(204)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

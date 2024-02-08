const User = require('../models/usersModel');
const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { logger } = require('../utils/loggers');

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    users
                }
            }
        )
    ;
})

exports.getOneUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.userId);
    if (!user) return next(new AppError("The Selected user no longer exists!", 400));
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    user
                }
            }
        )
    ;
})

exports.updateUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.userId);
    if (!user) return next(new AppError("The Selected user no longer exists!", 400));
    if (req.body.permissions) user.permissions = req.body.permissions;
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.username) user.username = req.body.username;
    if (req.body.role) user.role = req.body.role;
    if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;
    if (req.body.secretCodeVerified === true) user.secretCodeVerified = true;
    if (req.body.secretCodeVerified === false) user.secretCodeVerified = false;
    if (req.body.active === true) {
        user.active = true;
        logger.info(`${user.name}'s account re-activated successfully`);
    }
    if (req.body.active === false) {
        user.active = false;
        logger.warn(`${user.name}'s account suspended/de-activated successfully`);
    }
    await user.save({validateModifiedOnly: true});
    res
        .status(202)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (user) {
        logger.warn(`${user.name}'s account deleted successfully`);
    }
    res
        .status(204)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.getNotifications = catchAsync(async (req, res, next) => {
    // const notifications = await User.findById(req.params.userId).select({notifications: 1, _id: 1});
    const notifications = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(req.params.userId) } },
        {
            $unwind: '$notifications',
        },
        {
            $sort: {
                'notifications.createdAt': -1,
            },
        },
        {
            $group: {
                _id: '$_id',
                notifications: { $push: '$notifications' },
            },
        },
        {
            $project: {
                _id: 1,
                notifications: 1,
            },
        },
        {
            $limit: 20,
        }
    ]);
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    notifications
                }
            }
        )
    ;
})

exports.updateNotificationStatus = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.userId).select({notifications: 1, _id: 1});
    if (user) {
        const notification = user.notifications.find(item => item._id.equals(req.params.notificationId));
        if (notification) {
            notification.read = true;
        }
        await user.save({validateModifiedOnly: true});
    }
    res
        .status(200)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

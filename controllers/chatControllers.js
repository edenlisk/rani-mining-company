const ChatModel = require('../models/chatModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.createChat = catchAsync(async (req, res, next) => {
    const newChat = await ChatModel.create(
        {
            members: [req.body.senderId, req.body.receiverId]
        }
    )
    if (!newChat) return next(new AppError("Unable to initialize new chat"));
    res
        .status(202)
        .json(
            {
                status: "Success",
                data: {
                    newChat
                }
            }
        )
    ;
})

exports.userChats = catchAsync(async (req, res, next) => {
    const chats = await ChatModel.find(
        {
            members: {$in: [req.params.userId]}
        }
    )
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    chats
                }
            }
        )
    ;
})

exports.findChat = catchAsync(async (req, res, next) => {
    const chat = await ChatModel.findOne(
        {
            members: {$all: [req.params.firstId, req.params.secondId]}
        }
    )
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    chat
                }
            }
        )
    ;
})

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Contract = require('../models/contractModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendAttachment } = require('../utils/helperFunctions');
const imagekit = require('../utils/imagekit');
const { logger } = require('../utils/loggers');


exports.getAllContracts = catchAsync(async (req, res, next) => {
    const contracts = await Contract.find();
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    contracts
                }
            }
        )
    ;
})

exports.getBuyerContracts = catchAsync(async (req, res, next) => {
    const contracts = await Contract.find({buyerId: req.params.buyerId});
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    contracts
                }
            }
        )
    ;
})

exports.downloadContract = catchAsync(async (req, res, next) => {
    const contract = await Contract.findById(req.params.contractId);
    if (!contract) {
        return next(new AppError("The Selected contract no longer exists!", 400));
    }
    const fileName = contract.name;
    const filePath = `${__dirname}/../public/data/contracts/${fileName}`;
    if (!fs.existsSync(filePath)) {
        return next(new AppError("File not found", 404));
    }
    sendAttachment(filePath, fileName, res);
})

exports.createContract = catchAsync(async (req, res, next) => {
    const contract = new Contract(
        {
            name: req.file?.originalname,
            minerals: req.body.minerals,
            contractStartDate: req.body.contractStartDate,
            contractExpiryDate: req.body.contractExpiryDate,
            buyerName: req.body.buyerName,
            buyerId: req.body.buyerId
        }
    )
    if (req.file) {
        const fileData = fs.readFileSync(req.file.path);
        const response = await imagekit.upload(
            {
                file: fileData,
                fileName: req.file.originalname,
                folder: "/contracts"
            }
        )
        if (response) {
            contract.filePath = response.url;
            await contract.save({validateModifiedOnly: true});
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.log(err.message);
                    logger.warn(err);
                } else {
                    console.log("File deleted successfully");
                }
            })
        }
    }
    // if (req.file) {
    //     fs.readFile(req.file.path, (err, data) => {
    //         if (err) {
    //             console.log(err.message);
    //             logger.warn(err);
    //         } else {
    //             imagekit.upload(
    //                 {
    //                     file: data,
    //                     fileName: req.body.name,
    //                     folder: "/contracts"
    //                 }
    //             ).then(response => {
    //                 if (response) {
    //                     contract.filePath = response.url;
    //                     fs.unlink(req.file.path, (err) => {
    //                         if (err) {
    //                             console.log(err.message);
    //                             logger.warn(err);
    //                         } else {
    //                             console.log("File deleted successfully");
    //                         }
    //                     })
    //                 }
    //             })
    //         }
    //     })
    // }
    // await contract.save({validateModifiedOnly: true});


    res
        .status(201)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.deleteContract = catchAsync(async (req, res, next) => {
    const contract = await Contract.findByIdAndDelete(req.body.contractId);
    if (!contract) return next(new AppError("The Selected contract no longer exists!", 400));
    const filePath = `${__dirname}/../public/data/contracts/${contract.name}`;
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, err => {
            if (err) {
                console.log(err);
            }
            console.log('File removed successfully');
        })
    } else {
        return next(new AppError("File not found", 404));
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

exports.updateContract = catchAsync(async (req, res, next) => {
    const contract = await Contract.findById(req.params.contractId);
    if (!contract) return next(new AppError("The Contract no longer exists", 400));
    if (req.file) contract.name = req.file.filename;
    if (req.body.minerals) contract.minerals = req.body.minerals;
    if (req.body.contractStartDate) contract.contractStartDate = req.body.contractStartDate;
    if (req.body.contractExpiryDate) contract.contractExpiryDate = req.body.contractExpiryDate;
    await contract.save({validateModifiedOnly: true});
    res
        .status(202)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

const multerStorage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, 'public/data/contracts');
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    }
)

const multerFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const allowExtension = ['.doc', '.docx', '.pdf', '.jpg', '.jpeg', '.png'];
    if (allowExtension.includes(fileExtension.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new AppError("Not a .doc, .docx, .jpeg , .jpg, .png or .pdf selected", 400), false);
    }
}

const upload = multer(
    {
        storage: multerStorage,
        fileFilter: multerFilter
    }
)

exports.uploadContract = upload;
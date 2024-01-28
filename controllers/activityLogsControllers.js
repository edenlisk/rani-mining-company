const ActivityLogs = require('../models/activityLogsModel');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const { toInitialCase } = require('../utils/helperFunctions');


exports.getAllLogs = catchAsync(async (req, res, next) => {
    const results = new APIFeatures(ActivityLogs.find(), req.query)
        .filter()
        .sort()
        .paginate()
    ;
    const logs = await results.mongooseQuery;
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    logs
                }
            }
        )
    ;
})

exports.getUserLogs = catchAsync(async (req, res, next) => {
    const results = new APIFeatures(ActivityLogs.find({userId: req.params.userId}), req.query)
        .filter()
        .sort()
        .paginate()
    ;
    const logs = await results.mongooseQuery;
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    logs
                }
            }
        )
    ;
})

const checkObject = (obj) => {
    return (obj !== null && typeof obj === "object");
}

exports.trackUpdateModifications = (body, entry, req) => {
    const modifications = [];
    const exemptedFields = ["_id", "__v", "_v", "createdAt", "updatedAt", "shipmentHistory", "supplierId", "entryId", "isSupplierBeneficiary", "paymentHistory", "id"];
    for (const key in body) {
        if (body.hasOwnProperty(key) && !exemptedFields.includes(`${key}`)) {
            if (`${key}` !== "output" && body[key] !== entry[key] && !checkObject(body[key]) && body[key] !== null) {
                modifications.push(
                    {
                        fieldName: `${toInitialCase(key)}`,
                        initialValue: entry[key],
                        newValue: body[key]
                    }
                );
            } else if (`${key}` === "output") {
                for (const lot of body.output) {
                    for (const key in lot) {
                        if (lot.hasOwnProperty(key) && !exemptedFields.includes(`${key}`)) {
                            if (!checkObject(lot[key])) {
                                if (lot[key] !== entry.output[body.output.indexOf(lot)][key] && lot[key] !== null) {
                                    modifications.push(
                                        {
                                            fieldName: `${toInitialCase(key)}`,
                                            initialValue: entry.output[body.output.indexOf(lot)][key],
                                            newValue: lot[key]
                                        }
                                    );
                                }
                            } else {
                                if (typeof lot[key] === "object") {
                                    for (const subKey in lot[key]) {
                                        if (lot[key].hasOwnProperty(subKey)) {
                                            if (!checkObject(lot[key][subKey])) {
                                                if (lot[key][subKey] !== entry.output[body.output.indexOf(lot)][key][subKey] && lot[key][subKey] !== null) {
                                                    modifications.push(
                                                        {
                                                            fieldName: `${toInitialCase(subKey)}`,
                                                            initialValue: entry.output[body.output.indexOf(lot)][key][subKey],
                                                            newValue: lot[key][subKey]
                                                        }
                                                    );
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                        }
                    }
                }
            } else if (`${key}` === "mineTags" || `${key}` === "negociantTags") {
                if (`${key}` === "mineTags") {
                    for (const tag of body.mineTags) {
                        const entryTag = entry.mineTags.find((el) => el.tagNumber === tag.tagNumber);
                        if (entryTag) {
                            for (const key in tag) {
                                if (tag.hasOwnProperty(key) && !exemptedFields.includes(`${key}`)) {
                                    if (tag[key] !== entryTag[key] && tag[key] !== null) {
                                        modifications.push(
                                            {
                                                fieldName: `${toInitialCase(key)}`,
                                                initialValue: entryTag[key],
                                                newValue: tag[key]
                                            }
                                        );
                                    }
                                }
                            }
                        }
                    }
                } else if (`${key}` === "negociantTags") {
                    for (const tag of body.negociantTags) {
                        const entryTag = entry.negociantTags.find((el) => el.tagNumber === tag.tagNumber);
                        if (entryTag) {
                            for (const key in tag) {
                                if (tag.hasOwnProperty(key) && !exemptedFields.includes(`${key}`)) {
                                    if (tag[key] !== entryTag[key] && tag[key] !== null) {
                                        modifications.push(
                                            {
                                                fieldName: `${toInitialCase(key)}`,
                                                initialValue: entryTag[key],
                                                newValue: tag[key]
                                            }
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    if (modifications.length > 0) {
        return new ActivityLogs(
            {
                logSummary: `${req.user.username} modified/added ${entry.mineralType} entry`,
                username: req.user.username,
                userId: req.user._id,
                // link: `/complete/${entry.mineralType}/${entry._id}`,
                modifications
            }
        )
    }

}

exports.trackDeleteOperations = (entryId, model, req) => {
    return new ActivityLogs(
        {
            logSummary: `${req.user.username} moved to trash ${model} entry`,
            username: req.user.username,
            userId: req.user._id,
            link: `/trash/${model}/${entryId}`,
            modifications: null
        }
    )

}

exports.trackCreateOperations = (model, req) => {
    return new ActivityLogs(
        {
            logSummary: `${req.user.username} created ${model} entry`,
            username: req.user.username,
            userId: req.user._id,
            // link: `/complete/${model}/${entryId}`,
            modifications: null
        }
    )
}

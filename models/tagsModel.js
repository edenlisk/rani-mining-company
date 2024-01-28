const mongoose = require('mongoose');
const AppError = require('../utils/appError');

const tagsSchema = new mongoose.Schema(
    {
        tagNumber: {
            type: String,
            unique: true,
            maxLength: 7,
            minLength: 7,
            required: [true, "Please provide tag number"]
        },
        tagType: {
            type: String,
            enum: ["mine", "negociant"],
        },
        sheetNumber: {
            type: String,
            default: null
        },
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
        },
        entryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Coltan" || "Wolframite" || "Cassiterite",
            default: null
        },
        status: {
            type: String,
            enum: ["in store", "out of store"],
            default: "in store"
        },
        weight: {
            type: Number,
        },
        registrationDate: {
            type: Date,
            default: () => new Date()
        },
        exportDate: {
            type: Date,
        }
    },
    {
        timestamps: true,
        indexes: [{unique: true, fields: ['tagNumber']}]
    }
)


module.exports = mongoose.model('Tag', tagsSchema);
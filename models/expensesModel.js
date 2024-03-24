const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
    {
        name: {
            // Beneficiary
            type: String,
        },
        date: {
            type: Date,
            default: Date.now
        },
        amount: {
            type: Number,
            required: [true, "An expense must have an amount"]
        },
        description: {
            type: String,
        },
        typeOfExpense: {
            type: String,
            // enum: ['transport', 'fuel', 'labor', 'other'],
        },
        supportingDocument: {
            fileId: String,
            filePath: String
        }
    }, {
        timestamps: true,
        toJSON: {virtuals: true},
        toObject: {virtuals: true},
    }
)

module.exports = mongoose.model('Expense', expenseSchema);
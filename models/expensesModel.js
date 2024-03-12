const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
    {
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
        currency: {
            type: String,
            enum: ['USD', 'RWF']
        }
    }, {
        timestamps: true,
        toJSON: {virtuals: true},
        toObject: {virtuals: true}
    }
)

module.exports = mongoose.model('Expense', expenseSchema);
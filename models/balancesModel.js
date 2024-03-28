const mongoose = require('mongoose');



const balancesSchema = new mongoose.Schema(
    {
        currentBalance: {
            type: Number
        }
    }
)


module.exports = mongoose.model("Balance", balancesSchema);
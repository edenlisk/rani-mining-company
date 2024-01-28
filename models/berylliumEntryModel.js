const mongoose = require('mongoose');
const { lotSchema, entrySchema } = require('../models/entryModel');

const berylliumLotSchema = lotSchema.clone();
berylliumLotSchema.remove('rmaFeeDecision');
berylliumLotSchema.add(
    {
        rmaFeeDecision: {
            type: String,
            default: "exempted"
        }
    }
)

const berylliumSchema = entrySchema.clone();
berylliumSchema.remove(["mineTags", "negociantTags", "numberOfTags"]);
berylliumSchema.add(
    {
        output: {
            type: [berylliumLotSchema],
            default: []
        }
    }
)
berylliumLotSchema.pre('save', async function (next) {
    const { decidePricingGrade } = require("../utils/helperFunctions");
    const Settings = require('../models/settingsModel');
    if (this.isModified(['pricingGrade', 'pricePerUnit', 'weightOut']) && !this.isNew) {
        if (this[decidePricingGrade(this.pricingGrade)] && this.weightOut) {
            this.mineralPrice = (this.pricePerUnit * this.weightOut).toFixed(5);
        }
    }
    if (this.isModified('weightOut')) {
        const { rmaFeeBeryllium } = await Settings.findOne();
        this.rmaFeeRWF = this.weightOut * rmaFeeBeryllium ? rmaFeeBeryllium : 0;
    }
    next();
})

berylliumSchema.statics.findCurrentStock = async function () {
    const result = await this.find(
        {
            $and: [
                {
                    $expr: {
                        $gt: ['$output.cumulativeAmount', 0]
                    }
                },
            ]
        }
    );
    return {
        entries: result,
        balance: result.reduce((acc, curr) => acc + curr.output.reduce((acc, curr) => acc + curr.cumulativeAmount, 0), 0)
    };
}


module.exports = mongoose.model('Beryllium', berylliumSchema);

const fs = require('fs');
const mongoose = require('mongoose');
const isEmail = require('validator/lib/isEmail');

const buyerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide buyer name"]
        },
        email: {
            type: String,
            unique: true,
            validate: [isEmail, "Please provide buyer's email address"],
        },
        country: {
            type: String,
        },
        address: {
            type: String
        },
        destination: {
            type: String
        },
    }
)

buyerSchema.pre('save', async function (next) {
    if (this.isNew) {
        const filePath = `${__dirname}/../public/data/shipment/${this._id}`;
        if (!fs.existsSync(filePath)) {
            fs.mkdir(filePath, {recursive: false}, err => {
                console.log(err)
            })
        }
    }
    next();
})


module.exports = mongoose.model('Buyer', buyerSchema);
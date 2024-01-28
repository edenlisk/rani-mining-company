const mongoose = require('mongoose');
const isEmail = require('validator/lib/isEmail');
const bcrypt = require('bcryptjs');
const { totp } = require('otplib');
const {permissions} = require('../utils/helperFunctions')

const notificationsSchema = new mongoose.Schema(
    {
        message: {
            type: String,
            required: [true, "Notification message is required"]
        },
        read: {
            type: Boolean,
            default: false
        }
    }, {
        timestamps: true
    }
)

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            minLength: 4,
            maxLength: 50,
            required: [true, "Please provide name"]
        },
        username: {
            type: String,
            lowercase: true,
            unique: true,
            required: [true, "Please provide username"],
            minLength: 4,
            maxLength: 20
        },
        phoneNumber: {
            type: String,
            required: [true, "Please provide phone number"],
            unique: true
        },
        email: {
            type: String,
            minLength: 5,
            maxLength: 50,
            required: [true, "Please provide email"],
            unique: true,
            validate: [isEmail, "Please provide valid email"]
        },
        role: {
            type: String,
            required: [true, "Please provide user role"],
            enum: ["managingDirector", "operationsManager", "accountant", "traceabilityOfficer", "storekeeper", "ceo", "laboratoryOfficer"],
            default: () => {
                return "storekeeper"
            }
        },
        notifications: {
            type: [notificationsSchema],
            default: [],
            select: false
        },
        permissions: {
            type: Object,
        },
        password: {
            type: String,
            required: [true, "Please provide a password"],
            minLength: 8,
            select: false
        },
        passwordConfirm: {
            type: String,
            required: [true, "You must confirm the password"],
            validate: {
                validator: function (elem) {
                    return this.password === elem;
                },
                message: "Password does not match"
            },
        },
        profilePicture: {
            fileId: {
                type: String,
                default: null,
            },
            url: {
                type: String,
                default: "https://ik.imagekit.io/mqrq0nywc/users/default-avatar.jpg",
            }
        },
        active: {
            type: Boolean,
            default: () => true
        },
        passwordChangedAt: Date,
        loginAttempts: {
            type: Number,
            default: 0
        },
        secretCode: {
            type: String,
        },
        secretCodeExpiresAt: {
            type: Date,
        }
    },
    {
        indexes: [{unique: true, fields: ['phoneNumber', "email"]}]
    }
);


userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
})

// userSchema.methods.generateOTP = function () {
//     totp.options = {
//         step: 600,
//         algorithm: 'sha512',
//         digits: 6
//     }
//     this.secretCode = totp.generate(process.env.TOTP_SECRET);
//     this.secretCodeExpiresAt = Date.now() + 10 * 60 * 1000;
//     return this.secretCode;
// }

// userSchema.methods.verifyOTP = function (candidateOTP) {
//     return totp.check(candidateOTP, process.env.TOTP_SECRET);
// }

userSchema.methods.verifyPassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
}

module.exports = mongoose.model('User', userSchema);

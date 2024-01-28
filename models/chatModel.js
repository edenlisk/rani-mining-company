const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
    {
        members: {
            type: Array,
            unique: true,
            validate: [
                {
                    validator: function(arr) {
                        return arr.length === 2;
                    },
                    message: 'Members array must contain exactly two user IDs.'
                },
                {
                    validator: function(arr) {
                        arr.sort();
                        return arr[0] !== arr[1];
                    },
                    message: 'Members array must contain distinct user IDs.'
                }
            ]
        },
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Chat', chatSchema);
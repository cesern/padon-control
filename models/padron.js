const   mongoose = require('mongoose'),
        { Schema } = mongoose

const Padron = new Schema({
    delegation: {
        type: Schema.Types.ObjectId,
        ref: "Delegation",
        required: true
    },
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    employee_number:{
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    antiqueness: {
        type: Date,
        default: Date.now,
        require: true
    },
    status:{
        type: Boolean,
        require: true,
        default: true
    },
    reason: {
        type: String
    }
})

module.exports =  mongoose.model('Padron', Padron)
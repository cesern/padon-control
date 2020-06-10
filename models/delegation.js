const   mongoose = require('mongoose'),
        { Schema } = mongoose

const Delegation = new Schema({
    division: {
        type: Schema.Types.ObjectId,
        ref: "Division"
    },
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
})

module.exports =  mongoose.model('Delegation', Delegation)
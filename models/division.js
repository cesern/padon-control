const   mongoose = require('mongoose'),
        { Schema } = mongoose

const Division = new Schema({
    academic_unit: {
        type: Schema.Types.ObjectId,
        ref: "AcademicUnit",
        required: true
    },
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
})

module.exports =  mongoose.model('Division', Division)
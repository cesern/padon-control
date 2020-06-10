const   mongoose = require('mongoose'),
        { Schema } = mongoose

const AcademicUnit = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
})

module.exports =  mongoose.model('AcademicUnit', AcademicUnit)
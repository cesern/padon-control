const   router = require('express').Router(),
        AcademicUnit = require('../models/academic_unit'),
        Division = require('../models/division'),
        Delegation = require('../models/delegation'),
        Padron = require('../models/padron'),
        User = require('../models/user'),
        admin = require('../middlewares/admin_session'),
        super_admin = require('../middlewares/super_admin_session')

router.get('/new', admin, (req, res) => {
    res.render('academic_units/new', {messages: {type:0, message:""} })
})

router.post('/new', admin, async (req, res) => {
    let { name } = req.body

    if (await AcademicUnit.findOne({name})) {
        res.render('academic_units/new', {messages: {type:1, message:"Ya existe una unidad academica con ese nombre."} })
        return
    }

    let newAU = new AcademicUnit({name})
    await newAU.save()

    res.render('academic_units/new', {messages: {type:2, message:"Se creo la unidad academica exitosamente."} })
})


router.get('/list', admin, async (req, res) => {
    let academic_units = await AcademicUnit.find({}),
        { user } = req.session

    res.render('academic_units/list',{user, academic_units})
})

router.get('/edit/:name', admin, async (req, res) => {
    let { name } = req.params,
        academic_unit = await AcademicUnit.findOne({name})
    
    res.render('academic_units/edit', {academic_unit, messages:{type:0, message:""}})
})

router.post('/edit/:name', admin, async (req, res) => {
    let { id } = req.body,
        { name } = req.body
        
    if (await AcademicUnit.findOne({name})) {
        res.render('academic_units/edit', {academic_unit: {name, _id: id }, messages:{type:1, message: "Ya existe una unidad académica con ese nombre."}})
        return
    }

    await AcademicUnit.findByIdAndUpdate(id, {name})

    res.redirect('/au/list')
})

router.get('/delete/:name', super_admin, async (req, res) => {
    let { name } = req.params

    const academic_unit = await AcademicUnit.findOne({name})
    const divisions = await Division.find({academic_unit})
    const delegations = await Delegation.find({division:divisions})
    await Padron.remove({delegation:delegations})
    await User.remove({delegation:delegations})
    await Delegation.remove({division:divisions})
    await Division.remove({academic_unit})
    await AcademicUnit.findByIdAndDelete(academic_unit._id)
    res.redirect('/au/list')
})

module.exports = router
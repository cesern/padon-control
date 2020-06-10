const   router = require('express').Router(),
        AcademicUnit = require('../models/academic_unit'),
        Division = require('../models/division'),
        Delegation = require('../models/delegation'),
        Padron = require('../models/padron'),
        User = require('../models/user'),
        admin = require('../middlewares/admin_session'),
        super_admin = require('../middlewares/super_admin_session')
        

router.get('/new', admin, async (req, res) => {
    const academic_units = await AcademicUnit.find({})

    res.render('divisions/new', {academic_units, messages: {type:0, message:""} })
})

router.post('/new', admin, async (req, res) => {
    let { name } = req.body,
        { au_name } = req.body

    if (await Division.findOne({name})) {
        res.render('divisions/new', {academic_units: await AcademicUnit.find({}), messages: {type:1, message:"Ya existe una división con ese nombre.", name, au_name} })
        return
    }

    const academic_unit = await AcademicUnit.findOne({name:au_name})

    if(!academic_unit){
        res.redirect('/div/list')
        return
    }

    let newDivision = new Division({name,academic_unit})
    await newDivision.save()

    res.render('divisions/new', {academic_units: await AcademicUnit.find({}), messages: {type:2, message:"Se creo la división exitosamente."} })
})

router.get('/list', admin, async (req, res) => {
    let divisions = await Division.find({}).populate('academic_unit'),
        { user } = req.session

    res.render('divisions/list',{user, divisions})
})

router.get('/edit/:name', admin, async (req, res) => {
    let { name } = req.params,
        division = await Division.findOne({name}).populate('academic_unit'),
        academic_units = await AcademicUnit.find({})
    
    res.render('divisions/edit', {division, academic_units, messages:{type:0 ,message:""}})
})

router.post('/edit/:name', admin, async (req, res) => {
    let { id } = req.body,
        { name } = req.body,
        { au_name } = req.body
        
    if (await Division.findOne({name})) {
        res.render('divisions/edit', {academic_units: await AcademicUnit.find({}), messages:{ type:1, message: "Ya existe una división con ese nombre.", name, _id:id, au_name}})
        return
    }

    const academic_unit = await AcademicUnit.findOne({name:au_name})

    if(!academic_unit){
        res.redirect('/div/list')
        return
    }

    await Division.findByIdAndUpdate(id, {name,academic_unit})

    res.redirect('/div/list')
})

router.get('/delete/:name', super_admin, async (req, res) => {
    let { name } = req.params
    const division = await Division.findOne({name})
    const delegations = await Delegation.find({division})
    await Padron.remove({delegation:delegations})
    await User.remove({delegation:delegations})
    await Delegation.remove({division})
    await Division.findByIdAndRemove(division._id)
    res.redirect('/div/list')
})

module.exports = router

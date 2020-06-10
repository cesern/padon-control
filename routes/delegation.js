const   router = require('express').Router(),
        Delegation = require('../models/delegation'),
        Division = require('../models/division'),
        Padron = require('../models/padron'),
        User = require('../models/user'),
        super_admin = require('../middlewares/super_admin_session'),
        admin = require('../middlewares/admin_session')

router.get('/new', admin, async (req, res) => {
    res.render('delegations/new', {divisions: await Division.find({}), messages: {type:0, message:""} })
})

router.post('/new', admin, async (req, res) => {
    let { name } = req.body,
        { division_name } = req.body

    if (await Delegation.findOne({name})) {
        res.render('delegations/new', {
            divisions: await Division.find({}), 
            messages: {type:1, message:"Ya existe una delegación con ese nombre.", name, division_name}
        })
        return
    }

    const division = await Division.findOne({name:division_name})

    if(!division){
        res.redirect('/d/list')
        return
    }

    let newDelegation = new Delegation({name, division})
    await newDelegation.save()

    res.render('delegations/new', {
        divisions: await Division.find({}), 
        messages: {type:2, message:"Se creo la delegación exitosamente."} 
    })
})

router.get('/list', admin, async (req, res) => {
    let delegations = await Delegation.find({}).populate('division'),
        { user } = req.session

    res.render('delegations/list',{user, delegations})
})

router.get('/edit/:name', admin, async (req, res) => {
    let { name } = req.params,
        delegation = await Delegation.findOne({name}).populate('division'),
        divisions = await Division.find({})
    
    res.render('delegations/edit', {divisions, delegation, messages:{type:0, message:""}})
})

router.post('/edit/:name', admin, async (req, res) => {
    let { id } = req.body,
        { name } = req.body,
        { division_name } = req.body

    const division = await Division.findOne({name:division_name})

    if(!division){
        res.redirect('/d/list')
        return
    }
        
    if (await Delegation.findOne({name, division})) {   
        res.render('delegations/edit', {
            divisions: await Division.find({}), 
            messages:{type:1, message: "Ya existe una delegación con ese nombre.", name, _id:id, division_name}
        })
        return
    }

    await Delegation.findByIdAndUpdate(id, {name, division})

    res.redirect('/d/list')
})

router.get('/delete/:name', super_admin, async (req, res) => {
    let { name } = req.params
    const delegation = await Delegation.findOne({name})
    await Padron.remove({delegation})
    await User.remove({delegation})
    await Delegation.findByIdAndRemove(delegation._id)
    res.redirect('/d/list')
})

module.exports = router

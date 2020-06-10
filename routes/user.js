const   router = require('express').Router(),
        passport = require('passport'),
        Delegation = require('../models/delegation'),
        User = require('../models/user'),
        admin = require('../middlewares/admin_session'),
        session_active = require('../middlewares/session_active'),
        super_admin = require('../middlewares/super_admin_session')

router.get('/login', async (req, res) => {
    let { user } = req.session

    if (!user){
        res.render('users/login')
    }else{
        //res.redirect('/p/list')
        res.redirect('/u/new')
    }
})

router.post('/login', passport.authenticate('local-users-login', {
  successRedirect: '/p/list',
  failureRedirect: '/u/login',
  failureFlash: true
}))

router.get('/logout', session_active, (req, res) => {
    req.logout()
    res.redirect('/u/login')
})

router.get('/new', admin, async (req, res) => {
    let delegations = await Delegation.find({})
    res.render('users/new', { delegations, messages: {type:0, message:""}})
})

router.post('/new', admin, async (req, res) => {
    let { delegation_name } = req.body,
        { username } = req.body,
        { password } = req.body,
        { confirm_password } = req.body,
        { permit } = req.body
     
    if (password !== confirm_password){
        res.render('users/new', { 
            delegations: await Delegation.find({}), 
            messages: {type:1, message:"Las contraseñas no coinciden.", delegation_name, username} 
        })
        return
    } 
        
    if (await User.findOne({username})) {
        res.render('users/new', { 
            delegations: await Delegation.find({}), 
            messages: {type:1, message:"Ya existe un usuario con ese nombre.", delegation_name, username} 
        })
        return
    }

    let delegation = await Delegation.findOne({'name':delegation_name})

    if (!delegation) {
        res.redirect("/u/new")
        return
    }

    let newUser = new User({username, delegation, permit})
    newUser.password = newUser.encryptPassword(password)
    await newUser.save()

    res.render('users/new', { 
        delegations: await Delegation.find({}), 
        messages: {type:2, message:"Se creo el usuario exitosamente."} 
    })
})

router.get('/list', admin, async (req, res) => {
    let {user} = req.session

    if (user.permit < 2){
        res.render('users/list', {users: await User.find({permit:0}).populate('delegation')})
    }else{
        res.render('users/list', {users: await User.find({permit:{$ne:2}}).populate('delegation')})
    }
})

router.get('/edit/:username', admin, async (req, res) =>{
    let {user} = req.session,
        {username} = req.params,
        delegations = await Delegation.find({}),
        user_edit = await User.findOne({username}).populate('delegation')

    res.render('users/edit', {user, delegations, user_edit})
})

router.post('/edit/:username', admin, async (req, res) =>{
    let delegation = await Delegation.findOne({'name':req.body.delegation_name}),
        { username } = req.params,
        { permit } = req.body,
        { password } = req.body

    if (password === ""){
        await User.findOneAndUpdate({username}, {delegation, permit})
    }else{
        await User.findOneAndUpdate({username}, {delegation, permit, password: req.session.user.encryptPassword(password)})
    }
    res.redirect('/u/list')
})

router.get('/delete/:username', super_admin, async (req, res) =>{
    let {username} = req.params
    await User.findOneAndRemove({username})
    res.redirect('/u/list')
})

router.get("/my-profile", session_active, (req, res) => {
    let {user} = req.session,
        url = user.permit > 0 ? 'users/change_password_admin' : 'users/change_password_dadmin'
    res.render(url, {user, messages: {type:0, message:""}})
})

router.post("/my-profile", session_active, async (req, res) => {
    let {user} = req.session,
        {password_old} = req.body,
        {password_new1} = req.body,
        {password_new2} = req.body,
        url = user.permit > 0 ? 'users/change_password_admin' : 'users/change_password_dadmin'

    if (password_new1 !== password_new2){
        res.render(url, {user, messages: {type:1, message: "Las contraseñas no coinciden."}})
        return
    }

    if (!user.comparePassword(password_old, user.password)){
        res.render(url, {user, messages: {type:1, message: "La contraseña actual es incorrecta."}})
        return
    }

    let password = user.encryptPassword(password_new1)
    await User.findByIdAndUpdate(user._id, {password})
    req.session.user.password = password

    res.render(url, {user: req.session.user, messages: {type:2, message: "La contraseña se cambio correctamente."}})
})

module.exports = router
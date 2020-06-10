const   passport = require('passport'),
        LocalStrategy = require('passport-local').Strategy,
        User = require('../models/user')

passport.serializeUser((user, done) => {
    done(null, user.id);
})

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id).populate("delegation")
    done(null, user)
})

passport.use('local-users-login', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true

}, async (req, username, password, done) => {

    const user = await User.findOne({username}).populate("delegation")
    if(!user) {
        return done(null, false, req.flash('loginMessage', 'Usuario no encontrado'))
    }
    if(!user.comparePassword(password)) {
        return done(null, false, req.flash('loginMessage', 'Contraseña incorrecta'))
    }
    return done(null, user)
}))
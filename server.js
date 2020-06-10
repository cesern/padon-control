const   express = require('express'),
        path = require('path'),
        flash = require('connect-flash'),
        session = require('express-session'),
        passport = require('passport')

// initializations
const   app = express()
require('./database')
require('./passport/local-auth')
// settings
app.set('port', process.env.PORT || 3000)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
// middlewares
app.use(express.urlencoded({ extended:false}))
app.use(session({
    secret: 'padron-control',
    resave: false,
    saveUninitialized: true
}))

app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

app.use((req, res, next) => {
    app.locals.loginMessage = req.flash('loginMessage')
    app.locals.user = req.user
    req.session.user = req.user
    next()
})
// staticfiles
app.use('/public', express.static('public') )
// routes
app.use('/u', require('./routes/user'))
app.use('/au', require('./routes/academic_unit'))
app.use('/div', require('./routes/division'))
app.use('/d', require('./routes/delegation'))
app.use('/p', require('./routes/padron'))
// error 404
app.use(function(req, res, next) {
    res.redirect("/u/login")
})

// server
app.listen(app.get('port'), () => {
    console.log(`server on port ${app.get('port')}`)
})

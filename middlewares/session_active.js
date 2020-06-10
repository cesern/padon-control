module.exports = function(req, res, next){
    let { user } = req.session
    if( user ){
        next()
    }else{
        res.redirect("/u/login")
    }
}
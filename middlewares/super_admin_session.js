module.exports = function(req, res, next){
    let { user } = req.session
    if( user ){
        if( user.permit === 2 ){
            next()
        } else {
            res.redirect('/p/list')
        }
    }else{
        res.redirect("/u/login")
    }
}
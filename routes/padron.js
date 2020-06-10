const   router = require('express').Router(),
        AcademicUnit = require('../models/academic_unit'),
        Division = require('../models/division'),
        Delegation = require('../models/delegation'),
        Padron = require('../models/padron'),
        session_active = require('../middlewares/session_active'),
        super_admin = require('../middlewares/super_admin_session'),
        admin = require('../middlewares/admin_session'),
        csv = require('csvtojson'),
        moment = require('moment')

router.get('/list', session_active, async (req, res) => {
    let user = req.session.user
    let url = user.permit > 0 ? 'padron/list_admin' : 'padron/list_dadmin'

    if (user.permit > 0){
        let padron = await Padron.find({})
            .populate({
                path:'delegation',
                populate: [
                    {
                        path:'division',
                        populate: [
                            {
                                path: 'academic_unit'
                            }
                        ]
                    }
                ]
            })

        const academic_units = await AcademicUnit.find({}).sort({name:1})
            //divisions = await Division.find({academic_unit:academic_units[0]}).sort({name:1}),
            //delegations = await Delegation.find({division:divisions[0]}).sort({name:1})

        res.render(url, {
            user, 
            padron,
            academic_units
            //divisions,
            //delegations
        })
    }else{
        let padron = await Padron.find({'delegation':user.delegation})
        res.render(url, {user, padron})
    }
})
        
router.post('/get/division', admin, async (req, res) => {
    let { unit_name } = req.body

    const divisions = await Division.find({academic_unit: await AcademicUnit.findOne({name:unit_name})}).sort({name:1})
        delegations = await Delegation.find({division:divisions[0]}).sort({name:1})

    res.json({ divisions, delegations })
})

router.post('/get/delegation', admin, async (req, res) => {
    let { division_name } = req.body

    const delegations = await Delegation.find({division: await Division.findOne({name:division_name})}).sort({name:1})

    res.json({ delegations })
})

router.post('/advanced_search', admin, async (req, res) => {
    let { unit_name } = req.body,
        { division_name } = req.body,
        { delegation_name } = req.body,
        { employee_number } = req.body,
        { name } = req.body,
        { status } = req.body

    // adding features if the admin sends them
    let search = {}
    
    if(employee_number !== ''){
        search.employee_number = { '$regex' : employee_number, '$options' : 'i' }
    }

    if(name !== ''){
        search.name = { '$regex' : name, '$options' : 'i' }
    }

    if(status !== 'Ambos'){
        search.status = status === 'Activo'
    }
    //----------------------------------------

    if (unit_name !== 'Todos'){

        if(division_name !== 'Todos'){
            
            if( delegation_name !== 'Todos'){

                const delegation = await Delegation.findOne({name:delegation_name})
                // adding delegation to search
                search.delegation = delegation

                const padron = await Padron.find(search).populate({
                    path:'delegation',
                    populate: [
                        {
                            path:'division',
                            populate: [{
                                path: 'academic_unit'
                            }]
                        }
                    ]
                })
                res.render('padron/advanced_search', {
                    user: req.session.user, 
                    padron,
                    academic_units: await AcademicUnit.find({}).sort({name:1})
                })

            }else{
                const division = await Division.findOne({name:division_name}),
                    delegations = await Delegation.find({division})
                    
                // adding delegation to search
                search.delegation = delegations

                const padron = await Padron.find(search).populate({
                    path:'delegation',
                    populate: [
                        {
                            path:'division',
                            populate: [{
                                path: 'academic_unit'
                            }]
                        }
                    ]
                })
                res.render('padron/advanced_search', {
                    user: req.session.user, 
                    padron,
                    academic_units: await AcademicUnit.find({}).sort({name:1})
                })
            }

        }else{
            const academic_unit = await AcademicUnit.findOne({name:unit_name}),
                divisions = await Division.find({academic_unit}),
                delegations = await Delegation.find({division:divisions})
                
            // adding delegation to search
            search.delegation = delegations    
            
            const padron = await Padron.find(search).populate({
                path:'delegation',
                populate: [
                    {
                        path:'division',
                        populate: [{
                            path: 'academic_unit'
                        }]
                    }
                ]
            })
            res.render('padron/advanced_search', {
                user: req.session.user, 
                padron,
                academic_units: await AcademicUnit.find({}).sort({name:1})
            })
        }

    }else{
        res.render('padron/advanced_search', {
            user: req.session.user, 
            padron: await Padron.find(search).populate({
                path:'delegation',
                populate: [
                    {
                        path:'division',
                        populate: [
                            {
                                path: 'academic_unit'
                            }
                        ]
                    }
                ]
            }),
            academic_units: await AcademicUnit.find({}).sort({name:1})
        })
    }

})

router.get('/new', session_active, async (req, res) => {
    let { user } = req.session,
        url = user.permit > 0 ? 'padron/new_admin' : 'padron/new_dadmin'

    if ( user.permit > 0 ){
        res.render(url, {user, delegations: await Delegation.find({}), messages: {type:0, message:""} })
    }else{
        res.render(url, {user, messages: {type:0, message:""} })
    }
})

router.post('/new', session_active, async (req, res) => {
    let { user } = req.session,
        url = user.permit > 0 ? 'padron/new_admin' : 'padron/new_dadmin'

    if (user.permit > 0){

        let { delegation_name } = req.body,
            { name }  = req.body,
            { employee_number } = req.body,
            { status } = req.body

        if (isNaN(employee_number)){
            res.render(url, {user, delegations: await Delegation.find({}), messages: {type:1, message:"El numero de empleado debe contener puros numeros.", name: name.toUpperCase(), employee_number, status, delegation_name}})
            return
        }

        if (await Padron.findOne({employee_number})){
            res.render(url, {user, delegations: await Delegation.find({}), messages: {type:1, message:"Ya existe un empleado con ese numero.", name: name.toUpperCase(), employee_number, status, delegation_name}})
            return
        }

        let delegation = await Delegation.findOne({'name':delegation_name})

        if (!delegation) {
            res.redirect("/p/new")
            return
        }

        let newTeacher = new Padron({name: name.toUpperCase(), delegation, employee_number, status: status === 'Activo'})
        await newTeacher.save()

        res.render(url, {user, delegations: await Delegation.find({}), messages: {type:2, message:"Se registro correctamente."}})
    }else{

        let { name }  = req.body,
            { employee_number } = req.body,
            { status } = req.body

        if (isNaN(employee_number)){
            res.render(url, {user, messages: {type:1, message:"El numero de empleado debe contener puros numeros.", name: name.toUpperCase(), employee_number, status, delegation_name}})
            return
        }

        if (await Padron.findOne({employee_number})){
            res.render(url, {user, messages: {type:1, message:"Ya existe un empleado con ese numero.", name: name.toUpperCase(), employee_number, status, delegation_name}})
            return
        }

        let newTeacher = new Padron({name: name.toUpperCase(), delegation: user.delegation, employee_number, status: status === 'Activo'})
        await newTeacher.save()

        res.render(url, {user, messages: {type:2, message:"Se registro correctamente."}})
    }
})

router.get('/edit/:employee_number', session_active, async (req, res) => {
    let { employee_number } = req.params
    
    if (isNaN(employee_number)){
        res.redirect('/p/list')
        return
    }

    let { user } = req.session,
        url = user.permit > 0 ? 'padron/edit_admin' : 'padron/edit_dadmin'

    if (user.permit > 0){
        let teacher = await Padron.findOne({employee_number}).populate('delegation'),
            delegations = await Delegation.find({})
        res.render(url, {user, teacher, delegations})
    }else{
        let teacher = await Padron.findOne({employee_number})
        res.render(url, {user, teacher})
    }

})

router.post('/edit/:employee_number', session_active, async (req, res) => {
    let { employee_number } = req.params

    if (isNaN(employee_number)){
        res.redirect('/p/list')
        return
    }

    let { user } = req.session

    if (user.permit > 0){

        let { delegation_name } = req.body,
            { status } = req.body,
            { name } = req.body

        let delegation = await Delegation.findOne({'name':delegation_name})

        if (!delegation) {
            res.redirect('/p/list')
            return
        }

        await Padron.findOneAndUpdate({employee_number}, {delegation, name, status: status === 'Activo'})

        res.redirect('/p/list')
    }else{
        
        let { status } = req.body,
            { name } = req.body
        await Padron.findOneAndUpdate({employee_number}, {name, status: status === 'Activo'})

        res.redirect('/p/list')
    }

})

router.get('/delete/:employee_number', super_admin, async (req, res) => {
    let { employee_number } = req.params
    await Padron.findOneAndRemove({employee_number})
    res.redirect('/p/list')
})

// curl -H "Content-Type: application/json" -X POST http://localhost:3000/p/upload
router.post('/upload', async (req, res) => {

    await Padron.remove({})

    const padronArray = await csv().fromFile( __dirname + '/csv/padron.csv')
    let padron = []

    for(let i=0 ; i < padronArray.length ; i++){
        let teacher = padronArray[i]
        let delegation = await Delegation.findOne({'name':teacher.delegation})
        padron.push({ 
            'delegation': delegation._id,
            'name': teacher.name,
            'employee_number': teacher.employee_number,
            'status': teacher.status.trim() === 'ACTIVO'  
        })
        console.log(i)
    }

    await Padron.collection.insert(padron)

    res.json({message: "Se agregaron correctamente"})
})

// curl -H "Content-Type: application/json" -X POST http://localhost:3000/p/reupload
router.post('/reupload', async (req, res) => {

    const padronArray = await csv().fromFile( __dirname + '/csv/padron2.csv')
    let padron = await Padron.find({}).populate('delegation')
    let c = 0

    for(let i=0 ; i < padronArray.length ; i++){
        const padroni = padronArray[i]
        let padron_name = padroni.name
        
        padron_name = padron_name.trim()
        padron_name = padron_name.toUpperCase()
        // acentos
        padron_name = padron_name.replace(/Á/gi,"A")
        padron_name = padron_name.replace(/É/gi,"E")
        padron_name = padron_name.replace(/Í/gi,"I")
        padron_name = padron_name.replace(/Ó/gi,"O")
        padron_name = padron_name.replace(/Ú/gi,"U")
        padron_name = padron_name.replace(/Ñ/gi,"N")

        padron_name = padron_name.replace(/À/gi,"A")
        padron_name = padron_name.replace(/È/gi,"E")
        padron_name = padron_name.replace(/Ì/gi,"I")
        padron_name = padron_name.replace(/Ò/gi,"O")
        padron_name = padron_name.replace(/Ù/gi,"U")
        // otros
        padron_name = padron_name.replace(/Ẅ/gi,"W")
        padron_name = padron_name.replace(/Ë/gi,"E")
        padron_name = padron_name.replace(/Ÿ/gi,"Y")
        padron_name = padron_name.replace(/Ü/gi,"U")
        padron_name = padron_name.replace(/Ï/gi,"I")
        padron_name = padron_name.replace(/Ö/gi,"O")
        padron_name = padron_name.replace(/Ä/gi,"A")
        padron_name = padron_name.replace(/Ḧ/gi,"H")
        padron_name = padron_name.replace(/Ẍ/gi,"X")
        // espacios
        padron_name = padron_name.replace(/  /g," ")
        padron_name = padron_name.replace(/ /g," ")
        //padron_name = padron_name.replace("MA.","MARIA")

        // check if the teacher is in the padron
        const teacher = await Padron.findOne({name:padron_name})
        if(teacher){
            padron = padron.filter(m => m.name !== padron_name)
            // get years and months
            const split_date = padroni.antiqueness.split(".")
            let antiqueness = moment()

            if (split_date.length == 2){ // if the antiqueness have year and month
                antiqueness.subtract(Number(split_date[0]), "years")
                antiqueness.subtract(Number(split_date[1]), "months")
            }else{ // only year
                antiqueness.subtract(Number(split_date[0]), "years")
            }
            // save the changes
            await Padron.findByIdAndUpdate(teacher._id, {antiqueness:antiqueness.toDate()})
            c++
            console.log(i, padronArray.length, c)
        }
    }

    padron.forEach(m => console.log(`${m._id},${m.name},${m.delegation.name}`))

    res.json({message: `Se modificaron correctamente ${c} maestros`})
})
// curl -H "Content-Type: application/json" -X POST http://localhost:3000/p/removing
router.post('/removing', async (req, res) => {

    const padron = await Padron.find({})
    for(let i=0 ; i<padron.length ; i++){
        let teacher = padron[i],
            {name} = teacher
        
        name = name.trim()
        name = name.toUpperCase()
        // acentos
        name = name.replace(/Á/gi,"A")
        name = name.replace(/É/gi,"E")
        name = name.replace(/Í/gi,"I")
        name = name.replace(/Ó/gi,"O")
        name = name.replace(/Ú/gi,"U")
        name = name.replace(/Ñ/gi,"N")

        name = name.replace(/À/gi,"A")
        name = name.replace(/È/gi,"E")
        name = name.replace(/Ì/gi,"I")
        name = name.replace(/Ò/gi,"O")
        name = name.replace(/Ù/gi,"U")
        // otros
        name = name.replace(/Ẅ/gi,"W")
        name = name.replace(/Ë/gi,"E")
        name = name.replace(/Ÿ/gi,"Y")
        name = name.replace(/Ü/gi,"U")
        name = name.replace(/Ï/gi,"I")
        name = name.replace(/Ö/gi,"O")
        name = name.replace(/Ä/gi,"A")
        name = name.replace(/Ḧ/gi,"H")
        name = name.replace(/Ẍ/gi,"X")
        // espacios
        name = name.replace(/  /g," ")
        name = name.replace(/ /g," ")
        name = name.replace("MA.","MARIA")   

        await Padron.findByIdAndUpdate(teacher._id, {name})
        console.log(i, padron.length)
    }
})

module.exports = router
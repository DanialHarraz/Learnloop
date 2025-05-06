const profileModel = require('../models/profileModel');
const auth = require('../auth/auth')

module.exports.getUser = async (req,res,next)=>{
    const id = parseInt(req.body.userId)

    try{
        const grp = await profileModel.getUser(id)
        const task = await profileModel.getTask(id)
        const data = {grp : grp,task : task}
        return res.status(200).json(data)
    }
    catch(err){
        console.error(err)
    }
}

module.exports.filter = async (req,res,next)=>{
    const id = parseInt(req.body.userId)
    try{
        const data = await profileModel.filter(id)
        return res.status(200).json(data)
    }
    catch(err){
        console.error(err)
    }
}

module.exports.updatePassword = async(req,res,next)=>{
    const id = req.body.id
    try{
        const password = await auth.hashPassword(req.body.password)
        const data = await profileModel.updatePassword(password,id)
        return res.status(200).json(data)
    }
    catch(err){
        console.error(err)
    }
}


module.exports.editUser = async(req,res,next)=>{
    const id = req.body.id
    const email = req.body.email
    const username = req.body.username
    const avatar = req.body.avatar
    const bio = req.body.bio
    try{
        const data = await profileModel.editUser(id,email,username,avatar,bio)
        return res.status(200).json(data)
    }
    catch(err){
        console.error(err)
    }
}


module.exports.deleteUser  = async(req,res,next)=>{
    const id = req.body.id
    try{
        const data = await profileModel.deleteUser(id)
        return res.status(200).json(data)
    }
    catch(err){
        console.error(err)
    }
}


module.exports.displayActivity = async(req,res,next)=>{
    const id = req.body.userId
    try{
        const data = await profileModel.displayActivity(id)
        console.log(data)
        return res.status(200).json(data)
    }
    catch(err){
        console.error(err)
    }
}

module.exports.addActivityData = async(req,res,next)=>{
    const id = req.body.id
    const date = new Date(new Date().getTime()+(8*60*60*1000))
    console.log(id,date)
   
    try{
        const data = await profileModel.addActivityData(id,date)
        return res.status(200).json(data)
    }
    catch(err){
        console.error(err)
    }
}

module.exports.updateStatusOnline = async(req,res,next)=>{
    const id = req.body.id
    try{
        const data = await profileModel.updateStatusOnline(id)
        return res.status(200).json(data)
    }
    catch(err){
        console.error(err)
    }
}

module.exports.updateStatusOffline = async(req,res,next)=>{
    const id = req.body.id
    console.log("hello")
    try{
        const data = await profileModel.updateStatusOffline(id)
        return res.status(200).json(data)
    }
    catch(err){
        console.error(err)
    }
}

const { hashPassword,generateToken,checkToken,comparePassword } = require('../auth/auth');
const userModel = require('../models/userModel');



module.exports.checkUser = async (req,res,next)=>{
    const username = req.body.username
    const password = req.body.password
    try{
        const data = await userModel.checkUser(username)
        if(data.length === 0){
            return res.status(404).json({message : "user not found try register account"})
        }
        else{
           return next()
        }
    }
    catch(err){
       console.error(err)
    }
  
}

module.exports.verifyUser = async (req,res,next)=>{
    const username = req.body.username
    const password = req.body.password
    try{
        // const data = await userModel.verifyUser(username,password)
        // if(data === undefined){
        //     return res.status(400).json({message : "username or password wrong"})
        // }
        // else{
        //     return res.status(200).json(data);
        // }
        const data = (await userModel.checkUser(username))[0]
        const check = await comparePassword(password,data.password)
        if(!check){
         return res.status(400).json({message : "password is incorrect"})
        }
        else{
            const token = generateToken({id:data.id,username:data.username})
            return res.status(200).json({data,token})
        }
    }
    catch(err){
       console.error(err)
    }
}


module.exports.checkDuplicate = async (req,res,next)=>{
    const username = req.body.username
    try{
        const data = await userModel.checkUser(username)
        if(data.length === 0){
            return next()
        }
        else{
            return res.status(400).json({message : "username taken chose another"})
        }
    }
    catch(err){
       console.error(err)
    }
  
}

module.exports.registerUser = async (req,res)=>{
    const email = req.body.email
    const username = req.body.username
    // const password = req.body.password
    const avatar = req.body.avatar
    const bio = req.body.bio
    const password = await hashPassword(req.body.password)

    try{
        const data = await userModel.registerUser(email,username,password,avatar,bio)
        const token = generateToken({id:data.id,username:data.username})
        return res.status(201).json({data : data, token : token})
    }
    catch(err){
       console.error(err)
    }
}


module.exports.checkDuplicateEmail = async (req,res,next)=>{
    const email = req.body.email
  
    try{
        const data = await userModel.checkDuplicateEmail(email)
        if(data.length === 0){
            return next()
        }
        else{
            return res.status(400).json({message : "email taken already, one account per user"})
        }
    }
    catch(err){
       console.error(err)
    }
}

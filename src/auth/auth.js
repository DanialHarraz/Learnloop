const webtoken = require("jsonwebtoken")
const bcrypt  = require("bcryptjs")


module.exports.checkToken = (req,res,next)=>{
    const header = req.headers['authorization']
    if(!header){
        return res.status(400).json({message : "no authorisation"})
    }
    else{
        const token = header.split(' ')[1]
        if(!token){
        return res.status(400).json({message : "no user token"})
        }
        
    webtoken.verify(token,process.env.JWT_KEY,(err,user)=>{
        if(err){
            return res.status(400).json({message : "invalid token or expire "})
        }
        else{
            next()
        }
    })
}
}

module.exports.generateToken = (req,res,next)=>{
 return webtoken.sign(
    {id:req.userId,username:req.name},
    process.env.JWT_KEY,
    {expiresIn : process.env.JWT_EXPIRATION || '1h'}
 )
}

module.exports.hashPassword = async (password)=>{
    const saltRounds = 10;
    return await bcrypt.hash(password,saltRounds)
}


module.exports.comparePassword = async(password,hashPassword)=>{
    return await bcrypt.compare(password,hashPassword)
}


module.exports.checkTokenExpiry = (req,res,next)=>{
    const token = JSON.parse(req.body.token)
    webtoken.verify(token,process.env.JWT_KEY,(err,user)=>{
        if(err){
            return res.status(400).json({message : "invalid token or expire "})
        }
        else{
           return res.status(200).json({})
        }
    })

}
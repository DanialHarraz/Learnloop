const profileModel = require('../models/quizModel')

module.exports.loadQuiz = async (req,res,next)=>{


    try{
        const data = await profileModel.loadQuiz()

        return res.status(200).json(data)
    }
    catch(err){
        console.error(err)
    }
}

module.exports.searchQuiz = async(req,res,next)=>{
    const quizId = parseInt(req.body.quizId)

    try{
        const data = await profileModel.searchQuiz(quizId)

        return res.status(200).json(data)
    }
    catch(err){
        console.error(err)
    }
    
}

module.exports.playQuiz = async(req,res,next)=>{
    const quizId = parseInt(req.body.quizId)

    try{
        const data = await profileModel.playQuiz(quizId)

        return res.status(200).json(data)
    }
    catch(err){
        console.error(err)
    }
    
}

module.exports.popular = async(req,res,next)=>{
    const quizId = parseInt(req.body.quizId)
    const date = new Date(new Date().getTime()+(8*60*60*1000))
    

    try{
        const data = await profileModel.popular(quizId,date)

        next()
    }
    catch(err){
        console.error(err)
    }
    
}


module.exports.popularQuiz= async(req,res,next)=>{
    const quizId = parseInt(req.body.quizId)

    try{
        const data = await profileModel.popularQuiz()

        return res.status(200).json(data)
    }
    catch(err){
        console.error(err)
    }
    
}


module.exports.quiz = async(req,res,next)=>{
    const quizId = parseInt(req.body.quizId)

    try{
        const data = await profileModel.quiz(quizId)

        return res.status(200).json(data)
    }
    catch(err){
        console.error(err)
    }
    
}

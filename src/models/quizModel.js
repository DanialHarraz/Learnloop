const { log } = require('console')
const prisma = require('./prismaClient')

module.exports.loadQuiz = function loadQuiz(){
    return prisma.quiz.findMany(
        {
            include : {
                user : {
                    select : {
                        name  : true
                    }
                }
            }
        }
    ).then((data)=>{
        return data
    })
}

module.exports.searchQuiz = function searchQuiz(quizId){
    return prisma.quiz.findMany({
        where:{
            id : quizId
        },
        include :{
            user : {
                select : {
                    name : true
                }
            }
        }
    }).then((data)=>{
        return data
    })
}

module.exports.playQuiz = function playQuiz(quizId){
    return prisma.quizQuestion.findMany({
        where : {
            quizId : quizId
        }
    }).then((data)=>{
        return data
    })
}


module.exports.popular = function popular(quizId,date){
    return prisma.quizPopular.create({
       data : {
        quizId : quizId,
        dateTime : date
       }
    }).then((data)=>{
        return data
    })
}


module.exports.popularQuiz = function popularQuiz(){
    return prisma.quiz.findMany({
       include : {
               user : {
                select : {
                    name : true
                }
               }
       },
       where : {
        popular : "popular"
       }
    }).then((data)=>{
        return data
    })
}

module.exports.quiz = function quiz(quizId){
    return prisma.$executeRawUnsafe(`SELECT quizPopular(${quizId})`)
}


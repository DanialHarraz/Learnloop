const express = require('express')
const quizController = require('../controllers/quizController')

const router = express.Router()

router.get('/',quizController.loadQuiz)
router.post('/search',quizController.searchQuiz)
router.post('/play',quizController.playQuiz)
router.post('/count/popular',quizController.popular,quizController.quiz)
router.get('/popular',quizController.popularQuiz)

module.exports = router
const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/login',userController.checkUser,userController.verifyUser)
router.post('/register',userController.checkDuplicate,userController.checkDuplicateEmail,userController.registerUser)

module.exports = router;

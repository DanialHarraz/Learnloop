const express = require('express');
const authController = require('../auth/auth');



const router = express.Router();

router.post('/',authController.checkTokenExpiry)



module.exports = router;

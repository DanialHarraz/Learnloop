const express = require('express');
const profileController = require('../controllers/profileController');
const userController = require("../controllers/userController")


const router = express.Router();

router.post('/',profileController.getUser)
router.post('/filter/group',profileController.filter)
router.put('/password',profileController.updatePassword)
router.put('/edit',userController.checkDuplicate,userController.checkDuplicateEmail,profileController.editUser)
router.delete('/delete',profileController.deleteUser)
router.post('/activity',profileController.displayActivity)
router.post('/activity/add',profileController.addActivityData)
router.post('/update/online',profileController.updateStatusOnline)
router.post('/update/offline',profileController.updateStatusOffline)

module.exports = router;

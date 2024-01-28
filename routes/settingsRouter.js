const {Router} = require('express');
const {addSetting, updateSettings, getSettings} = require('../controllers/settingsControllers');
const { protect } = require('../controllers/authControllers');
const router = Router();

router.route('/')
    .get(protect, getSettings)
    .post(protect, addSetting)
    .patch(protect, updateSettings)


module.exports = router;
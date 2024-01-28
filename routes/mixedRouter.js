const {Router} = require('express');
const {createMixedEntry} = require('../controllers/mixedControllers');
const {protect, restrictTo} = require('../controllers/authControllers');
const router = Router();

router.route('/')
    .post(protect, createMixedEntry)

module.exports = router;
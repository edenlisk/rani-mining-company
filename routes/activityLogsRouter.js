const { Router } = require('express');
const { getAllLogs, getUserLogs } = require('../controllers/activityLogsControllers');
const { protect, restrictTo } = require('../controllers/authControllers');

const router = Router();

router.route('/')
    .get(protect, getAllLogs)

router.route('/:userId')
    .get(protect, getUserLogs)

module.exports = router;

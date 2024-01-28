const express = require('express');
const { createChat, findChat, userChats } = require('../controllers/chatControllers');
const { protect, restrictTo } = require('../controllers/authControllers');
const router = express.Router();

router.route('/')
    .post(protect, createChat)

router.route('/:userId')
    .get(protect, userChats)

router.route('/find/:firstId/:secondId')
    .get(protect, findChat)

module.exports = router;
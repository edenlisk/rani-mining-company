const express = require('express');
const { addMessage, getMessages, getLastMessage } = require('../controllers/messageControllers');
const { protect, restrictTo } = require('../controllers/authControllers');
const router = express.Router();



router.route('/')
    .post(protect, addMessage)

router.route('/:chatId')
    .get(protect, getMessages)

router.route('/last/:chatId')
    .get(protect, getLastMessage)

module.exports = router;
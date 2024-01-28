const express = require('express');
const router = express.Router();
const { addPayment, getAllPayments, getOnePayment, updatePayment } = require('../controllers/paymentControllers');
const { protect, restrictTo } = require('../controllers/authControllers');

router.route('/')
    .get(protect, getAllPayments)
    .post(protect, addPayment)

router.route('/:paymentId')
    .get(protect, getOnePayment)

router.route('/update/:model/:paymentId')
    .patch(protect, updatePayment)

module.exports = router;
const express = require('express');
const router = express.Router();
const { addPayment,
    getAllPayments,
    getOnePayment,
    updatePayment, uploadPaymentSupportingDoc } = require('../controllers/paymentControllers');
const { protect, restrictTo } = require('../controllers/authControllers');

router.route('/')
    .get(getAllPayments)
    .post(uploadPaymentSupportingDoc.single("supportingDoc"), addPayment)

router.route('/:paymentId')
    .get(getOnePayment)

router.route('/update/:model/:paymentId')
    .patch(uploadPaymentSupportingDoc.single('supportingDoc'), updatePayment)

module.exports = router;
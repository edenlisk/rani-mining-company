const {Router} = require('express');
const {
    addAdvancePayment,
    getAllAdvancePayments,
    getOneAdvancePayment,
    uploadContract,
    updateAdvancePayment,
} = require('../controllers/advancePaymentControllers');
const {protect, restrictTo} = require('../controllers/authControllers');
const router = Router();

router.route('/')
    .get(protect, getAllAdvancePayments)
    .post(protect, uploadContract.single("data"), addAdvancePayment)

router.route('/:paymentId')
    .get(protect, getOneAdvancePayment)
    .patch(protect, uploadContract.single('data'), updateAdvancePayment)


module.exports = router;
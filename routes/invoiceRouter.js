const express = require('express');
const {
    getAllInvoices,
    generateInvoice,
    getSuppliersInvoice,
    getInvoice,
    updateInvoice
} = require('../controllers/invoiceControllers');
const { protect, restrictTo } = require('../controllers/authControllers');
const router = express.Router();

router.route('/')
    .get(protect, getAllInvoices)
    .post(protect, generateInvoice)

router.route('/supplier/:supplierId')
    .get(protect, getSuppliersInvoice)

router.route('/:invoiceId')
    .get(protect, getInvoice)
    .patch(protect, updateInvoice)


module.exports = router;
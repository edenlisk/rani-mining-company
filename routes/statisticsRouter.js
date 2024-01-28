const {Router} = require('express');
const {
    detailedStock,
    paymentHistory,
    stockSummary,
    lastCreatedEntries,
    currentStock,
    topSuppliers,
    getOneEntry,
    unsettledLots, generateReconciliationExcelTable
} = require('../controllers/statisticsControllers');
const { protect, restrictTo } = require('../controllers/authControllers');
const router = Router();

router.route('/details/:model')
    .get(protect, detailedStock)

router.route('/payment-history/:model/:entryId/:lotNumber')
    .get(protect, paymentHistory)

router.route('/stock-summary')
    .get(protect, stockSummary)

router.route('/current-stock/:year?')
    .get(protect, currentStock)

router.route('/last-created')
    .get(protect, lastCreatedEntries)

router.route('/top-suppliers')
    .get(protect, topSuppliers)

router.route('/unpaid-lots/:supplierId')
    .get(protect, unsettledLots)

router.route('/reconciliations/:model')
    .post(generateReconciliationExcelTable)

router.route('/entry-info/:model/:entryId')
    .get(protect, getOneEntry)

module.exports = router;
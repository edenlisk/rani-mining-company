const express = require('express');
const router = express.Router();
const { generate } = require('../utils/docTemplater');
const {
    getAllSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getOneSupplier,
    getDueDiligence,
    supplierProductionHistory } = require('../controllers/supplierControllers');
const { protect, restrictTo } = require('../controllers/authControllers');

router.route('/')
    .get(protect, getAllSuppliers)
    .post(protect, addSupplier)

router.route("/generate/:supplierId")
    .post(protect, generate)

router.route('/due-diligence')
    .get(getDueDiligence)

router.route('/:supplierId')
    .get(protect, getOneSupplier)
    .patch(protect, updateSupplier)
    .delete(protect, deleteSupplier)

router.route('/history/:supplierId')
    .post(supplierProductionHistory)

module.exports = router;
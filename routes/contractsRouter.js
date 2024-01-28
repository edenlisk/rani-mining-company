const express = require('express');
const {
    createContract,
    getAllContracts,
    uploadContract,
    updateContract,
    deleteContract,
    downloadContract,
    getBuyerContracts } = require('../controllers/contractControllers');
const { protect, restrictTo } = require('../controllers/authControllers');
const router = express.Router();

router.route('/')
    .get(protect, getAllContracts)
    .post(uploadContract.single('contract'), createContract)


router.route('/:buyerId')
    .get(protect, getBuyerContracts)

router.route('/:contractId')
    .post(protect, downloadContract)
    .patch(protect, uploadContract.single('contract'), updateContract)
    .delete(protect, deleteContract)


module.exports = router;
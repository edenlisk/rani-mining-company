const express = require('express');
const { getAllBuyers, createBuyer, getOneBuyer, deleteBuyer, updateBuyer } = require('../controllers/buyerControllers');
const { protect, restrictTo } = require('../controllers/authControllers');
const router = express.Router();



router.route('/')
    .get(protect, getAllBuyers)
    .post(protect, createBuyer)

router.route('/:buyerId')
    .get(protect, getOneBuyer)
    .patch(protect, updateBuyer)
    .delete(protect, deleteBuyer)

module.exports = router;
const { Router } = require('express');
const { updateTag, getAllTags, createTag, getSupplierTags } = require('../controllers/tagsControllers');
const { protect, restrictTo } = require('../controllers/authControllers');

const router = Router();

router.route('/')
    .get(protect, getAllTags)
    .post(protect, createTag)

router.route('/:tagNumber')
    .patch(protect, updateTag)

router.route('/supplier/:supplierId')
    .get(protect, getSupplierTags)

module.exports = router;
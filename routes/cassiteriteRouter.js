const express = require('express');
const {
    getAllCassiteriteEntries,
    createCassiteriteEntry,
    getOneCassiteriteEntry,
    deleteCassiteriteEntry,
    updateCassiteriteEntry,
    uploadGradeImg,
    trashEntries
} = require('../controllers/cassiteriteControllers');
const { protect, restrictTo } = require('../controllers/authControllers');

const router = express.Router();

router.route('/')
    .get(protect, getAllCassiteriteEntries)
    .post(protect, createCassiteriteEntry)

router.route('/trash')
    .get(trashEntries)

router.route('/:entryId')
    .get(protect, getOneCassiteriteEntry)
    .patch(protect, uploadGradeImg.any(), updateCassiteriteEntry)
    .delete(protect, deleteCassiteriteEntry)


module.exports = router;
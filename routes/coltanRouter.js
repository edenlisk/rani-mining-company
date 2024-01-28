const express = require('express');
const {
    getAllColtanEntries,
    getOneColtanEntry,
    createColtanEntry,
    updateColtanEntry,
    deleteColtanEntry,
    deleteGradeImg,
    uploadGradeImg,
    trashEntries,
    generateLabReport,
} = require('../controllers/coltanControllers');
const { protect, restrictTo } = require('../controllers/authControllers');

const router = express.Router();

router.route('/')
    .get(protect, getAllColtanEntries)
    .post(protect, createColtanEntry)

router.route('/trash')
    .get(trashEntries)

router.route('/:entryId')
    .get(getOneColtanEntry)
    .patch(protect, uploadGradeImg.any(), updateColtanEntry)
    .delete(protect, deleteColtanEntry)

router.route('/delete-grade-img/:model/:entryId')
    .delete(protect, deleteGradeImg)

router.route('/lab-report/:model')
    .post(protect, generateLabReport)


module.exports = router;
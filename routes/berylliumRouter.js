const express = require('express');
const {
    getAllBerylliumEntries,
    getOneBerylliumEntry,
    createBerylliumEntry,
    deleteBerylliumEntry,
    updateBerylliumEntry,
    trashEntries
} = require('../controllers/berylliumControllers');
const { deleteGradeImg, uploadGradeImg } = require('../controllers/coltanControllers');
const { protect, restrictTo } = require('../controllers/authControllers');
const router = express.Router();

router.route('/')
    .get(protect, getAllBerylliumEntries)
    .post(protect, createBerylliumEntry)

router.route('/trash')
    .get(trashEntries)

router.route('/:entryId')
    .get(protect, getOneBerylliumEntry)
    .patch(protect, uploadGradeImg.any(), updateBerylliumEntry)
    .delete(protect, deleteBerylliumEntry)

router.route('/delete-grade-img/:model/:entryId')
    .delete(deleteGradeImg)



module.exports = router;
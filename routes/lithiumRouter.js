const express = require('express');
const {
    getAllLithiumEntries,
    getOneLithiumEntry,
    createLithiumEntry,
    updateLithiumEntry,
    deleteLithiumEntry,
    trashEntries
} = require('../controllers/lithiumControllers');
const { protect, restrictTo } = require('../controllers/authControllers');

const { deleteGradeImg, uploadGradeImg } = require('../controllers/coltanControllers');
const router = express.Router();

router.route('/')
    .get(protect, getAllLithiumEntries)
    .post(protect, createLithiumEntry)

router.route('/')
    .get(trashEntries)

router.route('/:entryId')
    .get(protect, getOneLithiumEntry)
    .patch(protect, uploadGradeImg.any(), updateLithiumEntry)
    .delete(protect, deleteLithiumEntry)

router.route('/delete-grade-img/:model/:entryId')
    .delete(deleteGradeImg)


module.exports = router;
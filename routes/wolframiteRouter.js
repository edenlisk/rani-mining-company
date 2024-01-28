const express = require('express');
const {
    getAllWolframiteEntries,
    getOneWolframiteEntry,
    createWolframiteEntry,
    deleteWolframiteEntry,
    updateWolframiteEntry,
    uploadGradeImg,
    trashEntries
} = require('../controllers/wolframiteControllers');
const { protect, restrictTo } = require('../controllers/authControllers');

const router = express.Router();

router.route('/')
    .get(protect, getAllWolframiteEntries)
    .post(protect, createWolframiteEntry)

router.route('/trash')
    .get(trashEntries)

router.route('/:entryId')
    .get(protect, getOneWolframiteEntry)
    .patch(protect, uploadGradeImg.any(), updateWolframiteEntry)
    .delete(protect, deleteWolframiteEntry)


module.exports = router;
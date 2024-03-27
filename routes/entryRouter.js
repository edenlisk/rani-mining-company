const { Router } = require('express');

const { getAllEntries,
    getOneEntry,
    createEntry,
    updateEntry,
    deleteEntry, deleteGradeImg } = require('../controllers/entryControllers');
const { uploadGradeImg } = require('../utils/helperFunctions');
const { protect, restrictTo } = require('../controllers/authControllers');
const router = Router();

router.route('/:model')
    .get(getAllEntries)
    .post(createEntry)

router.route('/:model/:entryId')
    .get(getOneEntry)
    .patch(protect, uploadGradeImg.any(), updateEntry)
    .delete(protect, deleteEntry)

router.route('/delete-grade-image/:model/:entryId')
    .delete(protect, deleteGradeImg)

router.route('/trash')
    .get(protect, getAllEntries)


module.exports = router;
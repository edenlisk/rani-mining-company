const express = require('express');
const router = express.Router();
const { createEntry,
    deleteEntry,
    getOneEntry,
    updateEntry,
    getAllEntries } = require('../controllers/entryControllers');

router.route('/')
    .get(getAllEntries)

router.route('/:model')
    .post(createEntry)

router.route('/:model/:entryId')
    .get(getOneEntry)
    .patch(updateEntry)
    .delete(deleteEntry)


module.exports = router;
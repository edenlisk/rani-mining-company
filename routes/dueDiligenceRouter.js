const express = require('express');
const router = express.Router();
const { getAllDueDiligenceDocuments,
    uploadDueDiligence,
    addDueDiligenceDocument,
    deleteDiligence,
    downloadDueDiligenceDocument,
    updateDiligence } = require('../controllers/dueDiligenceControllers');
// const { protect, restrictTo } = require('../controllers/authControllers');

router.route('/')
    .get(getAllDueDiligenceDocuments)
    .post(uploadDueDiligence, addDueDiligenceDocument)

router.route('/:documentId')
    .post(downloadDueDiligenceDocument)
    .patch(uploadDueDiligence, updateDiligence)
    .delete(deleteDiligence)

module.exports = router;
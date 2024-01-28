const { Router } = require('express');
const router = Router();
const { getFileStructure, downloadFile, saveFile, getExistingFileForEdit, convertToSFDT, uploadEditedFile } = require('../controllers/fileStructureControllers');
const { protect } = require('../controllers/authControllers');


router.route('/')
    .post(protect, getFileStructure)

router.route('/file')
    .patch(protect, uploadEditedFile.single("data"), saveFile);

router.route('/download')
    .post(protect, downloadFile)

router.route('/convert')
    .post(protect, convertToSFDT)

module.exports = router;

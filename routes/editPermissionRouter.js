const { Router } = require('express');
const { getAllEditRequests, getOneEditRequest, createEditRequest, updateEditRequest } = require('../controllers/editPermissionControllers');
const { protect, restrictTo } = require('../controllers/authControllers');
const router = Router();

router.route('/')
    .get(protect, getAllEditRequests)
    .post(protect, createEditRequest)

router.route('/:requestId')
    .get(protect, getOneEditRequest)
    .patch(protect, updateEditRequest)


module.exports = router;
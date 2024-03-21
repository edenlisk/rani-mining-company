const { Router } = require('express');

const {
    getBeneficiaries,
    getOneBeneficiary,
    addBeneficiary,
    updateBeneficiary,
    deleteBeneficiary
} = require('../controllers/beneficiaryControllers');
const router = Router();

router.route('/')
    .get(getBeneficiaries)
    .post(addBeneficiary)


router.route('/:beneficiaryId')
    .get(getOneBeneficiary)
    .patch(updateBeneficiary)
    .delete(deleteBeneficiary)


module.exports = router;
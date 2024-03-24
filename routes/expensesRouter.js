const { Router } = require('express');
const { getExpenses,
    getOneExpense,
    addExpense,
    deleteExpense,
    updateExpense,
    uploadSupportingDocument
} = require('../controllers/expensesControllers');

const router = Router();

router.route('/')
    .get(getExpenses)
    .post(uploadSupportingDocument.single("supportingDocument"), addExpense)

router.route('/:expenseId')
    .get(getOneExpense)
    .patch(uploadSupportingDocument.single("supportingDocument"), updateExpense)
    .delete(deleteExpense)


module.exports = router;
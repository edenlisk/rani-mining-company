const { Router } = require('express');
const { getExpenses,
    getOneExpense,
    addExpense,
    deleteExpense,
    updateExpense } = require('../controllers/expensesControllers');

const router = Router();

router.route('/')
    .get(getExpenses)
    .post(addExpense)

router.route('/:expenseId')
    .get(getOneExpense)
    .patch(updateExpense)
    .delete(deleteExpense)


module.exports = router;
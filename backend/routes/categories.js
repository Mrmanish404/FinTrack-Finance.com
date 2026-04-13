const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/categories - Get user's unique categories
router.get('/', async (req, res) => {
  try {
    const categories = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: { category: '$category', type: '$type' } } },
      { $project: { category: '$_id.category', type: '$_id.type', _id: 0 } },
      { $sort: { category: 1 } }
    ]);

    // Merge with defaults
    const defaults = {
      expense: ['Food & Dining', 'Housing & Rent', 'Transportation', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Utilities', 'Travel', 'Other'],
      income: ['Salary', 'Freelance', 'Business', 'Investments', 'Rental', 'Gift', 'Other']
    };

    const userExpense = categories.filter(c => c.type === 'expense').map(c => c.category);
    const userIncome = categories.filter(c => c.type === 'income').map(c => c.category);

    res.json({
      expense: [...new Set([...defaults.expense, ...userExpense])],
      income: [...new Set([...defaults.income, ...userIncome])]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/summary/monthly?year=2024&month=1
router.get('/monthly', async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const [summary, byCategory, daily] = await Promise.all([
      // Total income vs expense
      Transaction.aggregate([
        { $match: { user: req.user._id, date: { $gte: start, $lte: end } } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),

      // Breakdown by category
      Transaction.aggregate([
        { $match: { user: req.user._id, date: { $gte: start, $lte: end } } },
        { $group: { _id: { category: '$category', type: '$type' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),

      // Daily totals for line chart
      Transaction.aggregate([
        { $match: { user: req.user._id, date: { $gte: start, $lte: end } } },
        { $group: {
          _id: { day: { $dayOfMonth: '$date' }, type: '$type' },
          total: { $sum: '$amount' }
        }},
        { $sort: { '_id.day': 1 } }
      ])
    ]);

    const income = summary.find(s => s._id === 'income')?.total || 0;
    const expense = summary.find(s => s._id === 'expense')?.total || 0;

    res.json({
      income,
      expense,
      balance: income - expense,
      transactionCount: summary.reduce((acc, s) => acc + s.count, 0),
      byCategory: byCategory.map(b => ({
        category: b._id.category,
        type: b._id.type,
        total: b.total,
        count: b.count
      })),
      daily
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/summary/yearly?year=2024
router.get('/yearly', async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const monthly = await Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: start, $lte: end } } },
      { $group: {
        _id: { month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' }
      }},
      { $sort: { '_id.month': 1 } }
    ]);

    res.json({ monthly, year: parseInt(year) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

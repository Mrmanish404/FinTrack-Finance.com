import React, { useState, useEffect } from 'react';
import { MdClose, MdTrendingUp, MdTrendingDown } from 'react-icons/md';
import { transactionsAPI, categoriesAPI } from '../utils/api';
import toast from 'react-hot-toast';

const defaultForm = {
  type: 'expense',
  amount: '',
  category: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  tags: ''
};

export default function TransactionModal({ isOpen, onClose, onSaved, transaction }) {
  const [form, setForm] = useState(defaultForm);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      categoriesAPI.getAll().then(r => setCategories(r.data)).catch(() => {});
      if (transaction) {
        setForm({
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description || '',
          date: transaction.date?.split('T')[0] || defaultForm.date,
          tags: transaction.tags?.join(', ') || ''
        });
      } else {
        setForm(defaultForm);
      }
    }
  }, [isOpen, transaction]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.amount || !form.category) return toast.error('Amount and category are required');
    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      if (transaction) {
        await transactionsAPI.update(transaction._id, payload);
        toast.success('Transaction updated');
      } else {
        await transactionsAPI.create(payload);
        toast.success('Transaction added');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const cats = categories[form.type] || [];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{transaction ? 'Edit Transaction' : 'New Transaction'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><MdClose size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="type-toggle">
            <button
              className={`type-btn expense ${form.type === 'expense' ? 'active' : ''}`}
              onClick={() => set('type', 'expense')}
            >
              <MdTrendingDown /> Expense
            </button>
            <button
              className={`type-btn income ${form.type === 'income' ? 'active' : ''}`}
              onClick={() => set('type', 'income')}
            >
              <MdTrendingUp /> Income
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              className="form-input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={form.category}
              onChange={e => set('category', e.target.value)}
            >
              <option value="">Select category...</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              className="form-input"
              type="text"
              placeholder="What was this for?"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              className="form-input"
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. work, personal, recurring"
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : transaction ? 'Update' : 'Add Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}

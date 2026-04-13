import React, { useState, useEffect, useCallback } from 'react';
import { transactionsAPI, categoriesAPI } from '../utils/api';
import { format } from 'date-fns';
import { MdAdd, MdEdit, MdDelete, MdFilterList } from 'react-icons/md';
import TransactionModal from '../components/TransactionModal';
import toast from 'react-hot-toast';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [filters, setFilters] = useState({ type: '', category: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 15 };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await transactionsAPI.getAll(params);
      setTransactions(data.transactions || []);
      setPagination(data.pagination || {});
    } catch (e) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    categoriesAPI.getAll().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await transactionsAPI.delete(id);
      toast.success('Deleted');
      fetchAll();
    } catch {
      toast.error('Delete failed');
    }
  };

  const openEdit = (tx) => { setEditTx(tx); setModalOpen(true); };
  const openAdd = () => { setEditTx(null); setModalOpen(true); };
  const onSaved = () => { fetchAll(); };

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));
  const fmt = n => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const allCats = [...new Set([...categories.income, ...categories.expense])];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">// {pagination.total || 0} total records</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <MdAdd size={18} /> Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <MdFilterList size={18} style={{ color: 'var(--text-muted)' }} />
        <select className="filter-select" value={filters.type} onChange={e => setFilter('type', e.target.value)}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select className="filter-select" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
          <option value="">All Categories</option>
          {allCats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="date"
          className="filter-select"
          onChange={e => setFilter('startDate', e.target.value)}
          placeholder="From date"
        />
        <input
          type="date"
          className="filter-select"
          onChange={e => setFilter('endDate', e.target.value)}
          placeholder="To date"
        />
        {(filters.type || filters.category) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ type: '', category: '', page: 1 })}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="transactions-card">
        <div className="card-header">
          <span className="card-title">All Transactions</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            page {pagination.page || 1} of {pagination.pages || 1}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-text">No transactions found</div>
            <div className="empty-sub">Try adjusting your filters</div>
          </div>
        ) : (
          transactions.map(tx => (
            <div key={tx._id} className="transaction-item">
              <div className={`tx-icon ${tx.type}`}>
                {tx.type === 'income' ? '↑' : '↓'}
              </div>
              <div className="tx-info">
                <div className="tx-desc">{tx.description || '—'}</div>
                <div className="tx-cat">
                  <span className="category-pill">{tx.category}</span>
                  {tx.tags?.length > 0 && tx.tags.map(t => (
                    <span key={t} className="category-pill" style={{ marginLeft: 4, background: 'rgba(255,209,102,0.12)', color: 'var(--accent-yellow)' }}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="tx-date">{format(new Date(tx.date), 'dd MMM yyyy')}</div>
              <div className={`tx-amount ${tx.type}`}>
                {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
              </div>
              <div className="tx-actions">
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(tx)} title="Edit">
                  <MdEdit size={15} />
                </button>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(tx._id)} title="Delete">
                  <MdDelete size={15} />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ padding: '16px 24px', display: 'flex', gap: 8, justifyContent: 'center', borderTop: '1px solid var(--border)' }}>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`btn btn-sm ${p === filters.page ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilters(f => ({ ...f, page: p }))}
              >{p}</button>
            ))}
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTx(null); }}
        onSaved={onSaved}
        transaction={editTx}
      />
    </div>
  );
}

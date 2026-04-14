import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { summaryAPI, transactionsAPI } from '../utils/api';
import { format, subMonths, addMonths } from 'date-fns';
import { MdChevronLeft, MdChevronRight, MdAdd } from 'react-icons/md';
import TransactionModal from '../components/TransactionModal';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const CHART_COLORS = {
  income: '#00e5a0',
  expense: '#ff4d6d',
  categories: ['#6366f1','#a78bfa','#ffd166','#00e5a0','#ff4d6d','#06b6d4','#f59e0b','#ec4899','#10b981','#ef4444','#8b5cf6','#14b8a6']
};

const chartDefaults = {
  plugins: { legend: { labels: { color: '#8888bb', font: { family: 'DM Mono', size: 11 } } } },
  scales: {
    x: { ticks: { color: '#555580', font: { family: 'DM Mono', size: 11 } }, grid: { color: '#1e1e3a' } },
    y: { ticks: { color: '#555580', font: { family: 'DM Mono', size: 11 } }, grid: { color: '#1e1e3a' } }
  }
};

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summary, setSummary] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const [s, y, tx] = await Promise.all([
        summaryAPI.monthly(year, month),
        summaryAPI.yearly(year),
        transactionsAPI.getAll({ limit: 7, sort: '-date' })
      ]);
      setSummary(s.data);
      setYearlyData(y.data);
      setRecentTx(tx.data.transactions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const prevMonth = () => setCurrentDate(d => subMonths(d, 1));
  const nextMonth = () => setCurrentDate(d => addMonths(d, 1));

  // Build donut chart for expense categories
  const expenseCats = summary?.byCategory?.filter(c => c.type === 'expense') || [];
  const donutData = {
    labels: expenseCats.map(c => c.category),
    datasets: [{
      data: expenseCats.map(c => c.total),
      backgroundColor: CHART_COLORS.categories,
      borderColor: '#0a0a14',
      borderWidth: 2,
      hoverOffset: 6
    }]
  };

  // Build yearly bar chart
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyIncome = Array(12).fill(0);
  const monthlyExpense = Array(12).fill(0);
  (yearlyData?.monthly || []).forEach(m => {
    const idx = m._id.month - 1;
    if (m._id.type === 'income') monthlyIncome[idx] = m.total;
    else monthlyExpense[idx] = m.total;
  });

  const barData = {
    labels: months,
    datasets: [
      { label: 'Income', data: monthlyIncome, backgroundColor: 'rgba(0,229,160,0.7)', borderRadius: 6 },
      { label: 'Expense', data: monthlyExpense, backgroundColor: 'rgba(255,77,109,0.7)', borderRadius: 6 }
    ]
  };

  // Build daily line chart for current month
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const dailyLabels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const dailyExpense = Array(daysInMonth).fill(0);
  const dailyIncome = Array(daysInMonth).fill(0);
  (summary?.daily || []).forEach(d => {
    const idx = d._id.day - 1;
    if (d._id.type === 'expense') dailyExpense[idx] = d.total;
    else dailyIncome[idx] = d.total;
  });

  const lineData = {
    labels: dailyLabels,
    datasets: [
      {
        label: 'Expenses',
        data: dailyExpense,
        borderColor: CHART_COLORS.expense,
        backgroundColor: 'rgba(255,77,109,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: CHART_COLORS.expense
      },
      {
        label: 'Income',
        data: dailyIncome,
        borderColor: CHART_COLORS.income,
        backgroundColor: 'rgba(0,229,160,0.06)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: CHART_COLORS.income
      }
    ]
  };

  const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{"// your financial overview"}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="month-nav">
            <button className="btn btn-ghost btn-icon btn-sm" onClick={prevMonth}><MdChevronLeft size={18} /></button>
            <span className="month-label">{format(currentDate, 'MMM yyyy')}</span>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={nextMonth}><MdChevronRight size={18} /></button>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <MdAdd size={18} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-label">Total Income</div>
          <div className="stat-value income">{fmt(summary?.income)}</div>
          <div className="stat-count">{summary?.transactionCount || 0} transactions this month</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value expense">{fmt(summary?.expense)}</div>
        </div>
        <div className={`stat-card balance`}>
          <div className="stat-label">Net Balance</div>
          <div className={`stat-value balance ${(summary?.balance || 0) >= 0 ? 'positive' : 'negative'}`}>
            {fmt(summary?.balance)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Savings Rate</div>
          <div className="stat-value" style={{ color: 'var(--accent-yellow)' }}>
            {summary?.income ? `${Math.round((summary.balance / summary.income) * 100)}%` : '—'}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Daily line chart */}
        <div className="chart-card chart-full">
          <div className="chart-title">Daily Flow</div>
          <div className="chart-subtitle">{"// income vs expenses by day · "}{format(currentDate, 'MMMM yyyy')}</div>
          <div style={{ height: 220 }}>
            <Line data={lineData} options={{ ...chartDefaults, maintainAspectRatio: false, plugins: { ...chartDefaults.plugins, legend: { ...chartDefaults.plugins.legend, position: 'top' } } }} />
          </div>
        </div>

        {/* Expense breakdown donut */}
        <div className="chart-card">
          <div className="chart-title">Expense Breakdown</div>
          <div className="chart-subtitle">{"// by category"}</div>
          {expenseCats.length > 0 ? (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut data={donutData} options={{
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: { position: 'bottom', labels: { color: '#8888bb', font: { family: 'DM Mono', size: 11 }, padding: 12, boxWidth: 12 } }
                }
              }} />
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-icon">📊</div>
              <div className="empty-sub">No expense data yet</div>
            </div>
          )}
        </div>

        {/* Yearly bar chart */}
        <div className="chart-card">
          <div className="chart-title">Yearly Overview</div>
          <div className="chart-subtitle">{"// monthly income vs expense · "}{currentDate.getFullYear()}</div>
          <div style={{ height: 260 }}>
            <Bar data={barData} options={{
              ...chartDefaults,
              maintainAspectRatio: false,
              plugins: { ...chartDefaults.plugins, legend: { ...chartDefaults.plugins.legend, position: 'top' } }
            }} />
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="transactions-card">
        <div className="card-header">
          <span className="card-title">Recent Transactions</span>
        </div>
        {recentTx.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <div className="empty-text">No transactions yet</div>
            <div className="empty-sub">Add your first one above</div>
          </div>
        ) : (
          recentTx.map(tx => (
            <div key={tx._id} className="transaction-item">
              <div className={`tx-icon ${tx.type}`}>
                {tx.type === 'income' ? '↑' : '↓'}
              </div>
              <div className="tx-info">
                <div className="tx-desc">{tx.description || tx.category}</div>
                <div className="tx-cat"><span className="category-pill">{tx.category}</span></div>
              </div>
              <div className="tx-date">{format(new Date(tx.date), 'dd MMM')}</div>
              <div className={`tx-amount ${tx.type}`}>
                {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
              </div>
            </div>
          ))
        )}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchData}
      />
    </div>
  );
}

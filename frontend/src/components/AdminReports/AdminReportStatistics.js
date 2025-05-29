import { useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';

export default function AdminReportStatistics({
  activeTab,
  reportData,
  loading,
  error
}) {
  if (activeTab !== 'paymentStats' && activeTab !== 'serviceStats') {
    return null;
  }

  const total = reportData.reduce((sum, r) => sum + (r.TotalAmount || 0), 0);
  const paid = reportData.reduce((sum, r) => sum + (r.PaidAmount || 0), 0);
  const pending = reportData.reduce((sum, r) => sum + (r.PendingAmount || 0), 0);
  const overdue = reportData.reduce((sum, r) => sum + (r.OverdueAmount || 0), 0);
  const other = total - paid - pending;

  const pieData = {
    labels: ['Төлөгдсөн', 'Хүлээгдэж буй', 'Бусад'],
    datasets: [
      {
        data: [paid, pending, other],
        backgroundColor: ['#16a34a', '#eab308', '#64748b'],
        hoverBackgroundColor: ['#22c55e', '#fde047', '#334155']
      }
    ]
  };

  const serviceYearlyStats = {};
  if (activeTab === 'serviceStats') {
    reportData.forEach(row => {
      const year = row.year || row.Year || (row.MonthName && row.MonthName.split('-')[0]) || '';
      if (!year) return;
      if (!serviceYearlyStats[year]) {
        serviceYearlyStats[year] = { months: Array(12).fill(null).map(() => ({ completed: 0, pending: 0, inprogress: 0 })) };
      }
      let monthIdx = null;
      if (row.Month) {
        monthIdx = Number(row.Month) - 1;
      } else if (row.MonthName) {
        const monthNames = [
          'january','february','march','april','may','june',
          'july','august','september','october','november','december'
        ];
        const idx = monthNames.findIndex(m => row.MonthName.toLowerCase().startsWith(m));
        if (idx !== -1) monthIdx = idx;
      }
      if (monthIdx !== null && monthIdx >= 0 && monthIdx < 12) {
        const completed = row.CompletedRequests || 0;
        const pending = row.PendingRequests || 0;
        const inprogress = row.InProgressRequests || 0;
        serviceYearlyStats[year].months[monthIdx].completed += completed;
        serviceYearlyStats[year].months[monthIdx].pending += pending;
        serviceYearlyStats[year].months[monthIdx].inprogress += inprogress;
      }
    });
  }

  const allYears = activeTab === 'paymentStats'
    ? Object.keys(
        reportData.reduce((acc, row) => {
          const year = row.year || row.Year || (row.MonthName && row.MonthName.split('-')[0]) || '';
          if (year) acc[year] = true;
          return acc;
        }, {})
      ).sort()
    : Object.keys(serviceYearlyStats).sort();

  const [selectedYear, setSelectedYear] = useState(allYears.length > 0 ? allYears[allYears.length - 1] : '');

  const selectedYearStats = activeTab === 'paymentStats'
    ? (() => {
        const yearlyStats = {};
        reportData.forEach(row => {
          const year = row.year || row.Year || (row.MonthName && row.MonthName.split('-')[0]) || '';
          if (!year) return;
          if (!yearlyStats[year]) {
            yearlyStats[year] = { months: Array(12).fill(null).map(() => ({ total: 0, paid: 0, pending: 0, other: 0 })) };
          }
          let monthIdx = null;
          if (row.Month) {
            monthIdx = Number(row.Month) - 1;
          } else if (row.MonthName) {
            const monthNames = [
              'january','february','march','april','may','june',
              'july','august','september','october','november','december'
            ];
            const idx = monthNames.findIndex(m => row.MonthName.toLowerCase().startsWith(m));
            if (idx !== -1) monthIdx = idx;
          }
          if (monthIdx !== null && monthIdx >= 0 && monthIdx < 12) {
            const paid = row.PaidAmount || 0;
            const pending = row.PendingAmount || 0;
            const total = row.TotalAmount || 0;
            const other = total - paid - pending;
            yearlyStats[year].months[monthIdx].total += total;
            yearlyStats[year].months[monthIdx].paid += paid;
            yearlyStats[year].months[monthIdx].pending += pending;
            yearlyStats[year].months[monthIdx].other += other;
          }
        });
        return yearlyStats[selectedYear]?.months || Array(12).fill({ total: 0, paid: 0, pending: 0, other: 0 });
      })()
    : [];

  const selectedServiceYearStats = activeTab === 'serviceStats'
    ? serviceYearlyStats[selectedYear]?.months || Array(12).fill({ completed: 0, pending: 0, inprogress: 0 })
    : [];

  const barData = activeTab === 'paymentStats'
    ? {
        labels: [
          '1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар',
          '7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'
        ],
        datasets: [
          {
            label: 'Төлөгдсөн',
            data: selectedYearStats.map(m => m.paid || 0),
            backgroundColor: '#16a34a'
          },
          {
            label: 'Хүлээгдэж буй',
            data: selectedYearStats.map(m => m.pending || 0),
            backgroundColor: '#eab308'
          },
          {
            label: 'Бусад',
            data: selectedYearStats.map(m => m.other || 0),
            backgroundColor: '#64748b'
          }
        ]
      }
    : {
        labels: [
          '1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар',
          '7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'
        ],
        datasets: [
          {
            label: 'Дууссан',
            data: selectedServiceYearStats.map(m => m.completed || 0),
            backgroundColor: '#16a34a'
          },
          {
            label: 'Хүлээгдэж буй',
            data: selectedServiceYearStats.map(m => m.pending || 0),
            backgroundColor: '#eab308'
          },
          {
            label: 'Хийгдэж буй',
            data: selectedServiceYearStats.map(m => m.inprogress || 0),
            backgroundColor: '#3b82f6'
          }
        ]
      };

  let pieDataYear = pieData;
  if (activeTab === 'paymentStats') {
    const filteredYearData = reportData.filter(row => {
      const year = row.year || row.Year || (row.MonthName && row.MonthName.split('-')[0]) || '';
      return year === selectedYear;
    });
    const totalYear = filteredYearData.reduce((sum, r) => sum + (r.TotalAmount || 0), 0);
    const paidYear = filteredYearData.reduce((sum, r) => sum + (r.PaidAmount || 0), 0);
    const pendingYear = filteredYearData.reduce((sum, r) => sum + (r.PendingAmount || 0), 0);
    const overdueYear = filteredYearData.reduce((sum, r) => sum + (r.OverdueAmount || 0), 0);
    const otherYear = totalYear - paidYear - pendingYear;
    pieDataYear = {
      labels: ['Төлөгдсөн', 'Хүлээгдэж буй', 'Бусад'],
      datasets: [
        {
          data: [paidYear, pendingYear, otherYear],
          backgroundColor: ['#16a34a', '#eab308', '#64748b'],
          hoverBackgroundColor: ['#22c55e', '#fde047', '#334155']
        }
      ]
    };
  } else if (activeTab === 'serviceStats') {
    const filteredYearData = reportData.filter(row => {
      const year = row.year || row.Year || (row.MonthName && row.MonthName.split('-')[0]) || '';
      return year === selectedYear;
    });
    const completed = filteredYearData.reduce((sum, r) => sum + (r.CompletedRequests || 0), 0);
    const pending = filteredYearData.reduce((sum, r) => sum + (r.PendingRequests || 0), 0);
    const inprogress = filteredYearData.reduce((sum, r) => sum + (r.InProgressRequests || 0), 0);
    pieDataYear = {
      labels: ['Дууссан', 'Хүлээгдэж буй', 'Хийгдэж буй'],
      datasets: [
        {
          data: [completed, pending, inprogress],
          backgroundColor: ['#16a34a', '#eab308', '#3b82f6'],
          hoverBackgroundColor: ['#22c55e', '#fde047', '#60a5fa']
        }
      ]
    };
  }

  let summaryCards = [];
  if (activeTab === 'paymentStats') {
    const filteredYearData = reportData.filter(row => {
      const year = row.year || row.Year || (row.MonthName && row.MonthName.split('-')[0]) || '';
      return year === selectedYear;
    });
    const totalYear = filteredYearData.reduce((sum, r) => sum + (r.TotalAmount || 0), 0);
    const paidYear = filteredYearData.reduce((sum, r) => sum + (r.PaidAmount || 0), 0);
    const pendingYear = filteredYearData.reduce((sum, r) => sum + (r.PendingAmount || 0), 0);
    const overdueYear = filteredYearData.reduce((sum, r) => sum + (r.OverdueAmount || 0), 0);
    summaryCards = [
      {
        label: 'Нийт төлбөр',
        value: totalYear,
        color: 'text-[#2D6B9F]',
        iconBg: 'bg-blue-100',
        iconColor: 'text-[#2D6B9F]',
        svg: (
          <svg className="h-5 w-5 text-[#2D6B9F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      {
        label: 'Төлөгдсөн',
        value: paidYear,
        color: 'text-green-600',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        svg: (
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      {
        label: overdueYear > 0 ? 'Хугацаа хэтэрсэн' : 'Хүлээгдэж буй',
        value: overdueYear > 0 ? overdueYear : pendingYear,
        color: overdueYear > 0 ? 'text-red-600' : 'text-yellow-600',
        iconBg: overdueYear > 0 ? 'bg-red-100' : 'bg-yellow-100',
        iconColor: overdueYear > 0 ? 'text-red-600' : 'text-yellow-600',
        svg: overdueYear > 0 ? (
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ) : (
          <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    ];
  } else if (activeTab === 'serviceStats') {
    const filteredYearData = reportData.filter(row => {
      const year = row.year || row.Year || (row.MonthName && row.MonthName.split('-')[0]) || '';
      return year === selectedYear;
    });
    const completed = filteredYearData.reduce((sum, r) => sum + (r.CompletedRequests || 0), 0);
    const pending = filteredYearData.reduce((sum, r) => sum + (r.PendingRequests || 0), 0);
    const inprogress = filteredYearData.reduce((sum, r) => sum + (r.InProgressRequests || 0), 0);
    summaryCards = [
      {
        label: 'Дууссан',
        value: completed,
        color: 'text-green-600',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        svg: (
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      {
        label: 'Хүлээгдэж буй',
        value: pending,
        color: 'text-yellow-600',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        svg: (
          <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      {
        label: 'Хийгдэж буй',
        value: inprogress,
        color: 'text-blue-600',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        svg: (
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    ];
  }

  const [view, setView] = useState('chart');
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [tablePage, setTablePage] = useState(1);
  const tableRowsPerPage = 20;

  const tableColumns = [
    { key: 'YearMonth', label: 'Огноо', group: 'period' },
    { key: '__divider1', label: '', divider: true },
    { key: 'TotalPayments', label: 'Гарсан төлбөр', group: 'count' },
    { key: 'PaidPayments', label: 'Төлөгдсөн', group: 'count' },
    { key: 'PendingPayments', label: 'Хүлээгдэж буй', group: 'count' },
    { key: '__divider2', label: '', divider: true },
    { key: 'TotalAmount', label: 'Нийт дүн', group: 'amount' },
    { key: 'PaidAmount', label: 'Төлөгдсөн дүн', group: 'amount' },
    { key: 'PendingAmount', label: 'Хүлээгдэж буй дүн', group: 'amount' },
    { key: 'OverdueAmount', label: 'Хугацаа хэтэрсэн дүн', group: 'amount' },
    { key: 'CollectionRate', label: 'Төлөлтийн хувь', group: 'amount' }
  ];

  const serviceTableColumns = [
    { key: 'YearMonth', label: 'Огноо', group: 'period' },
    { key: '__divider1', label: '', divider: true },
    { key: 'CompletedRequests', label: 'Дууссан', group: 'count' },
    { key: 'PendingRequests', label: 'Хүлээгдэж буй', group: 'count' },
    { key: 'InProgressRequests', label: 'Хийгдэж буй', group: 'count' }
  ];

  const processedTableData = reportData.map(row => {
    const year = row.year || row.Year || '';
    const month = row.Month || '';
    return {
      ...row,
      YearMonth: year && month ? `${year}-${month}` : ''
    };
  });

  const filteredTableData = processedTableData.filter(row => {
    const year = row.Year || row.year || (row.MonthName && row.MonthName.split('-')[0]) || '';
    const month = row.MonthName || '';
    const searchLower = search.trim().toLowerCase();
    return (
      (!searchLower || year.toString().includes(searchLower) || month.toLowerCase().includes(searchLower))
    );
  });

  const sortedTableData = [...filteredTableData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aValue = a[sortConfig.key] ?? '';
    let bValue = b[sortConfig.key] ?? '';
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedTableData = sortedTableData.slice(
    (tablePage - 1) * tableRowsPerPage,
    tablePage * tableRowsPerPage
  );

  const totalTablePages = Math.ceil(sortedTableData.length / tableRowsPerPage);

  const formatAmount = (amount) => {
    if (!amount) return '₮0';
    let str = String(amount);
    str = str.replace(/^0+(\d)/, '$1');
    if (!str || isNaN(Number(str))) str = '0';
    return '₮' + Number(str).toLocaleString();
  };
  
  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  if (!loading && !error && (!reportData || reportData.length === 0)) {
    return (
      <div className="bg-white rounded-lg p-4 text-center text-gray-500">
        Статистикийн мэдээлэл олдсонгүй.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4">
      {loading && <p className="text-center py-4">Ачааллаж байна...</p>}
      {error && (
        <div className="text-red-500 text-center py-4">
          {error}
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold text-[#2D6B9F]">
              {activeTab === 'paymentStats' ? 'Төлбөрийн статистик' : 'Үйлчилгээний статистик'}
            </span>
            <div>
              <button
                className={`px-4 py-2 rounded-l border border-gray-300 text-sm font-medium ${view === 'chart' ? 'bg-[#2D6B9F] text-white' : 'bg-white text-[#2D6B9F]'}`}
                onClick={() => setView('chart')}
              >
                График
              </button>
              <button
                className={`px-4 py-2 rounded-r border-t border-b border-r border-gray-300 text-sm font-medium ${view === 'table' ? 'bg-[#2D6B9F] text-white' : 'bg-white text-[#2D6B9F]'}`}
                onClick={() => setView('table')}
              >
                Хүснэгт
              </button>
            </div>
          </div>
          {view === 'chart' && (
            <>
              <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
                <div className="flex items-center mb-2 sm:mb-0">
                  <label htmlFor="year-select" className="text-sm font-medium text-gray-700 mr-2">Он:</label>
                  <select
                    id="year-select"
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6B9F]"
                  >
                    {allYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {summaryCards.map((card, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="flex items-center p-4">
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-gray-500">{card.label}</p>
                        <p className={`text-xl font-semibold ${card.color}`}>
                          {activeTab === 'paymentStats' ? formatAmount(card.value) : card.value}
                        </p>
                      </div>
                      <div className={`w-10 h-10 ${card.iconBg} rounded-full flex items-center justify-center`}>
                        {card.svg}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col lg:flex-row justify-center items-stretch mb-6 gap-6">
                <div className="flex-1 flex justify-center items-center">
                  <div style={{ width: 700, height: 400 }}>
                    <Bar
                      data={barData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'bottom' },
                          title: { display: false }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: value =>
                                activeTab === 'paymentStats'
                                  ? '₮' + value.toLocaleString()
                                  : value
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1 flex justify-center items-center">
                  <div style={{ width: 320, height: 220 }}>
                    <Pie data={pieDataYear} options={{
                      plugins: { legend: { position: 'bottom' } },
                      maintainAspectRatio: false
                    }} />
                  </div>
                </div>
              </div>
            </>
          )}
          {view === 'table' && (
            <>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Жил эсвэл сар хайх..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6B9F] text-sm"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="align-middle inline-block min-w-full overflow-hidden rounded-lg">
                  <table className="min-w-full bg-white rounded-lg overflow-hidden divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {(activeTab === 'paymentStats' ? tableColumns : serviceTableColumns).map((col, idx) =>
                          col.divider ? (
                            <td
                              key={col.key}
                              className="p-0"
                              style={{ width: "1px", minWidth: "1px", background: "transparent" }}
                            >
                              <div className="h-6 w-px mx-auto bg-gray-300"></div>
                            </td>
                          ) : (
                            <th
                              key={col.key}
                              className={
                                "px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none" +
                                (idx > 0 && (activeTab === 'paymentStats' ? tableColumns : serviceTableColumns)[idx - 1].divider
                                  ? " border-l border-gray-300"
                                  : "")
                              }
                              onClick={() => handleSort(col.key)}
                            >
                              {col.label}{renderSortArrow(col.key)}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedTableData.length > 0 ? (
                          paginatedTableData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-blue-50 transition group">
                              <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-700 text-center">{row.YearMonth}</td>
                              <td className="p-0" style={{ width: "1px", minWidth: "1px", background: "transparent" }}>
                                <div className="h-6 w-px mx-auto bg-gray-300"></div>
                              </td>
                              {activeTab === 'paymentStats' ? (
                                <>
                                  <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-700 text-center">{row.TotalPayments ?? ''}</td>
                                  <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-green-600 text-center">{row.PaidPayments ?? ''}</td>
                                  <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-yellow-600 text-center">{row.PendingPayments ?? ''}</td>
                                  <td className="p-0" style={{ width: "1px", minWidth: "1px", background: "transparent" }}>
                                    <div className="h-6 w-px mx-auto bg-gray-300"></div>
                                  </td>
                                  <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-700 text-center">₮{(row.TotalAmount || 0).toLocaleString()}</td>
                                  <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-green-600 text-center">₮{(row.PaidAmount || 0).toLocaleString()}</td>
                                  <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-yellow-600 text-center">₮{(row.PendingAmount || 0).toLocaleString()}</td>
                                  <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-red-600 text-center">₮{(row.OverdueAmount || 0).toLocaleString()}</td>
                                  <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-blue-700 text-center">{row.CollectionRate || ''}</td>
                                </>
                              ) : (
                                <>
                                  <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-green-600 text-center">{row.CompletedRequests ?? ''}</td>
                                  <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-yellow-600 text-center">{row.PendingRequests ?? ''}</td>
                                  <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-blue-600 text-center">{row.InProgressRequests ?? ''}</td>
                                </>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={(activeTab === 'paymentStats' ? tableColumns.length : serviceTableColumns.length)} className="px-6 py-4 text-center text-gray-500">
                              Мэдээлэл олдсонгүй
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
              </div>
              {totalTablePages > 1 && (
                <div className="flex justify-center mt-4 items-center space-x-2">
                  <button
                    onClick={() => setTablePage((prev) => Math.max(prev - 1, 1))}
                    className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                      tablePage === 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                    } transition font-bold text-sm`}
                    title="Өмнөх"
                    disabled={tablePage === 1}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalTablePages }, (_, index) => index + 1)
                    .filter((page) => {
                      return (
                        page <= 2 ||
                        page > totalTablePages - 2 ||
                        (page >= tablePage - 1 && page <= tablePage + 1)
                      );
                    })
                    .map((page, index, pages) => (
                      <span key={page}>
                        {index > 0 && page !== pages[index - 1] + 1 && (
                          <span className="text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setTablePage(page)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                            tablePage === page
                              ? "bg-[#2D6B9F] text-white"
                              : "border border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                          } transition`}
                        >
                          {page}
                        </button>
                      </span>
                    ))}
                  <button
                    onClick={() => setTablePage((prev) => Math.min(totalTablePages, prev + 1))}
                    className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                      tablePage === totalTablePages
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                    } transition font-bold text-sm`}
                    title="Дараах"
                    disabled={tablePage === totalTablePages}
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

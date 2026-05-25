import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { saveAs } from 'file-saver';
import { getApiUrl } from '../utils/api';
import Header from '../components/Header';
import './UserManagement.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const getObjectIdString = (idValue) => {
  if (!idValue) return '';
  if (typeof idValue === 'object' && idValue._id) {
    return getObjectIdString(idValue._id);
  }
  if (typeof idValue === 'object' && idValue.$oid && typeof idValue.$oid === 'string') {
    return idValue.$oid;
  }
  if (typeof idValue === 'object' && typeof idValue.toString === 'function' && idValue.constructor.name === 'ObjectId') {
    return idValue.toString();
  }
  return String(idValue);
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const token = localStorage.getItem('token');

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    ordersThisYear: 0,
    ordersThisMonth: 0,
    avgOrdersPerUser: 0,
    activeBuyerPercentage: 0,
    topUsers: [],
    userRoleDistribution: {},
    bannedUsers: 0,
    activeUsers: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, orderRes] = await Promise.all([
          fetch(getApiUrl('/api/users'), { headers: { Authorization: `Bearer ${token}` } }),
          fetch(getApiUrl('/api/orders'), { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (!userRes.ok || !orderRes.ok) {
          const userError = userRes.statusText || 'Unknown user fetch error';
          const orderError = orderRes.statusText || 'Unknown order fetch error';
          throw new Error(`Failed to fetch data: Users - ${userError}, Orders - ${orderError}`);
        }

        const [userData, orderData] = await Promise.all([
          userRes.json(),
          orderRes.json()
        ]);

        const usersById = userData.reduce((acc, user) => {
          const userIdKey = getObjectIdString(user._id);
          if (userIdKey) {
            acc[userIdKey] = user;
          }
          return acc;
        }, {});

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const ordersThisYear = orderData.filter(o => new Date(o.createdAt).getFullYear() === currentYear);
        const ordersThisMonth = ordersThisYear.filter(o => new Date(o.createdAt).getMonth() === currentMonth);

        const orderCounts = {};
        orderData.forEach(o => {
          const orderUserIdKey = getObjectIdString(o.user);
          if (orderUserIdKey) {
            orderCounts[orderUserIdKey] = (orderCounts[orderUserIdKey] || 0) + 1;
          }
        });

        const topUsers = Object.entries(orderCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([userIdFromOrderCounts, count]) => {
            const user = usersById[userIdFromOrderCounts];
            return { user: user?.username || `User #${userIdFromOrderCounts.slice(-6).toUpperCase()}`, count };
          });

        const activeBuyers = Object.keys(orderCounts).length;

        const roleDistribution = userData.reduce((acc, user) => {
          const role = user.role || 'unknown';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});

        const bannedUsersCount = userData.filter(u => u.banned).length;
        const activeUsersCount = userData.length - bannedUsersCount;

        setUsers(userData);
        setStats({
          totalUsers: userData.length,
          totalOrders: orderData.length,
          ordersThisYear: ordersThisYear.length,
          ordersThisMonth: ordersThisMonth.length,
          avgOrdersPerUser: userData.length > 0 ? (orderData.length / userData.length).toFixed(2) : 0,
          activeBuyerPercentage: userData.length > 0 ? ((activeBuyers / userData.length) * 100).toFixed(1) : 0,
          topUsers,
          userRoleDistribution: roleDistribution,
          bannedUsers: bannedUsersCount,
          activeUsers: activeUsersCount
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [token]);

  const filteredUsers = users.filter(user =>
    (user.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.username ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = 'Username,Email,Role,Banned\n';
    const rows = filteredUsers.map(u =>
      `${u.username ?? ''},${u.email ?? ''},${u.role ?? ''},${u.banned ? 'Yes' : 'No'}`
    );
    const csv = headers + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'users.csv');
  };

  const toggleBan = async (id) => {
    try {
      const res = await fetch(getApiUrl(`/api/users/${id}/ban`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to toggle ban status for user ID: ${id}`);
      }

      const msg = await res.json();
      alert(msg.message || 'User status updated!');

      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(u => {
          if (getObjectIdString(u._id) === id) {
            return { ...u, banned: !u.banned };
          }
          return u;
        });

        const bannedUsersCount = updatedUsers.filter(u => u.banned).length;
        const activeUsersCount = updatedUsers.length - bannedUsersCount;
        const roleDistribution = updatedUsers.reduce((acc, user) => {
          const role = user.role || 'unknown';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});

        setStats(prevStats => ({
          ...prevStats,
          bannedUsers: bannedUsersCount,
          activeUsers: activeUsersCount,
          userRoleDistribution: roleDistribution
        }));

        return updatedUsers;
      });
    } catch (error) {
      console.error("Error toggling ban status:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const rolePieData = {
    labels: Object.keys(stats.userRoleDistribution),
    datasets: [{
      label: 'Users by Role',
      data: Object.values(stats.userRoleDistribution),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'],
      hoverOffset: 4
    }]
  };

  const bannedStatusPieData = {
    labels: ['Active Users', 'Banned Users'],
    datasets: [{
      label: 'User Status',
      data: [stats.activeUsers, stats.bannedUsers],
      backgroundColor: ['#10b981', '#ef4444'],
      hoverOffset: 4
    }]
  };

  return (
    <>
      <Header />
      <div className="user-management-container">
        <h1>User Management Dashboard</h1>

        {/* Search and Export Controls */}
        <div className="controls-bar">
          <input
            type="text"
            placeholder="Search users by email or username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input search-input"
          />
          <button
            onClick={handleExportCSV}
            className="btn btn-primary export-csv-btn"
          >
            Export CSV Report
          </button>
        </div>

        {/* Overview Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Users Overview</h3>
            <p><span>Total Registry</span> <strong>{stats.totalUsers}</strong></p>
            <p><span>Active Accounts</span> <strong style={{ color: 'var(--success)' }}>{stats.activeUsers}</strong></p>
            <p><span>Banned Accounts</span> <strong style={{ color: 'var(--danger)' }}>{stats.bannedUsers}</strong></p>
          </div>
          <div className="stat-card">
            <h3>Order Log Metrics</h3>
            <p><span>Total Placements</span> <strong>{stats.totalOrders}</strong></p>
            <p><span>Orders (Year)</span> <strong>{stats.ordersThisYear}</strong></p>
            <p><span>Orders (Month)</span> <strong>{stats.ordersThisMonth}</strong></p>
          </div>
          <div className="stat-card">
            <h3>Buyer Analytics</h3>
            <p><span>Average Purchase Rate</span> <strong>{stats.avgOrdersPerUser}</strong></p>
            <p><span>Active Buyer Ratio</span> <strong>{stats.activeBuyerPercentage}%</strong></p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="chart-grid">
          <div className="chart-card">
            <h3>User Role Distribution</h3>
            <div style={{ position: 'relative', width: '100%', height: '220px' }}>
              <Pie
                data={rolePieData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8' } },
                    tooltip: { bodyColor: '#fff', titleColor: '#fff', backgroundColor: 'rgba(15,23,42,0.9)' }
                  }
                }}
              />
            </div>
          </div>

          <div className="chart-card">
            <h3>User Status Overview</h3>
            <div style={{ position: 'relative', width: '100%', height: '220px' }}>
              <Pie
                data={bannedStatusPieData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8' } },
                    tooltip: { bodyColor: '#fff', titleColor: '#fff', backgroundColor: 'rgba(15,23,42,0.9)' }
                  }
                }}
              />
            </div>
          </div>

          <div className="chart-card large-chart">
            <h3>Order Timeline History</h3>
            <div style={{ position: 'relative', width: '100%', height: '220px' }}>
              <Bar
                data={{
                  labels: ['Cumulative', 'This Year', 'This Month'],
                  datasets: [{
                    label: 'Orders Count',
                    data: [stats.totalOrders, stats.ordersThisYear, stats.ordersThisMonth],
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b'],
                    borderColor: ['#3b82f6', '#8b5cf6', '#f59e0b'],
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { bodyColor: '#fff', titleColor: '#fff', backgroundColor: 'rgba(15,23,42,0.9)' }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1, color: '#94a3b8' },
                      grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    x: {
                      ticks: { color: '#94a3b8' },
                      grid: { display: false }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Top Users by Orders List */}
        <h2 className="section-heading">Top Customers by Purchase Count</h2>
        <ul className="top-users-list">
          {stats.topUsers.length > 0 ? (
            stats.topUsers.map((u, i) => (
              <li key={i} className="top-users-item">
                <span className="user-name">{u.user}</span>
                <span className="order-count-badge">{u.count} orders</span>
              </li>
            ))
          ) : (
            <li className="top-users-item" style={{ color: 'var(--text-muted)', justifyContent: 'center' }}>No buyer metrics recorded.</li>
          )}
        </ul>

        {/* All Users Table */}
        <h2 className="section-heading">User Directory Control</h2>
        <div className="admin-table-card">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email Address</th>
                <th>Privileges</th>
                <th>Restrictions</th>
                <th>Account Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={getObjectIdString(user._id)}>
                    <td data-label="Username" style={{ fontWeight: '600', color: '#fff' }}>{user.username ?? 'N/A'}</td>
                    <td data-label="Email Address">{user.email ?? 'N/A'}</td>
                    <td data-label="Privileges">{user.role ?? 'customer'}</td>
                    <td data-label="Restrictions">
                      <span style={{ 
                        color: user.banned ? 'var(--danger)' : 'var(--success)',
                        fontWeight: '600'
                      }}>
                        {user.banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td data-label="Account Actions">
                      <button
                        onClick={() => toggleBan(getObjectIdString(user._id))}
                        className={`ban-toggle-btn ${user.banned ? 'banned' : 'active'}`}
                      >
                        {user.banned ? 'Unban User' : 'Ban User'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No accounts match the filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
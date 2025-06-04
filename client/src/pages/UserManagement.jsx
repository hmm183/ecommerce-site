// client/src/pages/UserManagement.jsx
import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { saveAs } from 'file-saver';
import { Link } from 'react-router-dom';
import { removeToken } from '../utils/auth';
import './UserManagement.css'; // Import the CSS file for styling

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// AdminHeader component (moved inside for completeness if not in a separate file)
function AdminHeader() {
  const handleHomeClick = () => {
    removeToken(); // Clear token on "Home" click for logout
  };

  return (
    <header className="header">
      <nav className="nav-bar">
        <Link to="/" className="nav-link" onClick={handleHomeClick}>Home</Link>
        <Link to="/admin" className="nav-link">Add Product</Link>
        <Link to="/orders" className="nav-link">Order Status</Link>
        <Link to="/user-management" className="nav-link">User Management</Link>
      </nav>
    </header>
  );
}

// Helper function to safely get ObjectId string from various formats
const getObjectIdString = (idValue) => {
  if (!idValue) {
    return '';
  }

  // Handle MongoDB ObjectId objects directly
  if (typeof idValue === 'object' && idValue._id) {
    return getObjectIdString(idValue._id);
  }

  // Handle Mongoose/MongoDB extended JSON format { "$oid": "..." }
  if (typeof idValue === 'object' && idValue.$oid && typeof idValue.$oid === 'string') {
    return idValue.$oid;
  }

  // Handle BSON ObjectId toString() method
  if (typeof idValue === 'object' && typeof idValue.toString === 'function' && idValue.constructor.name === 'ObjectId') {
    return idValue.toString();
  }

  // Fallback for direct string or number IDs
  return String(idValue);
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]); // Kept for completeness if needed for other stats
  const [searchQuery, setSearchQuery] = useState('');
  const token = localStorage.getItem('token');

  // State to hold calculated statistics for the dashboard
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

  // Effect to fetch user and order data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, orderRes] = await Promise.all([
          fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
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

        // Create a map of users by their ID for efficient lookup
        const usersById = userData.reduce((acc, user) => {
          const userIdKey = getObjectIdString(user._id);
          if (userIdKey) {
            acc[userIdKey] = user;
          }
          return acc;
        }, {});

        // Calculate order trends
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        const ordersThisYear = orderData.filter(o => new Date(o.createdAt).getFullYear() === currentYear);
        const ordersThisMonth = ordersThisYear.filter(o => new Date(o.createdAt).getMonth() === currentMonth);

        // Calculate order counts per user for top buyers
        const orderCounts = {};
        orderData.forEach(o => {
          const orderUserIdKey = getObjectIdString(o.user);
          if (orderUserIdKey) {
            orderCounts[orderUserIdKey] = (orderCounts[orderUserIdKey] || 0) + 1;
          }
        });

        // Determine top 5 users by order count
        const topUsers = Object.entries(orderCounts)
          .sort((a, b) => b[1] - a[1]) // Sort descending by order count
          .slice(0, 5) // Take top 5
          .map(([userIdFromOrderCounts, count]) => {
            const user = usersById[userIdFromOrderCounts];
            // Provide a fallback name if user not found (e.g., deleted user)
            return { user: user?.username || `Unknown User (ID: ${userIdFromOrderCounts.slice(-6)})`, count };
          });

        // Calculate active buyers (users with at least one order)
        const activeBuyers = Object.keys(orderCounts).length;

        // Calculate user role distribution
        const roleDistribution = userData.reduce((acc, user) => {
          const role = user.role || 'unknown'; // Default to 'unknown' if role is missing
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});

        // Calculate banned and active user counts
        const bannedUsersCount = userData.filter(u => u.banned).length;
        const activeUsersCount = userData.length - bannedUsersCount;

        // Update state with fetched data and calculated statistics
        setUsers(userData);
        setOrders(orderData);
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
        // Optionally, display an error message to the user
      }
    };

    fetchData();
  }, [token]); // Re-run effect if token changes

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    (user.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.username ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle CSV export of filtered user data
  const handleExportCSV = () => {
    const headers = 'Username,Email,Role,Banned\n';
    const rows = filteredUsers.map(u =>
      `${u.username ?? ''},${u.email ?? ''},${u.role ?? ''},${u.banned ? 'Yes' : 'No'}`
    );
    const csv = headers + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'users.csv'); // Uses file-saver library
  };

  // Toggle user ban status
  const toggleBan = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}/ban`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to toggle ban status for user ID: ${id}`);
      }

      const msg = await res.json();
      alert(msg.message || 'User ban status updated successfully!');

      // Update the local state to reflect the change immediately
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(u => {
          if (getObjectIdString(u._id) === id) {
            return { ...u, banned: !u.banned }; // Toggle banned status
          }
          return u;
        });

        // Recalculate and update stats related to user status and roles
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

  // Data for User Role Distribution Pie Chart
  const rolePieData = {
    labels: Object.keys(stats.userRoleDistribution),
    datasets: [{
      label: 'Users by Role',
      data: Object.values(stats.userRoleDistribution),
      backgroundColor: ['#36A2EB', '#FFCE56', '#FF6384', '#4BC0C0', '#9966FF', '#FF9900', '#FF8000', '#8000FF'],
      hoverOffset: 4
    }]
  };

  // Data for User Status Overview Pie Chart
  const bannedStatusPieData = {
    labels: ['Active Users', 'Banned Users'],
    datasets: [{
      label: 'User Status',
      data: [stats.activeUsers, stats.bannedUsers],
      backgroundColor: ['#28a745', '#dc3545'], // Green for active, Red for banned
      hoverOffset: 4
    }]
  };

  return (
    <>
      <AdminHeader /> {/* Admin navigation header */}
      <div className="user-management-container">
        <h1>User Management Dashboard</h1>

        {/* Search and Export Controls */}
        <div className="controls-bar">
          <input
            type="text"
            placeholder="Search users by email or username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button
            onClick={handleExportCSV}
            className="export-csv-btn"
          >
            Export CSV
          </button>
        </div>

        {/* Overview Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Users Overview</h3>
            <p>Total Users: <strong className="primary-accent">{stats.totalUsers}</strong></p>
            <p>Active Users: <strong className="success-color">{stats.activeUsers}</strong></p>
            <p>Banned Users: <strong className="danger-color">{stats.bannedUsers}</strong></p>
          </div>
          <div className="stat-card">
            <h3>Orders</h3>
            <p>Total Orders: <strong className="purple-accent">{stats.totalOrders}</strong></p>
            <p>Orders This Year: <strong className="warning-color">{stats.ordersThisYear}</strong></p>
            <p>Orders This Month: <strong className="info-color">{stats.ordersThisMonth}</strong></p>
          </div>
          <div className="stat-card">
            <h3>Buyer Analytics</h3>
            <p>Avg. Orders/User: <strong className="orange-accent">{stats.avgOrdersPerUser}</strong></p>
            <p>Active Buyers: <strong className="teal-accent">{stats.activeBuyerPercentage}%</strong></p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="chart-grid">
          <div className="chart-card">
            <h3>User Role Distribution</h3>
            <Pie
              data={rolePieData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { color: '#e0e0e0' } },
                  tooltip: { bodyColor: '#e0e0e0', titleColor: '#e0e0e0', backgroundColor: 'rgba(30,30,30,0.8)' }
                }
              }}
            />
          </div>

          <div className="chart-card">
            <h3>User Status Overview</h3>
            <Pie
              data={bannedStatusPieData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { color: '#e0e0e0' } },
                  tooltip: { bodyColor: '#e0e0e0', titleColor: '#e0e0e0', backgroundColor: 'rgba(30,30,30,0.8)' }
                }
              }}
            />
          </div>

          <div className="chart-card large-chart">
            <h3>Order Trends</h3>
            <Bar
              data={{
                labels: ['Total', 'This Year', 'This Month'],
                datasets: [{
                  label: 'Number of Orders',
                  data: [stats.totalOrders, stats.ordersThisYear, stats.ordersThisMonth],
                  backgroundColor: ['#4BC0C0', '#9966FF', '#FF9900'],
                  borderColor: ['#4BC0C0', '#9966FF', '#FF9900'],
                  borderWidth: 1
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top', labels: { color: '#e0e0e0' } },
                  tooltip: { bodyColor: '#e0e0e0', titleColor: '#e0e0e0', backgroundColor: 'rgba(30,30,30,0.8)' }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Number of Orders', color: '#c0c0c0' },
                    ticks: { stepSize: 1, color: '#c0c0c0' },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' }
                  },
                  x: {
                    ticks: { color: '#c0c0c0' },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Top Users by Orders List */}
        <h2 className="section-heading">Top Users by Orders</h2>
        <ul className="top-users-list">
          {stats.topUsers.length > 0 ? (
            stats.topUsers.map((u, i) => (
              <li key={i} className="top-users-item">
                <span className="user-name">{u.user}</span>
                <span className="order-count-badge">{u.count} orders</span>
              </li>
            ))
          ) : (
            <li className="top-users-item empty-message">No top users to display yet.</li>
          )}
        </ul>

        {/* All Users Table */}
        <h2 className="section-heading">All Users</h2>
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Banned</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={getObjectIdString(user._id)}>
                    <td data-label="Username">{user.username ?? 'N/A'}</td>
                    <td data-label="Email">{user.email ?? 'N/A'}</td>
                    <td data-label="Role">{user.role ?? 'N/A'}</td>
                    <td data-label="Banned">{user.banned ? 'Yes' : 'No'}</td>
                    <td data-label="Actions">
                      <button
                        onClick={() => toggleBan(getObjectIdString(user._id))}
                        className={`ban-toggle-btn ${user.banned ? 'banned' : 'active'}`}
                      >
                        {user.banned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-table-message">No users found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
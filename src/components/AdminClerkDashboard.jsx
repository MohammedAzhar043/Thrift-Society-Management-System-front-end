import { useState } from 'react';
import { FaEye, FaChartLine, FaFileAlt, FaSignOutAlt, FaSearch } from 'react-icons/fa';

function AdminClerkDashboard({ user, onLogout }) {
  const [recentActivities] = useState([
    { id: 1, action: "New collection recorded", group: "Group A", amount: "₹1,250", time: "2 hours ago" },
    { id: 2, action: "Loan application submitted", member: "Member 5", amount: "₹5,000", time: "5 hours ago" },
    { id: 3, action: "New member registration", member: "Applicant 4", time: "Yesterday" },
    { id: 4, action: "Payment received", member: "Member 12", amount: "₹500", time: "Yesterday" },
  ]);

  const [collectionStats] = useState({
    daily: 4250,
    weekly: 21500,
    monthly: 85200,
    pendingDeposits: 2
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Admin Clerk Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {user.name}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center text-gray-700 hover:text-gray-900"
          >
            <FaSignOutAlt className="mr-1" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <FaEye className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Daily Collection</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">₹{collectionStats.daily}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <FaChartLine className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Weekly Collection</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">₹{collectionStats.weekly}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <FaFileAlt className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Monthly Collection</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">₹{collectionStats.monthly}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                  <FaSearch className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Deposits</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{collectionStats.pendingDeposits}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activities</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">System activities monitoring</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {activity.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.group || activity.member} {activity.amount && `- ${activity.amount}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monitoring Tools Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Monitoring Tools</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Oversight and reporting functions</p>
            </div>
            <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-4">
              <div className="flex items-start p-4 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0">
                  <FaChartLine className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Collection Reports</h4>
                  <p className="mt-1 text-sm text-blue-600">
                    Generate daily, weekly, and monthly collection reports
                  </p>
                </div>
              </div>

              <div className="flex items-start p-4 bg-green-50 rounded-lg">
                <div className="flex-shrink-0">
                  <FaEye className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">Deposit Monitoring</h4>
                  <p className="mt-1 text-sm text-green-600">
                    View and verify bill collector deposits
                  </p>
                </div>
              </div>

              <div className="flex items-start p-4 bg-yellow-50 rounded-lg">
                <div className="flex-shrink-0">
                  <FaFileAlt className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">Audit Logs</h4>
                  <p className="mt-1 text-sm text-yellow-600">
                    Access system audit logs and transaction history
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 py-4 bg-gray-50 sm:px-6">
              <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                Generate Comprehensive Report
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminClerkDashboard;
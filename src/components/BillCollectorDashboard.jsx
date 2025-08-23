// components/BillCollectorDashboard.jsx
import { useState } from 'react';
import { FaUsers, FaMoneyBillWave, FaHistory, FaHandHoldingUsd, FaSignOutAlt } from 'react-icons/fa';

function BillCollectorDashboard({ user, onLogout }) {
  const [groups] = useState([
    { id: 1, name: "Group A", location: "Location A", members: 12, collected: 1250 },
    { id: 2, name: "Group B", location: "Location B", members: 8, collected: 850 },
    { id: 3, name: "Group C", location: "Location C", members: 15, collected: 1800 },
  ]);

  const [showAllGroups, setShowAllGroups] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Bill Collector Dashboard</h1>
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
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <FaUsers className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Groups</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">3</div>
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
                  <FaMoneyBillWave className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Collection</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">₹3,900</div>
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
                  <FaHandHoldingUsd className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Loans</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">5</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Groups Section */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Groups</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">List of groups you manage</p>
              </div>
              <ul className="divide-y divide-gray-200">
                {groups.slice(0, showAllGroups ? groups.length : 2).map((group) => (
                  <li key={group.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600 truncate">{group.name}</p>
                          <p className="mt-2 flex items-center text-sm text-gray-500">
                            <FaUsers className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                            {group.members} members
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            ₹{group.collected} collected
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <div className="text-sm text-gray-500">
                          <span className="text-gray-600">Location: {group.location}</span>
                        </div>
                        <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
                          View details
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {groups.length > 2 && (
                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button
                    onClick={() => setShowAllGroups(!showAllGroups)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    {showAllGroups ? 'Show less' : 'Load more'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links Section */}
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Links</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Quick actions</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid gap-4">
                  <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <FaMoneyBillWave className="mr-2" /> Collect Daily Money
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <FaHistory className="mr-2" /> View Transaction History
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <FaHandHoldingUsd className="mr-2" /> Raise Loan Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BillCollectorDashboard;
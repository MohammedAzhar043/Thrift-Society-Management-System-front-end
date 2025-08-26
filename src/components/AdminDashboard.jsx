import { useState } from "react";
import {
  FaUsers,
  FaUserPlus,
  FaHandHoldingUsd,
  FaChartBar,
  FaSignOutAlt,
  FaCog,
} from "react-icons/fa";

function AdminDashboard({ user, onLogout }) {
  const [groups] = useState([
    {
      id: 1,
      name: "Group A",
      location: "Location A",
      members: 12,
      leader: "Leader 1",
      collector: "Collector 1",
    },
    {
      id: 2,
      name: "Group B",
      location: "Location B",
      members: 8,
      leader: "Leader 2",
      collector: "Collector 2",
    },
    {
      id: 3,
      name: "Group C",
      location: "Location C",
      members: 15,
      leader: "Leader 3",
      collector: "Collector 3",
    },
  ]);

  const [pendingApprovals] = useState([
    { id: 1, name: "Applicant 1", type: "Member", date: "2023-10-15" },
    { id: 2, name: "Applicant 2", type: "Member", date: "2023-10-14" },
    {
      id: 3,
      name: "Applicant 3",
      type: "Loan",
      date: "2023-10-13",
      amount: "₹5,000",
      location: "Location A",
      leader: "Leader 1",
      collector: "Collector 1",
    },
  ]);

  // Split members and loans
  const memberApprovals = pendingApprovals.filter(
    (item) => item.type === "Member"
  );
  const loanApprovals = pendingApprovals.filter((item) => item.type === "Loan");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600">Welcome, {user.name}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <FaCog className="text-gray-600" />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center text-gray-700 hover:text-gray-900"
            >
              <FaSignOutAlt className="mr-1" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6 flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <FaUsers className="text-white h-6 w-6" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Total Groups
                </p>
                <p className="text-2xl font-semibold text-gray-900">3</p>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6 flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <FaUserPlus className="text-white h-6 w-6" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Pending Member Approvals
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {memberApprovals.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6 flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <FaHandHoldingUsd className="text-white h-6 w-6" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Pending Loan Approvals
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loanApprovals.length}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Collections */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6 flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <FaHandHoldingUsd className="text-white h-6 w-6" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Daily Collections
                </p>
                <p className="text-2xl font-semibold text-gray-900">₹3,200</p>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6 flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <FaChartBar className="text-white h-6 w-6" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Total Collection
                </p>
                <p className="text-2xl font-semibold text-gray-900">₹15,200</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals Section */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
          {/* Pending Member Approvals */}
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Pending Member Approvals
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Members awaiting approval
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {memberApprovals.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          Approve
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
          {/* Pending Loan Approvals */}
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Pending Loan Approvals
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Loans awaiting approval
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Team Leader
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Bill Collector
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loanApprovals.map((loan) => (
                    <tr key={loan.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {loan.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {loan.amount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {loan.location}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {loan.leader}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {loan.collector}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {loan.date}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          Approve
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Groups Management Section */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Group Management
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              All groups in the system
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Group Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Team Leader
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bill Collector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {group.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {group.location}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {group.members}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {group.leader}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {group.collector}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;

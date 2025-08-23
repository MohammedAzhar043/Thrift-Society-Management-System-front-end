import { useState } from 'react';
import { FaMoneyBillWave, FaCreditCard, FaHistory, FaSignOutAlt } from 'react-icons/fa';

function IndividualMemberDashboard({ user, onLogout }) {
  const [paymentHistory] = useState([
    { id: 1, date: "2023-10-05", amount: 500, type: "Weekly Payment", status: "Completed" },
    { id: 2, date: "2023-09-28", amount: 500, type: "Weekly Payment", status: "Completed" },
    { id: 3, date: "2023-09-21", amount: 500, type: "Weekly Payment", status: "Completed" },
    { id: 4, date: "2023-09-14", amount: 500, type: "Weekly Payment", status: "Completed" },
  ]);

  const [loanDetails] = useState({
    currentLoan: 0,
    eligibility: 10000,
    interestRate: 12,
    nextPaymentDue: "2023-11-15",
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Member Dashboard</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <FaMoneyBillWave className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Current Loan</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">₹{loanDetails.currentLoan}</div>
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
                  <FaCreditCard className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Loan Eligibility</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">₹{loanDetails.eligibility}</div>
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
                  <FaHistory className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Next Payment Due</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{loanDetails.nextPaymentDue}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment History Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Payment History</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Your recent transactions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{payment.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Loan Details Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Loan Details</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Your current loan information</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Current Loan Amount</dt>
                  <dd className="mt-1 text-sm text-gray-900">₹{loanDetails.currentLoan}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Loan Eligibility</dt>
                  <dd className="mt-1 text-sm text-gray-900">₹{loanDetails.eligibility}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Interest Rate</dt>
                  <dd className="mt-1 text-sm text-gray-900">{loanDetails.interestRate}% per annum</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Next Payment Due</dt>
                  <dd className="mt-1 text-sm text-gray-900">{loanDetails.nextPaymentDue}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      In Good Standing
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
            <div className="px-4 py-4 bg-gray-50 sm:px-6">
              <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                Apply for Loan
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default IndividualMemberDashboard;
// components/Home.jsx
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaMoneyBillWave,
  FaHandHoldingUsd,
  FaChartLine,
} from "react-icons/fa";

function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-blue-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold">
            Kranthimahila Society Management System
          </h1>
          <Link
            to="/login"
            className="bg-white text-blue-800 px-3 sm:px-4 py-2 rounded-md font-medium hover:bg-blue-100 transition-colors text-sm sm:text-base"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-100 text-black py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Welcome to Kranthimahila Society Management System
          </h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto text-gray-700">
            Efficiently manage groups, collections, loans, and members with our
            comprehensive microfinance management solution.
          </p>
          <Link
            to="/login"
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md font-medium text-base sm:text-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800">
            Key Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <FaUsers className="text-blue-600 text-3xl sm:text-4xl" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Group Management</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Create and manage groups with members efficiently.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <FaMoneyBillWave className="text-blue-600 text-3xl sm:text-4xl" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Collection Tracking</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Track daily collections and transactions seamlessly.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <FaHandHoldingUsd className="text-blue-600 text-3xl sm:text-4xl" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Loan Management</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Process and monitor loan requests effectively.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <FaChartLine className="text-blue-600 text-3xl sm:text-4xl" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Reporting</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Generate comprehensive reports and analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 sm:py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm sm:text-base">
            &copy; {new Date().getFullYear()} KRANTHI MAHILA SOCIETY SOFTWARE.
            All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;

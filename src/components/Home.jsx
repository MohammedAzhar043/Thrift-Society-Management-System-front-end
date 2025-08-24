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
      {" "}
      {/* Header */}{" "}
      <header className="bg-blue-800 text-white shadow-md">
        {" "}
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          {" "}
          <h1 className="text-2xl font-bold">
            {" "}
            Thrift Society Management System{" "}
          </h1>{" "}
          <Link
            to="/login"
            className="bg-white text-blue-800 px-4 py-2 rounded-md font-medium hover:bg-blue-100 transition-colors"
          >
            {" "}
            Login{" "}
          </Link>{" "}
        </div>{" "}
      </header>{" "}
      {/* Hero Section */}{" "}
      <section className="bg-gradient-to-r text-black py-16">
        {" "}
        <div className="container mx-auto px-4 text-center">
          {" "}
          <h2 className="text-4xl font-bold mb-4">
            {" "}
            Welcome to Thrift Society Management System{" "}
          </h2>{" "}
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {" "}
            Efficiently manage groups, collections, loans, and members with our
            comprehensive microfinance management solution.{" "}
          </p>{" "}
          <Link
            to="/login"
            className="bg-white text-blue-900 px-6 py-3 rounded-md font-medium text-lg hover:bg-blue-500 transition-colors inline-block"
          >
            {" "}
            Get Started{" "}
          </Link>{" "}
        </div>{" "}
      </section>{" "}
      {/* Features Section */}{" "}
      <section className="py-16 bg-white">
        {" "}
        <div className="container mx-auto px-4">
          {" "}
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            {" "}
            Key Features{" "}
          </h2>{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {" "}
            <div className="bg-gray-100 p-6 rounded-lg shadow-sm text-center">
              {" "}
              <div className="flex justify-center mb-4">
                {" "}
                <FaUsers className="text-blue-600 text-4xl" />{" "}
              </div>{" "}
              <h3 className="text-xl font-semibold mb-2">Group Management</h3>{" "}
              <p className="text-gray-600">
                {" "}
                Create and manage groups with members efficiently.{" "}
              </p>{" "}
            </div>{" "}
            <div className="bg-gray-100 p-6 rounded-lg shadow-sm text-center">
              {" "}
              <div className="flex justify-center mb-4">
                {" "}
                <FaMoneyBillWave className="text-blue-600 text-4xl" />{" "}
              </div>{" "}
              <h3 className="text-xl font-semibold mb-2">
                {" "}
                Collection Tracking{" "}
              </h3>{" "}
              <p className="text-gray-600">
                {" "}
                Track daily collections and transactions seamlessly.{" "}
              </p>{" "}
            </div>{" "}
            <div className="bg-gray-100 p-6 rounded-lg shadow-sm text-center">
              {" "}
              <div className="flex justify-center mb-4">
                {" "}
                <FaHandHoldingUsd className="text-blue-600 text-4xl" />{" "}
              </div>{" "}
              <h3 className="text-xl font-semibold mb-2">Loan Management</h3>{" "}
              <p className="text-gray-600">
                {" "}
                Process and monitor loan requests effectively.{" "}
              </p>{" "}
            </div>{" "}
            <div className="bg-gray-100 p-6 rounded-lg shadow-sm text-center">
              {" "}
              <div className="flex justify-center mb-4">
                {" "}
                <FaChartLine className="text-blue-600 text-4xl" />{" "}
              </div>{" "}
              <h3 className="text-xl font-semibold mb-2">Reporting</h3>{" "}
              <p className="text-gray-600">
                {" "}
                Generate comprehensive reports and analytics.{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      {/* Footer */}{" "}
      <footer className="bg-gray-800 text-white py-8">
        {" "}
        <div className="container mx-auto px-4 text-center">
          {" "}
          <p>
            {" "}
            &copy; {new Date().getFullYear()} KRANTHI MAHILA SOCIETY SOFTWARE.
            All rights reserved.{" "}
          </p>{" "}
        </div>{" "}
      </footer>{" "}
    </div>
  );
}
export default Home;

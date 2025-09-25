import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Landing: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            LibraryFlow
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Smart Library Crowd Management System with QR Code Technology
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                to="/dashboard"
                className="btn-primary text-lg px-8 py-3"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn-primary text-lg px-8 py-3"
                >
                  Login
                </Link>
                <Link
                  to="/login"
                  className="btn-secondary text-lg px-8 py-3"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-4v4m-6-4h2m0 0h2m-2 0v4m0-4V4m6 0v1m-6 0V4m6 0v1" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Monitoring</h3>
            <p className="text-gray-600">
              Track library occupancy in real-time with live updates and capacity alerts.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-4v4m-6-4h2m0 0h2m-2 0v4m0-4V4m6 0v1m-6 0V4m6 0v1" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">QR Code Technology</h3>
            <p className="text-gray-600">
              Seamless entry and exit tracking using QR codes for students and staff.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Admin Dashboard</h3>
            <p className="text-gray-600">
              Comprehensive admin tools for managing capacity and monitoring usage patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<Role>(Role.STUDENT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const { login, register, isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === Role.ADMIN) {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/portal');
      }
    }
  }, [isAuthenticated, userRole, navigate]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (isRegister) {
      if (!firstName) {
        errors.firstName = 'First name is required';
      }
      if (!lastName) {
        errors.lastName = 'Last name is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register({ 
          email, 
          password, 
          firstName, 
          lastName, 
          role 
        });
      } else {
        await login(email, password);
      }
      
      // Navigation will be handled by useEffect
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: Role.STUDENT, label: 'Student' },
    { value: Role.ADMIN, label: 'Admin' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegister ? 'Create your account' : 'Sign in to LibraryFlow'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setValidationErrors({});
              }}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {isRegister ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isRegister && (
              <>
                <div className="mb-4">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {validationErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {validationErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.role ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value={Role.STUDENT}>Student</option>
                    <option value={Role.ADMIN}>Admin</option>
                  </select>
                  {validationErrors.role && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.role}</p>
                  )}
                </div>
              </>
            )}
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isRegister ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                isRegister ? 'Create Account' : 'Sign In'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ← Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

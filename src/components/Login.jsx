// components/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import apiService from '../services/api';
import Captcha from './Captcha';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);

  const handleCaptchaChange = (isValid) => {
    setIsCaptchaValid(isValid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation including captcha
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    if (!isCaptchaValid) {
      setError('Please complete the security verification correctly');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Call the backend API
      const response = await apiService.login(username, password);
      
      // Get user info to determine role
      const userInfo = await apiService.getCurrentUser();
      
      // Determine primary role (use the first role for now)
      const primaryRole = userInfo.roles[0]?.name || 'member';
      
      console.log('User info from API:', userInfo); // Debug log
      console.log('User roles:', userInfo.roles); // Debug log
      console.log('Primary role determined:', primaryRole); // Debug log
      
      const userData = {
        username: userInfo.username,
        role: primaryRole,
        name: userInfo.full_name || userInfo.username,
        id: userInfo.id,
        email: userInfo.email
      };
      
      console.log('User data being set:', userData); // Debug log
      
      onLogin(userData);
      
      // Redirect based on role
      navigate(`/${primaryRole}`);
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-300 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 sm:py-8 px-4 sm:px-6 shadow sm:rounded-lg sm:px-8 sm:px-10">
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="py-2 sm:py-2 pl-8 sm:pl-10 pr-3 block w-full border border-gray-300 rounded-md leading-5 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-sm"
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="py-2 sm:py-2 pl-8 sm:pr-10 block w-full border border-gray-300 rounded-md leading-5 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-sm"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <FaEye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Captcha Component */}
            <Captcha 
              onCaptchaChange={handleCaptchaChange}
              isDisabled={isLoading}
            />

            <div>
              <button
                type="submit"
                disabled={isLoading || !isCaptchaValid}
                className={`w-full flex justify-center py-2 sm:py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading || !isCaptchaValid
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
        callbackUrl: '/admin/dashboard',
      });

      if (result?.error) {
        setError('Invalid username or password');
      } else if (result?.ok) {
        // Use window.location for full page reload to ensure session is established
        window.location.href = '/admin/dashboard';
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleDriveLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      await signIn('googledrive', {
        callbackUrl: '/admin/dashboard',
      });
    } catch (err) {
      setError('An error occurred during Google Drive login');
      setLoading(false);
    }
  };

  const handleGooglePhotosLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      await signIn('googlephotos', {
        callbackUrl: '/admin/dashboard',
      });
    } catch (err) {
      setError('An error occurred during Google Photos login');
      setLoading(false);
    }
  };

  // const handleDropboxLogin = async () => {
  //   setLoading(true);
  //   setError(null);

  //   try {
  //     await signIn('dropbox', {
  //       callbackUrl: '/admin/dashboard',
  //     });
  //   } catch (err) {
  //     setError('An error occurred during Dropbox login');
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-600 mb-6">Sign in to access the admin dashboard</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Credentials Login */}
          <form onSubmit={handleCredentialsLogin} className="mb-6">
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Signing in...' : 'Sign In with Password'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          {/* Google Drive Login */}
          <button
            onClick={handleGoogleDriveLogin}
            disabled={loading}
            className="w-full px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              {/* Google Drive Icon - Official triangular design with three colored sections */}
              <path
                fill="#0066DA"
                d="M7.71 6.5L1.15 17h5.56l6.56-10.5H7.71z"
              />
              <path
                fill="#00AC47"
                d="M14.29 6.5L7.73 17h5.56l6.56-10.5h-5.56z"
              />
              <path
                fill="#EA4335"
                d="M22.85 17l-6.56-10.5h-5.56L17.29 17h5.56z"
              />
            </svg>
            Sign in with Google Drive
          </button>

          {/* Google Photos Login */}
          <button
            onClick={handleGooglePhotosLogin}
            disabled={loading}
            className="w-full px-4 py-2 mt-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              {/* Google Photos Icon - Official design with camera frame */}
              <path
                fill="#4285F4"
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
              />
              <path
                fill="#34A853"
                d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"
              />
              <circle
                fill="#EA4335"
                cx="12"
                cy="12"
                r="2"
              />
            </svg>
            Sign in with Google Photos
          </button>

          {/* Dropbox Login (COMMENTED OUT) */}
          {/* <button
            onClick={handleDropboxLogin}
            disabled={loading}
            className="w-full px-4 py-2 mt-3 bg-[#0061FE] text-white rounded-lg hover:bg-[#0057e5] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 1.807L0 5.614l6 3.807 6-3.807-6-3.807zM18 1.807l-6 3.807 6 3.807 6-3.807-6-3.807zM0 13.228l6 3.807 6-3.807-6-3.807-6 3.807zM18 13.228l-6 3.807 6-3.807-6-3.807-6 3.807zM6 16.972l6 3.807 6-3.807 6 3.807-6 3.807-6-3.807-6-3.807z" />
            </svg>
            Sign in with Dropbox
          </button> */}

          <p className="text-xs text-gray-500 mt-6 text-center">
            Login will store OAuth tokens for API access
          </p>
        </div>
      </div>
    </div>
  );
}


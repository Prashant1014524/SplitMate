import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowRight, Sun, Moon, AlertCircle } from 'lucide-react';

export default function Auth() {
  const { loginUser, registerUser, googleLoginUser, theme, toggleTheme } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize Google Identity Services if client ID exists
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (googleClientId && window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response.credential) {
              setLoading(true);
              const res = await googleLoginUser(response.credential);
              if (!res.success) {
                setError(res.message || 'Google authentication failed.');
              }
              setLoading(false);
            }
          }
        });

        const btnContainer = document.getElementById('google-btn-container');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: theme === 'dark' ? 'filled_black' : 'outline',
            size: 'large',
            width: '100%',
            shape: 'rectangular',
            text: 'continue_with'
          });
        }
      } catch (e) {
        console.warn('Google SDK init error:', e);
      }
    }
  }, [googleLoginUser, theme]);

  const handleGoogleSignIn = async () => {
    setError('');
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (googleClientId && window.google) {
      window.google.accounts.id.prompt();
    } else {
      setError('To enable Google account selector, add VITE_GOOGLE_CLIENT_ID from Google Cloud Console in Vercel settings. In the meantime, you can sign in directly below!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }

    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await loginUser(email, password);
      } else {
        if (!name.trim()) {
          setError('Please provide your full name.');
          setLoading(false);
          return;
        }
        res = await registerUser(name, email, password, upiId);
      }

      if (!res.success) {
        setError(res.message || 'Authentication failed. Please check credentials.');
      }
    } catch (err) {
      setError(err.message || 'Server connection failed. Is the backend running on port 5000?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-zinc-950 flex flex-col items-center justify-center p-4 relative transition-colors">
      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
        </button>
      </div>

      <div className="max-w-sm w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
        {/* Brand */}
        <div className="text-center space-y-1.5">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold mx-auto flex items-center justify-center text-sm shadow-xs">
            sP
          </div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">sPLIT</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Simple shared expense management</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
              isLogin ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
              !isLogin ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Google Sign In Button */}
        <div id="google-btn-container" className="w-full flex justify-center"></div>
        {(!import.meta.env.VITE_GOOGLE_CLIENT_ID || !window.google) && (
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-200 font-medium text-xs transition-all flex items-center justify-center space-x-2.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-zinc-200 dark:border-zinc-800 w-full"></div>
          <span className="bg-white dark:bg-zinc-900 px-2 text-[10px] uppercase tracking-wider text-zinc-400 shrink-0 font-medium">
            or with email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isLogin && (
            <>
              <div>
                <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Prashant Uniyal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-xs"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-zinc-600 dark:text-zinc-400">UPI ID / Phone (Optional)</label>
                  <span className="text-[10px] text-zinc-400">For 1-click settlements</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. prashant@okhdfcbank or 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-xs font-mono"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              placeholder="prashant@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-xs"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-2xs mt-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Connecting...' : (isLogin ? 'Sign In' : 'Create Account')}</span>
            {!loading && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

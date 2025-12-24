import React, { useState } from 'react';
import SecurityAnimation from './SecurityAnimation';
import WarningIcon from './icons/WarningIcon';

interface LoginProps {
  onLogin: (hash: string) => void;
  isLoading: boolean;
  error: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading, error }) => {
  const [hash, setHash] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hash.trim() && !isLoading) {
      onLogin(hash.trim());
    }
  };

  if (isLoading) {
      return <SecurityAnimation />;
  }

  return (
    <div className="w-full max-w-md mx-auto mt-20">
        <div className="bg-amber-100 border-l-4 border-amber-400 p-4 rounded-md mb-6 shadow-md">
            <div className="flex">
                <div className="flex-shrink-0">
                    <WarningIcon className="h-6 w-6 text-amber-500" />
                </div>
                <div className="ml-3">
                    <h3 className="text-lg font-bold text-amber-800">Confidential Internal Tool</h3>
                    <div className="mt-2 text-sm text-amber-700">
                        <p>This is a proprietary internal software. Your access is logged. You are responsible for maintaining the confidentiality of your access hash and all data generated.</p>
                    </div>
                </div>
            </div>
        </div>

        <form 
            onSubmit={handleSubmit}
            className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-slate-200 animate-fade-in"
        >
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Access Authentication</h1>
                <p className="text-slate-500 mt-2">
                    Please enter your hash to continue.
                    <br />
                    <a 
                        href="https://passport.tdagroup.online/dashboard" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:text-blue-500 text-sm underline"
                    >
                        Click here to get your hash from the dashboard.
                    </a>
                </p>
            </div>
            <div className="space-y-4">
                <div>
                    <label htmlFor="hash-input" className="sr-only">Access Hash</label>
                    <input
                        id="hash-input"
                        type="text"
                        placeholder="Enter hash..."
                        value={hash}
                        onChange={(e) => setHash(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        required
                        disabled={isLoading}
                    />
                </div>
            </div>

            {error && <p className="mt-4 text-center text-red-500">{error}</p>}

            <button
                type="submit"
                disabled={isLoading || !hash.trim()}
                className="mt-6 w-full px-10 py-3 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-slate-500 disabled:text-slate-300 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center"
            >
                Confirm
            </button>
        </form>
    </div>
  );
};

export default Login;

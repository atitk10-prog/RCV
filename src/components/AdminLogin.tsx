import React, { useState } from 'react';
import { Lock, User, Mail, Eye, EyeOff, ShieldAlert, KeyRound, ArrowRight, Tv } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onSwitchToSpectator: () => void;
}

export default function AdminLogin({ onLoginSuccess, onSwitchToSpectator }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Forgot password flow states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const getStoredCredentials = () => {
    const storedUser = localStorage.getItem('rungchuongvang_admin_user') || 'admin';
    const storedPass = localStorage.getItem('rungchuongvang_admin_pass') || 'admin';
    return { storedUser, storedPass };
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const { storedUser, storedPass } = getStoredCredentials();

    if (username === storedUser && password === storedPass) {
      localStorage.setItem('rungchuongvang_is_authenticated', 'true');
      onLoginSuccess();
    } else {
      setError('Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại!');
    }
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const trimmedEmail = recoveryEmail.trim().toLowerCase();
    if (trimmedEmail === 'at.it.k10@gmail.com') {
      // Reset password to 123456 as requested
      localStorage.setItem('rungchuongvang_admin_pass', '123456');
      setInfoMessage('Khôi phục thành công! Mật khẩu mới của bạn đã được thiết lập là: 123456');
      setRecoveryEmail('');
      setTimeout(() => {
        setIsForgotPassword(false);
        setPassword('');
      }, 5000);
    } else {
      setError('Địa chỉ email Gmail không chính xác hoặc không được đăng ký quyền khôi phục hệ thống.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl shadow-lg mb-2">
            <KeyRound className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 uppercase tracking-tight">
            RUNG CHUÔNG VÀNG
          </h2>
          <p className="text-xs text-slate-400">
            {isForgotPassword ? 'Khôi phục Mật khẩu quản trị viên' : 'Hệ thống Quản lý & Điều hành Sân đấu'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2.5 animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2.5 leading-relaxed">
            <span className="font-semibold">{infoMessage}</span>
          </div>
        )}

        {!isForgotPassword ? (
          /* Login Form */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-username" className="block text-xxs font-bold text-slate-400 uppercase tracking-wider">
                Tài khoản Admin
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="login-username"
                  type="text"
                  required
                  placeholder="Nhập tên tài khoản..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25 rounded-xl text-sm text-slate-200 outline-none transition-all placeholder-slate-600 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="block text-xxs font-bold text-slate-400 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-xxs text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25 rounded-xl text-sm text-slate-200 outline-none transition-all placeholder-slate-600 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5 cursor-pointer mt-6"
            >
              <span>ĐĂNG NHẬP ADMIN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Forgot Password / Recovery Form */
          <form onSubmit={handleRecovery} className="space-y-4">
            <p className="text-xxs text-slate-400 leading-relaxed text-center">
              Nhập đúng tài khoản email Gmail khôi phục của hệ thống để được cấp lại mật khẩu mới là <strong>123456</strong>.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="recovery-email" className="block text-xxs font-bold text-slate-400 uppercase tracking-wider">
                Địa chỉ Gmail khôi phục
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="recovery-email"
                  type="email"
                  required
                  placeholder="at.it.k10@gmail.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25 rounded-xl text-sm text-slate-200 outline-none transition-all placeholder-slate-700 font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer mt-6"
            >
              <span>KHÔI PHỤC MẬT KHẨU</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setError('');
                setInfoMessage('');
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors cursor-pointer"
            >
              Quay lại đăng nhập
            </button>
          </form>
        )}

        {/* Guest Spectator Shortcut */}
        <div className="pt-4 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={onSwitchToSpectator}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-400 font-medium transition-colors cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Xem trực tiếp (Chế độ Khán giả)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

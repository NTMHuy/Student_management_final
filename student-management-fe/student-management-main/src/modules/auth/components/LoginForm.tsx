'use client';

import React, { useState } from 'react';
import { useAuth, UserRole } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { defaultAccounts } from '../mocks/auth.mock';
import {
  Shield,
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [username, setUsername] = useState(defaultAccounts.admin.email);
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setUsername(defaultAccounts[role].email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, selectedRole);
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 700);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-[480px] bg-surface-container-lowest rounded-2xl shadow-xl flex flex-col overflow-hidden border border-outline-variant/30">
      {/* Top Accent Strip */}
      <div className="h-1.5 w-full bg-primary-container" />

      <div className="p-6 sm:p-8 flex flex-col">
        {/* Logo and Headings */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center mb-4 shadow-sm">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
            EduManage School Portal
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Cổng thông tin quản lý đào tạo &amp; học sinh
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="mt-6 p-1 bg-surface-container-low rounded-xl flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleRoleSelect('admin')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Quản trị viên</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('teacher')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'teacher'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Giáo viên</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {/* Username / Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
              Tên đăng nhập / Email
              <span className="text-error font-bold">*</span>
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 absolute left-3.5 text-outline pointer-events-none" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@edumanage.edu.vn"
                className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm placeholder:text-outline transition-all outline-none border border-transparent focus:border-secondary focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                Mật khẩu
                <span className="text-error font-bold">*</span>
              </label>
              <button
                type="button"
                onClick={() => alert('Vui lòng liên hệ IT Quản trị để cấp lại mật khẩu hoặc liên hệ support@edumanage.edu.vn')}
                className="text-xs text-secondary hover:text-primary transition-colors hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3.5 text-outline pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface-container-low text-on-surface text-sm placeholder:text-outline transition-all outline-none border border-transparent focus:border-secondary focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-outline hover:text-on-surface transition-colors cursor-pointer"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-secondary cursor-pointer"
              />
              <span className="text-xs text-on-surface-variant">
                Ghi nhớ đăng nhập trên thiết bị này
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className={`mt-2 w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all select-none cursor-pointer ${
              isSuccess
                ? 'bg-secondary text-on-secondary shadow-md'
                : 'bg-primary-container text-on-primary hover:bg-primary shadow hover:shadow-md active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Đang xác thực...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Đăng nhập thành công</span>
              </>
            ) : (
              <>
                <span>Đăng nhập vào hệ thống</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security & Audit Log Banner */}
        <div className="mt-6 p-3 rounded-xl bg-surface-container-low flex items-start gap-2.5 border border-outline-variant/20">
          <ShieldCheck className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Hệ thống nội bộ bảo mật cao. Tất cả hoạt động truy cập và thao tác dữ liệu đều được lưu lại nhật ký kiểm toán (Audit Logs).
          </p>
        </div>

        {/* Footer Meta */}
        <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-secondary-container" />
            <span>EduManage OS v2.4.0</span>
          </div>
          <a
            href="mailto:support@edumanage.edu.vn"
            className="text-secondary hover:text-primary flex items-center gap-1 transition-colors hover:underline"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hỗ trợ IT trường học</span>
          </a>
        </div>
      </div>
    </div>
  );
};

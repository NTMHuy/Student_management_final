'use client';

import React, { useState } from 'react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { useAuth } from '@/lib/auth/AuthContext';
import { authService } from '../services/auth.service';

export default function SettingsPage() {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (next.length < 8) {
      setFeedback({ kind: 'error', text: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
      return;
    }
    if (next !== confirm) {
      setFeedback({ kind: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setFeedback({ kind: 'success', text: 'Đã đổi mật khẩu thành công.' });
    } catch (error) {
      setFeedback({ kind: 'error', text: error instanceof Error ? error.message : 'Không thể đổi mật khẩu.' });
    } finally {
      setSaving(false);
    }
  };

  const input =
    'w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-secondary';
  const label = 'text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5';

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex flex-col gap-1">
        <Breadcrumb items={[{ label: 'Cài đặt', isCurrent: true }]} />
        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface mt-2">Cài đặt tài khoản</h1>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col gap-1">
        <span className="text-sm font-semibold text-on-surface">{user?.name}</span>
        <span className="text-xs text-on-surface-variant">{user?.email}</span>
        <span className="text-xs text-secondary font-semibold">
          {user?.role === 'admin' ? 'Quản trị viên' : 'Giáo viên'}
        </span>
      </div>

      <form
        onSubmit={submit}
        className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col gap-4"
      >
        <h2 className="font-bold text-base text-on-surface">Đổi mật khẩu</h2>
        <div>
          <label className={label} htmlFor="pw-current">Mật khẩu hiện tại</label>
          <input id="pw-current" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="pw-new">Mật khẩu mới (tối thiểu 8 ký tự)</label>
          <input id="pw-new" type="password" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="pw-confirm">Nhập lại mật khẩu mới</label>
          <input id="pw-confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
        </div>
        {feedback && (
          <p
            role="alert"
            className={`rounded-lg border px-3 py-2 text-sm ${feedback.kind === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}
          >
            {feedback.text}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container shadow transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </div>
      </form>
    </div>
  );
}

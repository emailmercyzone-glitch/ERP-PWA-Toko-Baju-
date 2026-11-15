import React, { useState } from 'react';
import { Role } from '../types/erp';
import { Shield, Key, CheckCircle, X, AlertCircle } from 'lucide-react';
import { executeAPIMode } from '../services/apiEngine';

interface RoleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: Role;
  onRoleChange: (role: Role, tokoId: string) => void;
}

export const RoleLoginModal: React.FC<RoleLoginModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onRoleChange,
}) => {
  const [pin, setPin] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const presets = [
    { role: 'OWNER' as Role, name: 'Owner (Gmail / PIN 999999)', pin: '999999', store: 'TKO1', desc: 'Akses Penuh Semua Toko & Gemini AI' },
    { role: 'MANAGER' as Role, name: 'Manager TKO1 (PIN 888888)', pin: '888888', store: 'TKO1', desc: 'Scope Toko 1 Mall, Void < 500k, Transfer <= 2M' },
    { role: 'KASIR' as Role, name: 'Kasir TKO1 (PIN 123456)', pin: '123456', store: 'TKO1', desc: 'POS Terminal, Diskon 0-5%, Retur Tukar Beda < 200k' },
    { role: 'GUDANG' as Role, name: 'Gudang Pusat (PIN 555555)', pin: '555555', store: 'GDG', desc: 'Inbound PO < 2M, Opname, Transfer Stok' },
  ];

  const handleQuickLogin = (preset: typeof presets[0]) => {
    setPin(preset.pin);
    setSelectedRole(preset.role);
    setErrorMsg('');

    const res = executeAPIMode({
      mode: 'login',
      request_id: `req-login-${Date.now()}`,
      payload: { pin_hash: preset.pin, role: preset.role }
    });

    if (res.ok && res.data) {
      setSuccessMsg(`Login sukses sebagai ${preset.role}!`);
      setTimeout(() => {
        onRoleChange(preset.role, preset.store);
        setSuccessMsg('');
        onClose();
      }, 400);
    } else {
      setErrorMsg(res.error?.message || 'Login gagal.');
    }
  };

  const handleCustomPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = executeAPIMode({
      mode: 'login',
      request_id: `req-login-${Date.now()}`,
      payload: { pin_hash: pin, role: selectedRole }
    });

    if (res.ok && res.data) {
      const data = res.data as any;
      onRoleChange(data.role, data.toko_id);
      onClose();
    } else {
      setErrorMsg(res.error?.message || 'PIN tidak valid. Coba preset di atas.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold">Ganti Role & Hak Akses User</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-950/80 border border-rose-800 p-3 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-950/80 border border-emerald-800 p-3 text-xs text-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Preset Akun Demo ERP
          </label>
          <div className="grid grid-cols-1 gap-2">
            {presets.map((p) => (
              <button
                key={p.role}
                type="button"
                onClick={() => handleQuickLogin(p)}
                className="flex items-start justify-between p-3 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-indigo-600 transition text-left group"
              >
                <div>
                  <div className="text-sm font-semibold text-white group-hover:text-indigo-300">
                    {p.name}
                  </div>
                  <div className="text-xs text-slate-400">{p.desc}</div>
                </div>
                <span className="text-xs bg-indigo-950 text-indigo-300 font-mono px-2 py-1 rounded border border-indigo-800 shrink-0">
                  {p.pin}
                </span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleCustomPinSubmit} className="pt-3 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Input PIN Manual (6 Digit)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Ketuk 6-digit PIN"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shrink-0"
            >
              Verifikasi PIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

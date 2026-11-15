import React from 'react';
import { Role, MasterToko } from '../types/erp';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { Store, UserCheck, ShieldCheck, PlayCircle, Layers, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: Role;
  currentStoreId: string;
  setCurrentStoreId: (storeId: string) => void;
  stores: MasterToko[];
  onOpenRoleModal: () => void;
  onOpenTestModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  currentStoreId,
  setCurrentStoreId,
  stores,
  onOpenRoleModal,
  onOpenTestModal
}) => {
  const navItems = [
    { id: 'pos', label: 'POS Kasir' },
    { id: 'stok', label: 'Gudang & Stok' },
    { id: 'kas', label: 'Kas & Jurnal' },
    { id: 'approval', label: 'Approval & Sync' },
    { id: 'laporan', label: 'Laporan & e-Faktur' },
    { id: 'gaji', label: 'Gaji & Payroll' },
    { id: 'portal', label: 'Portal Penitip & AFF' },
    { id: 'voucher', label: 'Voucher & PreOrder' },
    { id: 'wa', label: 'WhatsApp Alert' },
    { id: 'backup', label: 'Backup & Arsip' },
    { id: 'owner', label: 'Owner & AI' },
  ];

  const currentStore = stores.find((s) => s.toko_id === currentStoreId) || stores[0];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      {/* Offline banner check */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); setActiveTab('pos'); }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              ERP
            </div>
            <span>Toko Baju UMKM</span>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 font-mono px-1.5 py-0.5 rounded border border-indigo-800">
              v40.1
            </span>
          </a>
        </div>

        {/* Zone 2: Navigation Links (single-line, clean text) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
                activeTab === item.id
                  ? 'text-white border-indigo-500 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Store & Role Selector / Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <PWAInstallPrompt />

          {/* Test Case Suite Launcher */}
          <button
            onClick={onOpenTestModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-800 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/80 text-xs font-medium transition"
            title="Uji Otomatis Test Case TC-001 s/d TC-042"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test TC-001..042</span>
          </button>

          {/* Store Switcher */}
          <div className="relative flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
            <Store className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={currentStoreId}
              onChange={(e) => setCurrentStoreId(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              {stores.filter((s) => s.toko_id !== 'ALL').map((s) => (
                <option key={s.toko_id} value={s.toko_id} className="bg-slate-900 text-slate-200">
                  {s.toko_id} - {s.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Active Role Badge */}
          <button
            onClick={onOpenRoleModal}
            className="flex items-center gap-1.5 bg-indigo-950 border border-indigo-800 hover:bg-indigo-900/80 text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentRole}</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-800 bg-slate-950 px-2 py-2 overflow-x-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === item.id ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};

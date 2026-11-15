import React, { useState } from 'react';
import { db } from '../services/db';
import { Tag, Package, Calendar, Plus, CheckCircle2 } from 'lucide-react';

export const VoucherBundlePreorderModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'voucher' | 'bundle' | 'preorder'>('voucher');

  const vouchers = db.voucherKodeDiskon;
  const preorders = db.preOrderIndent;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Subtab Nav */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('voucher')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'voucher' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Voucher Diskon &amp; Stempel</span>
        </button>
        <button
          onClick={() => setActiveTab('bundle')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'bundle' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Bundle Paket Baju</span>
        </button>
        <button
          onClick={() => setActiveTab('preorder')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'preorder' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>PreOrder Indent (DP)</span>
        </button>
      </div>

      {/* VOUCHER TAB */}
      {activeTab === 'voucher' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Daftar Kode Voucher Diskon &amp; Stempel</h3>
            <span className="text-xs text-slate-400 font-mono">Total: {vouchers.length} Kode</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vouchers.map((v) => (
              <div key={v.voucher_id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-indigo-300 font-mono">
                  <span>{v.kode}</span>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">
                    {v.jenis_voucher}
                  </span>
                </div>
                <div className="text-slate-300">
                  {v.nominal ? `Potongan Rp ${v.nominal.toLocaleString('id-ID')}` : `Potongan ${(v.persen || 0) * 100}%`}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Min Belanja: Rp {(v.min_belanja || 0).toLocaleString('id-ID')} · Masa Berlaku: {v.mulai} s/d {v.selesai}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BUNDLE TAB */}
      {activeTab === 'bundle' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
            Bundle Paket Hemat Baju
          </h3>
          <div className="text-xs text-slate-400">
            Contoh: Paket 2 Kaos Erigo + 1 Celana Jeans (Diskon Bundling 15%).
          </div>
        </div>
      )}

      {/* PREORDER TAB */}
      {activeTab === 'preorder' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
            PreOrder Indent &amp; Tracking DP Customer
          </h3>
          <div className="text-xs text-slate-400">
            Melacak status DP PreOrder baju custom / ukuran khusus hingga barang siap diambil di toko.
          </div>
        </div>
      )}
    </div>
  );
};

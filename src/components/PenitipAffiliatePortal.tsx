import React, { useState } from 'react';
import { db } from '../services/db';
import { Building, Users, Wallet, Boxes, CheckCircle2, DollarSign } from 'lucide-react';

export const PenitipAffiliatePortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'penitip' | 'promoter'>('penitip');

  const penitip = db.masterPenitip[0]; // Ibu Hajah Maryam
  const affiliatePromoter = db.masterAffiliate[0]; // Rian Influencer

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Subtab Nav */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('penitip')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'penitip' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Portal Konsinyasi (CNS)</span>
        </button>
        <button
          onClick={() => setActiveTab('promoter')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'promoter' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Portal Affiliate Promoter (AFF)</span>
        </button>
      </div>

      {/* PORTAL PENITIP (CNS) */}
      {activeTab === 'penitip' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">{penitip.nama}</h3>
              <p className="text-xs text-slate-400">
                Mitra Penitip Konsinyasi · WA: {penitip.wa} · Tanggung Jawab Rusak: {penitip.tanggung_rusak}
              </p>
            </div>
            <span className="text-xs bg-indigo-950 text-indigo-300 font-mono px-3 py-1 rounded-lg border border-indigo-800">
              Settlement: {penitip.settlement_type}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <div className="text-slate-400 font-sans">Komisi Toko</div>
              <div className="text-lg font-bold text-indigo-400">{penitip.komisi_persen * 100}% Dari Penjualan</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <div className="text-slate-400 font-sans">Penjualan Terjual</div>
              <div className="text-lg font-bold text-white">1 Pcs (Jaket Parka)</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <div className="text-slate-400 font-sans">Klaim Pencairan Bersih</div>
              <div className="text-lg font-bold text-emerald-400">Rp 280.000</div>
            </div>
          </div>
        </div>
      )}

      {/* PORTAL PROMOTER (AFF) */}
      {activeTab === 'promoter' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">{affiliatePromoter.nama}</h3>
              <p className="text-xs text-slate-400">
                Promoter Affiliate · WA: {affiliatePromoter.wa} · Rekening: {affiliatePromoter.rekening}
              </p>
            </div>
            <span className="text-xs bg-emerald-950 text-emerald-300 font-mono px-3 py-1 rounded-lg border border-emerald-800">
              Komisi: {affiliatePromoter.komisi_nilai * 100}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <div className="text-slate-400 font-sans">Min Payout Pendaftaran</div>
              <div className="text-lg font-bold text-white">Rp {affiliatePromoter.min_payout.toLocaleString('id-ID')}</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <div className="text-slate-400 font-sans">Total Saldo Komisi Promoter</div>
              <div className="text-lg font-bold text-emerald-400">Rp 35.000</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

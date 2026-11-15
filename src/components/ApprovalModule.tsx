import React, { useState } from 'react';
import { db } from '../services/db';
import { executeAPIMode } from '../services/apiEngine';
import { Role } from '../types/erp';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  HardDriveUpload,
  AlertTriangle
} from 'lucide-react';

interface ApprovalModuleProps {
  currentRole: Role;
}

export const ApprovalModule: React.FC<ApprovalModuleProps> = ({ currentRole }) => {
  const [activeTab, setActiveTab] = useState<'approval' | 'sync'>('approval');
  const [message, setMessage] = useState<string | null>(null);

  const pendingApprovals = db.approval.filter((a) => a.status === 'PENDING');

  const handleDecision = (approvalId: string, decision: 'APPROVED' | 'REJECTED') => {
    const res = executeAPIMode({
      mode: 'approve',
      request_id: `req-app-${Date.now()}`,
      payload: { approval_id: approvalId, decision }
    });

    if (res.ok) {
      setMessage(`Approval ${approvalId} berhasil di-set ke ${decision}!`);
    } else {
      setMessage(`Gagal memproses approval: ${res.error?.message}`);
    }
  };

  const handleTriggerSync = () => {
    const pendingTrx = db.transaksiPenjualan.filter((t) => t.sync_status === 'PENDING_SYNC');
    const bundles = pendingTrx.map((t) => ({ transaction_id: t.transaction_id, payload_hash: t.payload_hash }));

    const res = executeAPIMode({
      mode: 'sync',
      request_id: `req-sync-${Date.now()}`,
      payload: {
        sync_batch_id: `SYNC-PUSAT-${Date.now()}`,
        source_store_id: 'TKO1',
        bundles
      }
    });

    if (res.ok) {
      setMessage(`Sync Batch Orkestrator Berhasil! ${pendingTrx.length} Transaksi ter-ACK oleh Pusat.`);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('approval')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'approval' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Pusat Approval ({pendingApprovals.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('sync')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'sync' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sync &amp; Orkestrasi Pusat</span>
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          <span>{message}</span>
        </div>
      )}

      {/* APPROVAL TAB */}
      {activeTab === 'approval' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Antrean Persetujuan / Approval Pending</span>
            </h3>
            <span className="text-xs text-slate-400">
              Role Aktif: <strong className="text-white">{currentRole}</strong>
            </span>
          </div>

          <div className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Tidak ada permintaan approval pending saat ini. Semua transaksi berjalan lancar!
              </div>
            ) : (
              pendingApprovals.map((app) => (
                <div key={app.approval_id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-400 font-mono">[{app.tipe}]</span>
                      <span className="font-mono text-white font-bold">{app.approval_id}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        Ref: {app.referensi_id}
                      </span>
                    </div>
                    <div className="text-slate-300">
                      Alasan: <em>"{app.alasan}"</em> · Nominal: <strong className="text-indigo-300 font-mono">Rp {app.nominal.toLocaleString('id-ID')}</strong>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Diminta: {app.requested_at} · Expired: {app.expired_at}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDecision(app.approval_id, 'REJECTED')}
                      className="inline-flex items-center gap-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>
                    <button
                      onClick={() => handleDecision(app.approval_id, 'APPROVED')}
                      className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SYNC TAB */}
      {activeTab === 'sync' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              <span>Orkestrator Sync Toko &rarr; GAS Pusat (Idempotent ACK)</span>
            </h3>
            <button
              onClick={handleTriggerSync}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition"
            >
              <HardDriveUpload className="w-4 h-4" />
              <span>Jalankan Sync Batch Sekarang</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <div className="text-slate-400">PENDING_SYNC</div>
              <div className="text-xl font-bold text-amber-400">
                {db.transaksiPenjualan.filter((t) => t.sync_status === 'PENDING_SYNC').length} Transaksi
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <div className="text-slate-400">SYNCED (ACK Pusat)</div>
              <div className="text-xl font-bold text-emerald-400">
                {db.transaksiPenjualan.filter((t) => t.sync_status === 'SYNCED').length} Transaksi
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <div className="text-slate-400">FAILED / CONFLICT</div>
              <div className="text-xl font-bold text-rose-400">
                {db.transaksiPenjualan.filter((t) => t.sync_status === 'FAILED').length} Transaksi
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

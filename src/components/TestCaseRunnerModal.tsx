import React, { useState } from 'react';
import { runAllTestCases } from '../services/testRunner';
import { TestCaseResult } from '../types/erp';
import { CheckCircle2, XCircle, Play, X, ShieldCheck } from 'lucide-react';

interface TestCaseRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestCaseRunnerModal: React.FC<TestCaseRunnerModalProps> = ({ isOpen, onClose }) => {
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [hasRun, setHasRun] = useState(false);

  if (!isOpen) return null;

  const handleRunTests = () => {
    const res = runAllTestCases();
    setResults(res);
    setHasRun(true);
  };

  const passedCount = results.filter((r) => r.passed).length;
  const passRate = results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">Verifikasi Otomatis Blueprint TC-001 s/d TC-042</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Score Summary */}
        <div className="py-3 flex items-center justify-between gap-4 border-b border-slate-800">
          <div>
            <div className="text-xs text-slate-400">Target Go-Live Lulus &ge; 80% (Fase 1):</div>
            {hasRun ? (
              <div className="flex items-center gap-2 text-sm font-bold font-mono">
                <span className={passRate >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                  LULUS {passedCount} / {results.length} ({passRate}%)
                </span>
                {passRate >= 80 && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                    CODING-READY FROZEN VERIFIED
                  </span>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500">Klik tombol untuk menjalankan 42 Test Case.</div>
            )}
          </div>

          <button
            onClick={handleRunTests}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Jalankan Test Suite</span>
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
          {!hasRun ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Klik 'Jalankan Test Suite' untuk menguji aturan finansial, pajak, approval, sync, dan prioritas harga.
            </div>
          ) : (
            results.map((r) => (
              <div
                key={r.id}
                className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                  r.passed
                    ? 'bg-slate-950/80 border-slate-800 text-slate-200'
                    : 'bg-rose-950/60 border-rose-800 text-rose-200'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-indigo-400">{r.id}</span>
                    <span className="font-semibold text-white">{r.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Ekspektasi: <em>{r.expected}</em>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Detail Log: {r.details}
                  </div>
                </div>

                <div className="shrink-0">
                  {r.passed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> PASSED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-bold">
                      <XCircle className="w-3 h-3 text-rose-400" /> FAILED
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

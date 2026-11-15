import React from 'react';
import { db } from '../services/db';
import { Printer, Download, X, QrCode, FileText } from 'lucide-react';

interface ReceiptModalProps {
  trxId: string | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ trxId, onClose }) => {
  if (!trxId) return null;

  const trx = db.transaksiPenjualan.find((t) => t.transaction_id === trxId);
  const details = db.transaksiDetail.filter((d) => d.transaction_id === trxId);
  const toko = db.masterToko.find((t) => t.toko_id === trx?.toko_id);

  const handlePrintThermal = () => {
    window.open(`/api/print/receipt/${trxId}`, '_blank');
  };

  const handleDownloadDokumen = (tipe: string) => {
    window.open(`/api/dokumen/pdf/${tipe}/${trxId}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold">Struk POS &amp; Cetak Dokumen</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Preview */}
        <div className="flex-1 overflow-y-auto my-3 bg-white text-black font-mono text-xs p-4 rounded-xl shadow-inner space-y-2 select-text">
          <div className="text-center font-bold text-sm">{toko?.nama || 'TOKO BAJU UMKM'}</div>
          <div className="text-center text-[10px]">{toko?.alamat || 'Grand Indonesia Lt. 2'}</div>
          <div className="border-b border-dashed border-black my-2"></div>
          <div>ID: {trxId}</div>
          <div>Tgl: {trx?.tanggal || new Date().toLocaleDateString('id-ID')}</div>
          <div>Kasir: {trx?.kasir_id}</div>
          <div className="border-b border-dashed border-black my-2"></div>

          {details.map((d, i) => {
            const varian = db.masterVarian.find((v) => v.sku === d.sku);
            const barang = db.masterBarang.find((b) => b.barang_id === varian?.barang_id);
            return (
              <div key={i} className="space-y-0.5">
                <div className="font-bold truncate">{barang?.nama_manusia || d.sku}</div>
                <div className="flex justify-between text-[11px]">
                  <span>{d.qty} x Rp {d.harga_jual_satuan.toLocaleString('id-ID')}</span>
                  <span>Rp {(d.qty * d.harga_jual_satuan).toLocaleString('id-ID')}</span>
                </div>
              </div>
            );
          })}

          <div className="border-b border-dashed border-black my-2"></div>
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Rp {(trx?.subtotal_barang || 0).toLocaleString('id-ID')}</span>
          </div>
          {trx?.diskon_amount ? (
            <div className="flex justify-between">
              <span>Diskon:</span>
              <span>-Rp {trx.diskon_amount.toLocaleString('id-ID')}</span>
            </div>
          ) : null}
          {trx?.pajak_amount ? (
            <div className="flex justify-between">
              <span>Pajak 1 (11%):</span>
              <span>Rp {trx.pajak_amount.toLocaleString('id-ID')}</span>
            </div>
          ) : null}
          {trx?.delivery_amount ? (
            <div className="flex justify-between">
              <span>Delivery:</span>
              <span>Rp {trx.delivery_amount.toLocaleString('id-ID')}</span>
            </div>
          ) : null}
          {trx?.packaging_amount ? (
            <div className="flex justify-between">
              <span>Packaging:</span>
              <span>Rp {trx.packaging_amount.toLocaleString('id-ID')}</span>
            </div>
          ) : null}
          <div className="border-b border-dashed border-black my-2"></div>
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL:</span>
            <span>Rp {(trx?.total || 0).toLocaleString('id-ID')}</span>
          </div>
          <div className="border-b border-dashed border-black my-2"></div>

          <div className="text-center text-[10px] text-gray-600 pt-2">
            Terima Kasih Atas Kunjungan Anda!<br />
            Simpan Struk Ini Sebagai Bukti Pembayaran Resmi.
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <button
            onClick={handlePrintThermal}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk Thermal 58mm / 80mm</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDownloadDokumen('invoice')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cetak Invoice</span>
            </button>
            <button
              onClick={() => handleDownloadDokumen('surat_jalan')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Surat Jalan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

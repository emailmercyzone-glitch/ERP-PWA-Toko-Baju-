import React, { useEffect, useRef, useState } from 'react';
import bwipjs from 'bwip-js';
import { db } from '../services/db';
import { MasterVarian } from '../types/erp';
import { Printer, Tag, X, Plus, Minus, Check, LayoutGrid, FileText } from 'lucide-react';

interface SelectedLabelItem {
  sku: string;
  copyCount: number;
}

interface BarcodeLabelPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSku?: string;
  currentStoreId: string;
}

export const BarcodeLabelPrinterModal: React.FC<BarcodeLabelPrinterModalProps> = ({
  isOpen,
  onClose,
  initialSku,
  currentStoreId,
}) => {
  const [selectedItems, setSelectedItems] = useState<SelectedLabelItem[]>([]);
  const [labelFormat, setLabelFormat] = useState<'THERMAL' | 'A4_GRID'>('THERMAL');
  const [showShopName, setShowShopName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);

  // Initialize initial SKU if provided
  useEffect(() => {
    if (isOpen) {
      if (initialSku) {
        setSelectedItems([{ sku: initialSku, copyCount: 5 }]);
      } else if (selectedItems.length === 0 && db.masterVarian.length > 0) {
        setSelectedItems([{ sku: db.masterVarian[0].sku, copyCount: 5 }]);
      }
    }
  }, [isOpen, initialSku]);

  if (!isOpen) return null;

  const store = db.masterToko.find((s) => s.toko_id === currentStoreId) || db.masterToko[1];
  const classId = store.class_id || 'A';

  const addItemToLabels = (sku: string) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.sku === sku);
      if (existing) {
        return prev.map((item) => (item.sku === sku ? { ...item, copyCount: item.copyCount + 5 } : item));
      }
      return [...prev, { sku, copyCount: 5 }];
    });
  };

  const updateItemCopyCount = (sku: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          if (item.sku === sku) {
            const newCount = item.copyCount + delta;
            return newCount > 0 ? { ...item, copyCount: newCount } : null;
          }
          return item;
        })
        .filter(Boolean) as SelectedLabelItem[]
    );
  };

  const removeItem = (sku: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.sku !== sku));
  };

  const handlePrintTrigger = () => {
    window.print();
  };

  // Flatten items according to copyCount
  const flattenedLabels: { varian: MasterVarian; copyIndex: number }[] = [];
  selectedItems.forEach((item) => {
    const v = db.masterVarian.find((m) => m.sku === item.sku);
    if (v) {
      for (let i = 0; i < item.copyCount; i++) {
        flattenedLabels.push({ varian: v, copyIndex: i + 1 });
      }
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      {/* PRINT-ONLY STYLESHEET */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #barcode-print-area, #barcode-print-area * {
            visibility: visible;
          }
          #barcode-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 0;
            margin: 0;
          }
          .print-hidden {
            display: none !important;
          }
          .label-thermal-page {
            page-break-after: always;
            width: 50mm;
            height: 30mm;
            padding: 2mm;
            box-sizing: border-box;
            display: flex;
            flex-col;
            align-items: center;
            justify-content: center;
          }
          .label-grid-page {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4mm;
            padding: 10mm;
          }
        }
      `}</style>

      <div className="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 print-hidden">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold">Generator &amp; Cetak Label Barcode Code128</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 overflow-y-auto pr-1">
          {/* Left Column: Selector & Settings (5 Cols) */}
          <div className="md:col-span-5 space-y-4 print-hidden">
            {/* Format Selector */}
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Format Printer
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLabelFormat('THERMAL')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-bold transition ${
                    labelFormat === 'THERMAL'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Stiker Thermal 50x30mm</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLabelFormat('A4_GRID')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-bold transition ${
                    labelFormat === 'A4_GRID'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Lembar A4 Grid</span>
                </button>
              </div>
            </div>

            {/* Display Toggles */}
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2 text-xs">
              <label className="text-slate-400 block font-semibold uppercase tracking-wider text-[11px]">
                Opsi Tampilan Stiker
              </label>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Tampilkan Nama Toko</span>
                <input
                  type="checkbox"
                  checked={showShopName}
                  onChange={(e) => setShowShopName(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Tampilkan Harga Tag</span>
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                />
              </div>
            </div>

            {/* Selected Items & Copy Count */}
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                <span>Daftar SKU Dicetak</span>
                <span className="font-mono text-indigo-400">{flattenedLabels.length} Stiker Total</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedItems.map((item) => {
                  const v = db.masterVarian.find((m) => m.sku === item.sku);
                  const barang = db.masterBarang.find((b) => b.barang_id === v?.barang_id);

                  return (
                    <div key={item.sku} className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-200 truncate">{barang?.nama_manusia}</div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">{item.sku}</div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => updateItemCopyCount(item.sku, -1)}
                          className="w-5 h-5 bg-slate-800 text-slate-200 rounded flex items-center justify-center hover:bg-slate-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-white text-xs">
                          {item.copyCount}
                        </span>
                        <button
                          onClick={() => updateItemCopyCount(item.sku, 1)}
                          className="w-5 h-5 bg-slate-800 text-slate-200 rounded flex items-center justify-center hover:bg-slate-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.sku)}
                          className="w-5 h-5 bg-rose-950 text-rose-300 rounded flex items-center justify-center hover:bg-rose-900 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add More SKU Dropdown */}
              <div className="pt-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addItemToLabels(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="">+ Tambah SKU Baju Lain...</option>
                  {db.masterVarian.map((v) => (
                    <option key={v.sku} value={v.sku}>
                      {v.sku}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Live Label Sheet Preview (7 Cols) */}
          <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400 print-hidden">
              <span>Preview Stiker Label Physique</span>
              <span className="text-[11px] text-indigo-400">Barcode Code128 Scannable</span>
            </div>

            {/* PRINT AREA CONTAINER */}
            <div
              id="barcode-print-area"
              className={`flex-1 overflow-y-auto bg-slate-900/60 p-4 rounded-xl border border-slate-800 ${
                labelFormat === 'A4_GRID' ? 'grid grid-cols-2 sm:grid-cols-3 gap-3' : 'space-y-3 flex flex-col items-center'
              }`}
            >
              {flattenedLabels.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500 text-xs print-hidden">
                  Pilih SKU untuk menampilkan preview label stiker barcode.
                </div>
              ) : (
                flattenedLabels.map(({ varian, copyIndex }, idx) => (
                  <BarcodeTagCard
                    key={`${varian.sku}-${copyIndex}-${idx}`}
                    varian={varian}
                    storeName={store.nama}
                    classId={classId}
                    currentStoreId={currentStoreId}
                    showShopName={showShopName}
                    showPrice={showPrice}
                    format={labelFormat}
                  />
                ))
              )}
            </div>

            {/* Print Trigger Button */}
            <button
              onClick={handlePrintTrigger}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-xs shrink-0 print-hidden"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak {flattenedLabels.length} Stiker Barcode Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual Barcode Tag Card Component
interface BarcodeTagCardProps {
  varian: MasterVarian;
  storeName: string;
  classId: string;
  currentStoreId: string;
  showShopName: boolean;
  showPrice: boolean;
  format: 'THERMAL' | 'A4_GRID';
}

const BarcodeTagCard: React.FC<BarcodeTagCardProps> = ({
  varian,
  storeName,
  classId,
  currentStoreId,
  showShopName,
  showPrice,
  format
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const barang = db.masterBarang.find((b) => b.barang_id === varian.barang_id);
  const { price, warning } = db.getHargaForSKU(varian.sku, currentStoreId, classId, 'NORMAL');

  const warna = db.masterWarna.find((w) => w.warna_id === varian.warna_id);
  const ukuran = db.masterUkuran.find((u) => u.ukuran_id === varian.ukuran_id);

  useEffect(() => {
    if (canvasRef.current) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'code128',
          text: varian.barcode_code128 || varian.sku,
          scale: 2,
          height: 10,
          includetext: true,
          textxalign: 'center',
          textsize: 8,
          textcolor: '000000',
          barcolor: '000000',
          backgroundcolor: 'ffffff'
        });
      } catch (e) {
        console.error('Error rendering bwip-js barcode:', e);
      }
    }
  }, [varian.sku]);

  return (
    <div className="bg-white text-black p-2.5 rounded-lg border border-slate-300 w-full max-w-[220px] shadow-sm flex flex-col items-center justify-between text-center select-text font-sans">
      {/* Header Shop Name */}
      {showShopName && (
        <div className="text-[10px] font-black uppercase tracking-wider text-gray-800 border-b border-gray-200 w-full pb-0.5 mb-1 truncate">
          {storeName}
        </div>
      )}

      {/* Product Title */}
      <div className="text-[11px] font-extrabold text-gray-900 leading-tight line-clamp-1 w-full">
        {barang?.nama_manusia || 'Baju Fashion'}
      </div>

      {/* Size & Color Specs */}
      <div className="text-[9px] font-semibold text-gray-600 my-0.5">
        <span>Warna: {warna?.nama || 'STD'}</span> · <span>Size: {ukuran?.nama || 'STD'}</span>
      </div>

      {/* Barcode Canvas */}
      <div className="my-1 flex items-center justify-center w-full overflow-hidden">
        <canvas ref={canvasRef} className="max-w-full h-auto"></canvas>
      </div>

      {/* Price tag */}
      {showPrice && (
        <div className="text-xs font-black text-slate-900 font-mono pt-0.5 border-t border-gray-200 w-full">
          Rp {price.toLocaleString('id-ID')}
        </div>
      )}
    </div>
  );
};

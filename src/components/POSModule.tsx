import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { executeAPIMode } from '../services/apiEngine';
import { Role, PriceType, SalesChannel, PaymentMethod, JualItemPayload, JualResponseData, JualRequestPayload } from '../types/erp';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';
import { BarcodeLabelPrinterModal } from './BarcodeLabelPrinterModal';
import { queueOfflineSale, syncOfflineSalesQueue, getPendingOfflineSales } from '../services/offlineQueue';
import {
  ShoppingCart,
  QrCode,
  Tag,
  Truck,
  Package,
  Percent,
  User,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Search,
  Scan,
  Camera,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';

interface POSModuleProps {
  currentStoreId: string;
  currentRole: Role;
  onOpenReceipt: (trxId: string) => void;
}

export const POSModule: React.FC<POSModuleProps> = ({ currentStoreId, currentRole, onOpenReceipt }) => {
  const store = db.masterToko.find((s) => s.toko_id === currentStoreId) || db.masterToko[1];
  const classId = store.class_id || 'A';

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('ALL');
  const [priceType, setPriceType] = useState<PriceType>('NORMAL');
  const [salesChannel, setSalesChannel] = useState<SalesChannel>('TOKO');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Cart State
  const [cart, setCart] = useState<{ sku: string; qty: number; spg_id?: string }[]>([]);
  const [diskonAmount, setDiskonAmount] = useState<number>(0);
  const [diskonApprovalId, setDiskonApprovalId] = useState<string>('');
  const [deliveryAmount, setDeliveryAmount] = useState<number>(0);
  const [packagingAmount, setPackagingAmount] = useState<number>(0);
  const [pajakToggle, setPajakToggle] = useState<boolean>(true);

  // Payment State
  const [paymentMethod1, setPaymentMethod1] = useState<PaymentMethod>('TUNAI');
  const [paymentNominal1, setPaymentNominal1] = useState<number>(0);
  const [isSplitPayment, setIsSplitPayment] = useState<boolean>(false);
  const [paymentMethod2, setPaymentMethod2] = useState<PaymentMethod>('QRIS');
  const [paymentNominal2, setPaymentNominal2] = useState<number>(0);

  // Status & Response State
  const [lastResponse, setLastResponse] = useState<JualResponseData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingApprovalId, setPendingApprovalId] = useState('');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isLabelPrinterOpen, setIsLabelPrinterOpen] = useState(false);
  const [selectedLabelSku, setSelectedLabelSku] = useState<string | undefined>();

  // Offline IndexedDB Queue State
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const [simulateOffline, setSimulateOffline] = useState<boolean>(false);

  const refreshOfflineCount = async () => {
    try {
      const items = await getPendingOfflineSales();
      setOfflineQueueCount(items.length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshOfflineCount();

    const handleOnlineEvent = async () => {
      setIsSyncingOffline(true);
      try {
        const syncRes = await syncOfflineSalesQueue();
        if (syncRes.successCount > 0) {
          setOfflineNotice(`Otomatis tersinkronisasi ${syncRes.successCount} transaksi offline ke server!`);
        }
      } catch (err: any) {
        console.error('Offline auto-sync failed', err);
      } finally {
        setIsSyncingOffline(false);
        refreshOfflineCount();
      }
    };

    window.addEventListener('online', handleOnlineEvent);
    return () => window.removeEventListener('online', handleOnlineEvent);
  }, []);

  const handleManualSyncOffline = async () => {
    setIsSyncingOffline(true);
    try {
      const syncRes = await syncOfflineSalesQueue();
      if (syncRes.successCount > 0) {
        setOfflineNotice(`Sukses: ${syncRes.successCount} transaksi offline tersinkronisasi ke server.`);
      } else if (syncRes.failedCount > 0) {
        setOfflineNotice(`Sinkronisasi selesai: ${syncRes.failedCount} gagal.`);
      } else {
        setOfflineNotice('Semua data sudah sinkron (antrean kosong).');
      }
    } catch (err: any) {
      setOfflineNotice(`Gagal sinkronisasi: ${err?.message || 'Error koneksi'}`);
    } finally {
      setIsSyncingOffline(false);
      refreshOfflineCount();
    }
  };

  // Filter Products
  const varianList = db.masterVarian.filter((v) => v.aktif);
  const filteredVarians = varianList.filter((v) => {
    const barang = db.masterBarang.find((b) => b.barang_id === v.barang_id);
    const matchSearch =
      v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (barang?.nama_manusia || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchKat = selectedKategori === 'ALL' || barang?.kategori_id === selectedKategori;
    return matchSearch && matchKat;
  });

  // Add item to cart
  const addToCart = (sku: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.sku === sku);
      if (existing) {
        return prev.map((item) => (item.sku === sku ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { sku, qty: 1 }];
    });
  };

  const updateCartQty = (sku: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.sku === sku) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as typeof cart
    );
  };

  const removeFromCart = (sku: string) => {
    setCart((prev) => prev.filter((item) => item.sku !== sku));
  };

  // Cart calculations
  const calculateCartSubtotal = () => {
    return cart.reduce((acc, item) => {
      const { price } = db.getHargaForSKU(item.sku, currentStoreId, classId, priceType);
      return acc + item.qty * price;
    }, 0);
  };

  const rawSubtotal = calculateCartSubtotal();
  const taxCalc = db.calculateTaxAndTotals(
    rawSubtotal,
    diskonAmount,
    classId,
    pajakToggle,
    deliveryAmount,
    packagingAmount
  );

  // Scan SKU Simulation
  const handleBarcodeScanSim = (skuCode: string) => {
    addToCart(skuCode);
  };

  // Submit POS Order
  const handleCheckoutSubmit = async () => {
    setErrorMsg('');
    setLastResponse(null);
    setOfflineNotice(null);

    if (cart.length === 0) {
      setErrorMsg('Keranjang belanja kosong.');
      return;
    }

    // Role limit check for discounts (Kasir limit 5%)
    const diskonPct = rawSubtotal > 0 ? diskonAmount / rawSubtotal : 0;
    if (diskonPct > 0.05 && currentRole === 'KASIR' && !diskonApprovalId) {
      // Trigger discount approval request
      const appRes = executeAPIMode({
        mode: 'diskon',
        request_id: `req-disc-${Date.now()}`,
        payload: { diskon_amount: diskonAmount, subtotal_barang: rawSubtotal, role: 'KASIR' }
      });

      if (appRes.data && (appRes.data as any).approval_id) {
        setPendingApprovalId((appRes.data as any).approval_id);
        setShowApprovalModal(true);
        return;
      }
    }

    // Build Payment Array
    const totalPay1 = isSplitPayment ? paymentNominal1 : (paymentNominal1 || taxCalc.total);
    const metodeBayarArr = [{ metode: paymentMethod1, nominal: totalPay1 }];
    if (isSplitPayment && paymentNominal2 > 0) {
      metodeBayarArr.push({ metode: paymentMethod2, nominal: paymentNominal2 });
    }

    const payload: JualItemPayload[] = cart.map((c) => ({
      sku: c.sku,
      qty: c.qty,
      harga_jual_satuan: db.getHargaForSKU(c.sku, currentStoreId, classId, priceType).price,
      spg_id: c.spg_id
    }));

    const isOffline = !navigator.onLine || simulateOffline;

    const requestPayload: JualRequestPayload = {
      transaction_id: `TRX-${currentStoreId}-${Date.now()}`,
      toko_id: currentStoreId,
      kasir_id: currentRole === 'KASIR' ? 'KRY-KAS-1' : 'KRY-OWNER',
      customer_id: selectedCustomerId || undefined,
      price_type: priceType,
      sales_channel: salesChannel,
      items: payload,
      diskon_amount: diskonAmount,
      diskon_approval_id: diskonApprovalId || undefined,
      delivery_amount: deliveryAmount,
      packaging_amount: packagingAmount,
      pajak_toggle: pajakToggle,
      pajak_rate: taxCalc.pajakRate,
      price_includes_tax: taxCalc.priceIncludesTax,
      metode_bayar: metodeBayarArr
    };

    // If offline or forced offline mode, queue to IndexedDB directly
    if (isOffline) {
      const offlineId = await queueOfflineSale(requestPayload);
      await refreshOfflineCount();

      setLastResponse({
        transaction_id: offlineId,
        nomor_manusia: `OFF-${offlineId.slice(-6)}`,
        subtotal_barang: rawSubtotal,
        diskon_amount: diskonAmount,
        diskon_approval_id: null,
        subtotal_kena_pajak: taxCalc.subtotalKenaPajak,
        pajak_amount: taxCalc.pajakAmount,
        delivery_amount: deliveryAmount,
        packaging_amount: packagingAmount,
        total: taxCalc.total,
        kembalian: Math.max(0, totalPay1 - taxCalc.total),
        struk_url: `/api/print/receipt/${offlineId}`,
        sync_status: 'PENDING_SYNC',
        payment_status: 'PAID',
        warning: [{ code: 'PROMO_EXPIRED', message: 'Transaksi tersimpan di antrean offline IndexedDB' }]
      });

      setOfflineNotice(`Transaksi ${offlineId} tersimpan aman di IndexedDB Browser (Offline Mode). Siap disinkronkan ke server saat online.`);
      setCart([]);
      setDiskonAmount(0);
      setDiskonApprovalId('');
      setDeliveryAmount(0);
      setPackagingAmount(0);
      return;
    }

    const res = executeAPIMode({
      mode: 'jual',
      request_id: `req-jual-${Date.now()}`,
      payload: requestPayload
    });

    if (res.ok && res.data) {
      const data = res.data as JualResponseData;
      setLastResponse(data);
      setCart([]); // Clear cart
      setDiskonAmount(0);
      setDiskonApprovalId('');
      setDeliveryAmount(0);
      setPackagingAmount(0);
    } else {
      setErrorMsg(res.error?.message || 'Gagal memproses transaksi POS.');
    }
  };

  const handleApproveDiscountByManager = () => {
    // Simulate Manager / Owner approval
    executeAPIMode({
      mode: 'approve',
      request_id: `req-app-disc-${Date.now()}`,
      payload: { approval_id: pendingApprovalId, decision: 'APPROVED' }
    });
    setDiskonApprovalId(pendingApprovalId);
    setShowApprovalModal(false);
    setPendingApprovalId('');
  };

  const selectedCustomer = db.masterPelangganMember.find((c) => c.customer_id === selectedCustomerId);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Product Catalog & Search (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Offline IndexedDB Status Alert */}
        {(offlineQueueCount > 0 || simulateOffline || offlineNotice) && (
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              {simulateOffline ? <WifiOff className="w-4 h-4 text-amber-400 shrink-0" /> : <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />}
              <div>
                <span className="font-semibold">
                  {simulateOffline ? 'Mode Simulasi Offline: ' : 'Status Sinkronisasi: '}
                </span>
                <span>
                  {offlineNotice || `${offlineQueueCount} transaksi tersimpan di antrean IndexedDB lokal browser.`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleManualSyncOffline}
                disabled={isSyncingOffline || offlineQueueCount === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-medium transition shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOffline ? 'animate-spin' : ''}`} />
                <span>{isSyncingOffline ? 'Sinkronisasi...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Filter Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Baju, Style, SKU, atau Scan Barcode..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Barcode Scanner Actions */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {/* Simulate Offline Toggle */}
              <button
                onClick={() => setSimulateOffline(!simulateOffline)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition shrink-0 ${
                  simulateOffline
                    ? 'bg-amber-600/30 text-amber-300 border-amber-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title="Simulasikan Kasir Offline (Tanpa Internet / Basement Mall)"
              >
                {simulateOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                <span>{simulateOffline ? 'Offline' : 'Online'}</span>
                {offlineQueueCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                    {offlineQueueCount}
                  </span>
                )}
              </button>

              {/* Camera Scanner Button */}
              <button
                onClick={() => setIsCameraScannerOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl shadow-md transition shrink-0"
                title="Buka Kamera untuk Scan Barcode SKU"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan Kamera Barcode</span>
              </button>

              {/* Cetak Label Price Tag Button */}
              <button
                onClick={() => {
                  setSelectedLabelSku(undefined);
                  setIsLabelPrinterOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl shadow-md transition shrink-0"
                title="Cetak Label Barcode / Price Tag Baju"
              >
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cetak Label Stiker</span>
              </button>

              {varianList.slice(0, 2).map((v) => (
                <button
                  key={v.sku}
                  onClick={() => handleBarcodeScanSim(v.sku)}
                  className="hidden md:inline-flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1 rounded-lg shrink-0"
                  title="Simulasi Scan Barcode Code128"
                >
                  <Scan className="w-3 h-3 text-indigo-400" />
                  <span>{v.sku.split('-')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-800">
            <button
              onClick={() => setSelectedKategori('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
                selectedKategori === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua Kategori
            </button>
            {db.masterKategori.map((k) => (
              <button
                key={k.kategori_id}
                onClick={() => setSelectedKategori(k.kategori_id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition shrink-0 ${
                  selectedKategori === k.kategori_id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {k.nama}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredVarians.map((v) => {
            const barang = db.masterBarang.find((b) => b.barang_id === v.barang_id);
            const { price, warning } = db.getHargaForSKU(v.sku, currentStoreId, classId, priceType);
            const stokRec = db.stokPerToko.find((s) => s.toko_id === currentStoreId && s.sku === v.sku);
            const qtyStok = stokRec?.stok_sistem || 0;
            const inCart = cart.find((c) => c.sku === v.sku);

            return (
              <div
                key={v.sku}
                onClick={() => addToCart(v.sku)}
                className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-600 rounded-2xl p-3 flex flex-col justify-between transition cursor-pointer shadow-sm hover:shadow-indigo-900/20"
              >
                <div>
                  <div className="aspect-4/3 w-full rounded-xl bg-slate-950 overflow-hidden mb-2 relative">
                    <img
                      src={barang?.foto_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500'}
                      alt={barang?.nama_manusia}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {/* Jenis Badge (Unboxed text metadata) */}
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-slate-900/90 text-slate-200 px-2 py-0.5 rounded border border-slate-700">
                      {v.jenis_barang}
                    </span>
                    {/* Cart Counter Badge */}
                    {inCart && (
                      <span className="absolute top-2 right-2 text-xs font-black bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                        {inCart.qty}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 mb-1">
                    {barang?.nama_manusia}
                  </h4>
                  <div className="text-[10px] font-mono text-slate-400 mb-2 truncate">
                    SKU: {v.sku}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="text-xs font-bold font-mono text-indigo-300">
                    Rp {price.toLocaleString('id-ID')}
                  </div>
                  <span className={`text-[10px] font-semibold ${qtyStok > 5 ? 'text-slate-400' : 'text-amber-400'}`}>
                    Stok: {v.jenis_barang === 'AFF' ? 'Direct' : qtyStok}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Shopping Cart & Checkout Panel (5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Keranjang POS Kasir</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {cart.length} Jenis Item
            </span>
          </div>

          {/* Customer & Price Type Selectors */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Price Type */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1">Tipe Harga</label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as PriceType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 font-medium focus:outline-none"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="RESELLER">RESELLER</option>
                <option value="PROMO">PROMO</option>
              </select>
            </div>

            {/* Member Customer */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1">Pelanggan Member</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 font-medium focus:outline-none"
              >
                <option value="">-- Umum / Tanpa Member --</option>
                {db.masterPelangganMember.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.nama} ({c.tier})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Member Stempel Loyalty Status */}
          {selectedCustomer && (
            <div className="bg-indigo-950/60 border border-indigo-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs text-indigo-200">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Tier: <strong>{selectedCustomer.tier}</strong></span>
              </div>
              <span className="font-mono bg-indigo-900 px-2 py-0.5 rounded text-[11px]">
                Stempel: {selectedCustomer.stempel_count} / 5
              </span>
            </div>
          )}

          {/* Cart Item List */}
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Keranjang masih kosong. Pilih baju di katalog.
              </div>
            ) : (
              cart.map((item) => {
                const varian = db.masterVarian.find((v) => v.sku === item.sku);
                const barang = db.masterBarang.find((b) => b.barang_id === varian?.barang_id);
                const { price } = db.getHargaForSKU(item.sku, currentStoreId, classId, priceType);

                return (
                  <div key={item.sku} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">
                        {barang?.nama_manusia}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Rp {price.toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateCartQty(item.sku, -1)}
                        className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs text-white">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.sku, 1)}
                        className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.sku)}
                        className="w-6 h-6 rounded-md bg-rose-950 hover:bg-rose-900 text-rose-300 flex items-center justify-center ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Mode Cepat Delivery & Packaging Inputs */}
          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                <Truck className="w-3 h-3" /> Delivery Ongkir
              </label>
              <input
                type="number"
                value={deliveryAmount || ''}
                onChange={(e) => setDeliveryAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                <Package className="w-3 h-3" /> Packaging Fee
              </label>
              <input
                type="number"
                value={packagingAmount || ''}
                onChange={(e) => setPackagingAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Tax & Discount Options */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-2">
              <label className="text-slate-400 flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pajakToggle}
                  onChange={(e) => setPajakToggle(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                />
                Pajak 1 (11%)
              </label>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Diskon:</span>
              <input
                type="number"
                value={diskonAmount || ''}
                onChange={(e) => setDiskonAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-24 bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs text-right text-white font-mono"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Metode Pembayaran</span>
              <label className="text-[11px] text-indigo-400 flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSplitPayment}
                  onChange={(e) => setIsSplitPayment(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                />
                Split Payment (Maks 2)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={paymentMethod1}
                onChange={(e) => setPaymentMethod1(e.target.value as PaymentMethod)}
                className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200"
              >
                <option value="TUNAI">TUNAI</option>
                <option value="QRIS">QRIS</option>
                <option value="TRANSFER">TRANSFER</option>
                <option value="DP">DP PIUTANG</option>
              </select>
              <input
                type="number"
                value={paymentNominal1 || ''}
                onChange={(e) => setPaymentNominal1(Number(e.target.value))}
                placeholder={`Nominal (Full: Rp ${taxCalc.total.toLocaleString('id-ID')})`}
                className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 font-mono text-right"
              />
            </div>

            {isSplitPayment && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                <select
                  value={paymentMethod2}
                  onChange={(e) => setPaymentMethod2(e.target.value as PaymentMethod)}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200"
                >
                  <option value="QRIS">QRIS</option>
                  <option value="TRANSFER">TRANSFER</option>
                  <option value="TUNAI">TUNAI</option>
                </select>
                <input
                  type="number"
                  value={paymentNominal2 || ''}
                  onChange={(e) => setPaymentNominal2(Number(e.target.value))}
                  placeholder="Nominal Split 2"
                  className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 font-mono text-right"
                />
              </div>
            )}
          </div>

          {/* Subtotal & Total Summary Breakdown */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal Barang:</span>
              <span>Rp {rawSubtotal.toLocaleString('id-ID')}</span>
            </div>
            {diskonAmount > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>Diskon:</span>
                <span>-Rp {diskonAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            {taxCalc.pajakAmount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Pajak 1 ({taxCalc.pajakRate * 100}%):</span>
                <span>Rp {taxCalc.pajakAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            {deliveryAmount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Delivery Ongkir:</span>
                <span>Rp {deliveryAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            {packagingAmount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Packaging:</span>
                <span>Rp {packagingAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
              <span>TOTAL:</span>
              <span className="text-indigo-400">Rp {taxCalc.total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Submit Checkout Button */}
          {errorMsg && (
            <div className="text-xs text-rose-400 bg-rose-950/60 border border-rose-800 p-2 rounded-lg flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={handleCheckoutSubmit}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
          >
            <QrCode className="w-4 h-4" />
            <span>Bayar & Cetak Struk POS</span>
          </button>

          {/* Last Response Banner */}
          {lastResponse && (
            <div className="bg-emerald-950/80 border border-emerald-800 rounded-xl p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Transaksi Sukses!
                </span>
                <span className="font-mono">{lastResponse.transaction_id}</span>
              </div>

              {/* Warning List Verification (TC-031 / TC-042) */}
              {lastResponse.warning && lastResponse.warning.length > 0 && (
                <div className="bg-amber-950/60 border border-amber-800 p-2 rounded text-[11px] text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" /> Warning System (22 Modes):
                  </div>
                  {lastResponse.warning.map((w, idx) => (
                    <div key={idx}>· [{w.code}] {w.message}</div>
                  ))}
                </div>
              )}

              <button
                onClick={() => onOpenReceipt(lastResponse.transaction_id)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Lihat / Cetak Struk Thermal</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Discount Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Butuh Approval Diskon &gt; 5%</span>
            </div>
            <p className="text-xs text-slate-300">
              Kasir meminta diskon <strong>Rp {diskonAmount.toLocaleString('id-ID')}</strong> ({Math.round((diskonAmount/rawSubtotal)*100)}%).
              Melebihi batas wewenang role Kasir (5%). Membutuhkan persetujuan Manager / Owner.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300"
              >
                Batal
              </button>
              <button
                onClick={handleApproveDiscountByManager}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Approve (Manager/Owner)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSKU={(scannedSku) => {
          addToCart(scannedSku);
        }}
      />

      {/* Barcode Label Printer Modal */}
      <BarcodeLabelPrinterModal
        isOpen={isLabelPrinterOpen}
        onClose={() => setIsLabelPrinterOpen(false)}
        initialSku={selectedLabelSku}
        currentStoreId={currentStoreId}
      />
    </div>
  );
};

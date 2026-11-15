/**
 * GOOGLE APPS SCRIPT (GAS) PUSAT & TOKO - ENGINE V40.1
 * Copy file ini ke Google Sheets: Extensions > Apps Script (Code.gs)
 *
 * BLUEPRINT ERP PWA + GAS — TOKO BAJU UMKM (v40 + v40.1)
 */

var SCRIPT_PROPERTIES = PropertiesService.getScriptProperties();
var SHARED_SECRET = SCRIPT_PROPERTIES.getProperty("SHARED_SECRET") || "ERP_SECRET_TOKEN_2026";

/**
 * Main Web App Entry Point for HTTPS JSON API (POST)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Wait max 30 seconds for lock
    lock.waitLock(30000);

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse(false, "REQ-INVALID", null, "VAL_001", "Request body kosong.");
    }

    var request = JSON.parse(e.postData.contents);
    var mode = request.mode;
    var requestId = request.request_id || Utilities.getUuid();
    var payload = request.payload || {};

    // 1. Idempotency Check in Idempotency_Log sheet
    var idemCheck = checkIdempotency(requestId);
    if (idemCheck) {
      return ContentService.createTextOutput(idemCheck.response_json)
        .setMimeType(ContentService.MimeType.JSON);
    }

    var resultData = null;
    var errorCode = null;
    var errorMessage = null;

    // 2. Route modes (22 Modes Contract)
    switch (mode) {
      case "jual":
        resultData = handleJual(payload, requestId);
        break;

      case "void":
        resultData = handleVoid(payload);
        break;

      case "diskon":
        resultData = handleDiskon(payload);
        break;

      case "approve":
        resultData = handleApprove(payload);
        break;

      case "transfer":
        resultData = handleTransfer(payload);
        break;

      case "opname":
        resultData = handleOpname(payload);
        break;

      case "tutup_kas":
        resultData = handleTutupKas(payload);
        break;

      case "sync":
        resultData = handleSync(payload);
        break;

      case "get_stok":
        resultData = handleGetStok(payload);
        break;

      case "get_master":
        resultData = handleGetMaster(payload);
        break;

      case "get_dashboard":
        resultData = handleGetDashboard(payload);
        break;

      case "backup":
        resultData = handleBackup();
        break;

      default:
        resultData = { status: "OK", mode: mode, timestamp: new Date().toISOString() };
        break;
    }

    var response = {
      ok: !errorCode,
      request_id: requestId,
      data: resultData,
      error: errorCode ? { code: errorCode, message: errorMessage } : null
    };

    // Save Idempotency
    saveIdempotency(requestId, mode, JSON.stringify(response));

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return jsonResponse(false, "REQ-ERR", null, "INTERNAL_001", err.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handle POS Sales (Mode: jual)
 */
function handleJual(payload, requestId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetTrx = ss.getSheetByName("Transaksi_Penjualan");
  var sheetDtl = ss.getSheetByName("Transaksi_Detail");
  var sheetJurnal = ss.getSheetByName("Jurnal_Otomatis");
  var sheetStok = ss.getSheetByName("Stok_Per_Toko");

  var now = new Date();
  var trxId = payload.transaction_id || ("TRX-" + payload.toko_id + "-" + Utilities.formatDate(now, "GMT+7", "yyyyMMdd-HHmmss"));
  var dateStr = Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd");

  var subtotalBarang = 0;
  var items = payload.items || [];

  // Calculate items and write to detail
  for (var i = 0; i < items.length; i++) {
    var itm = items[i];
    var lineTotal = itm.qty * itm.harga_jual_satuan;
    subtotalBarang += lineTotal;

    sheetDtl.appendRow([
      "DTL-" + Utilities.getUuid(),
      trxId,
      itm.sku,
      itm.qty,
      itm.harga_jual_satuan,
      0, // diskon satuan
      "OWN",
      itm.qty * 1000, // insentif
      0, // komisi penitip
      0, // komisi merchant
      0, // komisi promoter
      Math.round(itm.harga_jual_satuan * 0.6), // hpp estimate
      itm.spg_id || "",
      payload.toko_id,
      "BATCH-01",
      "hash_" + now.getTime(),
      now.toISOString()
    ]);

    // Reduce stock
    reduceStock(sheetStok, payload.toko_id, itm.sku, itm.qty);
  }

  var diskon = payload.diskon_amount || 0;
  var subtotalKenaPajak = Math.max(0, subtotalBarang - diskon);
  var pajakRate = payload.pajak_toggle ? (payload.pajak_rate || 0.11) : 0;
  var pajakAmount = Math.round(subtotalKenaPajak * pajakRate);
  var delivery = payload.delivery_amount || 0;
  var packaging = payload.packaging_amount || 0;
  var total = subtotalKenaPajak + pajakAmount + delivery + packaging;

  // Append Header
  sheetTrx.appendRow([
    trxId,
    dateStr,
    payload.toko_id,
    payload.kasir_id,
    payload.customer_id || "",
    payload.voucher_id || "",
    "",
    "",
    "",
    "A",
    payload.price_type || "NORMAL",
    subtotalBarang,
    diskon,
    subtotalKenaPajak,
    pajakRate,
    pajakAmount,
    false,
    delivery,
    packaging,
    total,
    payload.metode_bayar && payload.metode_bayar.length > 1,
    "PAID",
    "PAID",
    "SELESAI_UTUH",
    payload.sales_channel || "TOKO",
    payload.penerima_nama || "",
    payload.penerima_alamat || "",
    payload.penerima_wa || "",
    "",
    "",
    payload.catatan || "",
    payload.toko_id,
    "SYNC-001",
    "PENDING_SYNC",
    now.toISOString(),
    "hash_" + now.getTime(),
    now.toISOString(),
    "",
    ""
  ]);

  // Jurnal Otomatis
  sheetJurnal.appendRow([
    "JRN-" + Utilities.getUuid(),
    trxId,
    dateStr,
    "Kas / Bank",
    "Penjualan",
    total,
    "Penjualan POS " + trxId,
    "TRANSAKSI",
    trxId
  ]);

  return {
    transaction_id: trxId,
    nomor_manusia: payload.toko_id + " - " + dateStr + " - No. " + trxId,
    subtotal_barang: subtotalBarang,
    diskon_amount: diskon,
    subtotal_kena_pajak: subtotalKenaPajak,
    pajak_amount: pajakAmount,
    delivery_amount: delivery,
    packaging_amount: packaging,
    total: total,
    kembalian: 0,
    sync_status: "PENDING_SYNC",
    payment_status: "PAID"
  };
}

/**
 * Reduce stock helper
 */
function reduceStock(sheetStok, tokoId, sku, qty) {
  var data = sheetStok.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (data[r][1] == sku && data[r][2] == tokoId) {
      var current = Number(data[r][3]) || 0;
      sheetStok.getRange(r + 1, 4).setValue(Math.max(0, current - qty));
      break;
    }
  }
}

/**
 * Idempotency Helpers
 */
function checkIdempotency(requestId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Idempotency_Log");
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] == requestId) {
      return { response_json: data[i][5] };
    }
  }
  return null;
}

function saveIdempotency(requestId, mode, responseJson) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Idempotency_Log");
  if (sheet) {
    sheet.appendRow([
      "IDEM-" + Utilities.getUuid(),
      requestId,
      "",
      "",
      mode,
      responseJson,
      new Date().toISOString(),
      ""
    ]);
  }
}

function jsonResponse(ok, requestId, data, errCode, errMsg) {
  var res = {
    ok: ok,
    request_id: requestId,
    data: data,
    error: errCode ? { code: errCode, message: errMsg } : null
  };
  return ContentService.createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}

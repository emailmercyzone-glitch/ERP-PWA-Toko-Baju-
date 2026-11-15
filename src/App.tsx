/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * BLUEPRINT ERP PWA + GAS — TOKO BAJU UMKM (v40 + v40.1 Patch)
 */

import React, { useState } from 'react';
import { db } from './services/db';
import { Role } from './types/erp';
import { Navbar } from './components/Navbar';
import { POSModule } from './components/POSModule';
import { StokGudangModule } from './components/StokGudangModule';
import { FinanceJournalModule } from './components/FinanceJournalModule';
import { ApprovalModule } from './components/ApprovalModule';
import { FinancialReportsEFakturModule } from './components/FinancialReportsEFakturModule';
import { PayrollSalaryModule } from './components/PayrollSalaryModule';
import { PenitipAffiliatePortal } from './components/PenitipAffiliatePortal';
import { VoucherBundlePreorderModule } from './components/VoucherBundlePreorderModule';
import { OwnerGeminiDashboard } from './components/OwnerGeminiDashboard';
import { WhatsAppGatewayModule } from './components/WhatsAppGatewayModule';
import { BackupRestoreModule } from './components/BackupRestoreModule';
import { RoleLoginModal } from './components/RoleLoginModal';
import { TestCaseRunnerModal } from './components/TestCaseRunnerModal';
import { ReceiptModal } from './components/ReceiptModal';
import { OfflineIndicator } from './components/PWAInstallPrompt';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [currentRole, setCurrentRole] = useState<Role>('KASIR');
  const [currentStoreId, setCurrentStoreId] = useState<string>('TKO1');

  // Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [activeReceiptTrxId, setActiveReceiptTrxId] = useState<string | null>(null);

  const handleRoleChange = (newRole: Role, newStoreId: string) => {
    setCurrentRole(newRole);
    if (newStoreId) {
      setCurrentStoreId(newStoreId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white pb-12">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        currentStoreId={currentStoreId}
        setCurrentStoreId={setCurrentStoreId}
        stores={db.masterToko}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onOpenTestModal={() => setIsTestModalOpen(true)}
      />

      {/* Main Tab View */}
      <main className="flex-1">
        {activeTab === 'pos' && (
          <POSModule
            currentStoreId={currentStoreId}
            currentRole={currentRole}
            onOpenReceipt={(trxId) => setActiveReceiptTrxId(trxId)}
          />
        )}

        {activeTab === 'stok' && (
          <StokGudangModule
            currentStoreId={currentStoreId}
            currentRole={currentRole}
          />
        )}

        {activeTab === 'kas' && (
          <FinanceJournalModule
            currentStoreId={currentStoreId}
            currentRole={currentRole}
          />
        )}

        {activeTab === 'approval' && (
          <ApprovalModule
            currentRole={currentRole}
          />
        )}

        {activeTab === 'laporan' && (
          <FinancialReportsEFakturModule
            currentStoreId={currentStoreId}
            currentRole={currentRole}
          />
        )}

        {activeTab === 'gaji' && (
          <PayrollSalaryModule
            currentStoreId={currentStoreId}
            currentRole={currentRole}
          />
        )}

        {activeTab === 'portal' && (
          <PenitipAffiliatePortal />
        )}

        {activeTab === 'voucher' && (
          <VoucherBundlePreorderModule />
        )}

        {activeTab === 'wa' && (
          <WhatsAppGatewayModule
            currentStoreId={currentStoreId}
            currentRole={currentRole}
          />
        )}

        {activeTab === 'backup' && (
          <BackupRestoreModule
            currentRole={currentRole}
            currentStoreId={currentStoreId}
          />
        )}

        {activeTab === 'owner' && (
          <OwnerGeminiDashboard
            currentRole={currentRole}
            currentStoreId={currentStoreId}
          />
        )}
      </main>

      {/* Role & PIN Switcher Modal */}
      <RoleLoginModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
      />

      {/* Test Case Suite Runner Modal */}
      <TestCaseRunnerModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      {/* Thermal Receipt & Document Preview Modal */}
      <ReceiptModal
        trxId={activeReceiptTrxId}
        onClose={() => setActiveReceiptTrxId(null)}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}

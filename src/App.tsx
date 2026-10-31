/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { Header } from './components/Header';
import { SingleLookupView } from './components/SingleLookupView';
import { BulkLookupView } from './components/BulkLookupView';
import { HeaderAnalyzerView } from './components/HeaderAnalyzerView';
import { PermutatorView } from './components/PermutatorView';
import { WatchlistView } from './components/WatchlistView';
import { DossierModal } from './components/DossierModal';
import { AuthModal, AnalystUser } from './components/AuthModal';
import { OsintScanResult, DossierRecord } from './types/osint';
import { runOsintScan } from './services/osintEngine';
import { runPhoneScan } from './services/phoneService';
import { getSafeErrorMessage, sanitizePlainText } from './utils/security';

const DEFAULT_ANALYST: AnalystUser = {
  name: 'Mir Riasat Asfak',
  email: 'mirriasat123@gmail.com',
  role: 'Lead OSINT Analyst',
  clearance: 'Level 4 Clearance',
  isAuthenticated: true,
  sessionToken: 'RT-SEC-9402',
  authProvider: 'credentials',
};

const GUEST_ANALYST: AnalystUser = {
  name: 'Guest Investigator',
  email: '',
  role: 'Unauthenticated Terminal',
  clearance: 'Guest Access',
  isAuthenticated: false,
  authProvider: 'guest',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'header' | 'permutator' | 'dossier'>('single');
  const [currentScan, setCurrentScan] = useState<OsintScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authNotification, setAuthNotification] = useState<string | null>(null);

  // Theme state: dark mode default with instant localStorage persistence
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('riasattrace_theme');
      return saved === 'light' || saved === 'dark' ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  // Investigator profile session
  const [currentUser, setCurrentUser] = useState<AnalystUser>(() => {
    try {
      const saved = localStorage.getItem('riasattrace_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.name === 'string') {
          return parsed;
        }
      }
      return DEFAULT_ANALYST;
    } catch {
      return DEFAULT_ANALYST;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Logout handler to terminate session and reset to guest view
  const handleLogout = () => {
    setCurrentUser(GUEST_ANALYST);
    try {
      localStorage.removeItem('riasattrace_user');
    } catch (e) {
      console.warn('Error clearing user session', e);
    }
    setAuthNotification('Investigator session terminated. Switched to public guest mode.');
    setTimeout(() => {
      setAuthNotification(null);
    }, 4500);
  };

  // Synchronize theme to document root
  useEffect(() => {
    try {
      localStorage.setItem('riasattrace_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } catch (e) {
      console.warn('Error setting theme', e);
    }
  }, [theme]);

  // Synchronize user profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('riasattrace_user', JSON.stringify(currentUser));
    } catch (e) {
      console.warn('Error persisting investigator profile', e);
    }
  }, [currentUser]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [dossiers, setDossiers] = useState<DossierRecord[]>(() => {
    try {
      const saved = localStorage.getItem('behind_the_email_dossiers');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Sanitize loaded dossiers defensively
      return parsed.map((d) => ({
        ...d,
        tag: sanitizePlainText(d.tag, 50) || 'General',
        notes: sanitizePlainText(d.notes, 1000),
        caseId: sanitizePlainText(d.caseId, 50),
      }));
    } catch {
      return [];
    }
  });
  const [dossierModalScan, setDossierModalScan] = useState<OsintScanResult | null>(null);

  // Save dossiers to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem('behind_the_email_dossiers', JSON.stringify(dossiers));
    } catch (e) {
      console.warn('Unable to persist dossiers to local storage', e);
    }
  }, [dossiers]);

  // No auto-load on mount - search input and results remain empty until user investigates

  const handleScanEmail = async (email: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setActiveTab('single');
    try {
      const result = await runOsintScan(email);
      setCurrentScan(result);
    } catch (err: unknown) {
      setErrorMessage(getSafeErrorMessage(err, 'Unable to complete scan for target. Please ensure format is valid.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanPhone = async (countryCode: string, phoneNumber: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setActiveTab('single');
    try {
      const result = await runPhoneScan(countryCode, phoneNumber);
      setCurrentScan(result);
    } catch (err: unknown) {
      setErrorMessage(getSafeErrorMessage(err, 'Unable to complete phone intelligence lookup. Please verify the mobile number.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDossier = (scan: OsintScanResult) => {
    setDossierModalScan(scan);
  };

  const handleConfirmSaveDossier = (tag: string, caseId: string, notes: string) => {
    if (!dossierModalScan) return;
    const newRecord: DossierRecord = {
      id: `dossier_${Date.now()}`,
      email: dossierModalScan.email,
      name: dossierModalScan.identity.probableName,
      tag: sanitizePlainText(tag, 50) || 'General',
      caseId: sanitizePlainText(caseId, 50),
      notes: sanitizePlainText(notes, 1000),
      savedAt: new Date().toISOString(),
      lastScore: dossierModalScan.risk.score,
      platformsCount: dossierModalScan.platforms.filter((p) => p.status === 'found' || p.status === 'likely').length,
      breachesCount: dossierModalScan.breaches.length,
      scanData: dossierModalScan,
    };

    setDossiers((prev) => [newRecord, ...prev.filter((d) => d.email !== newRecord.email)]);
  };

  const handleDeleteDossier = (id: string) => {
    setDossiers((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateNotes = (id: string, notes: string, tag: string) => {
    setDossiers((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              notes: sanitizePlainText(notes, 1000),
              tag: sanitizePlainText(tag, 50) || 'General',
            }
          : d
      )
    );
  };

  const handleSelectScanFromDossier = (scan: OsintScanResult) => {
    setCurrentScan(scan);
    setErrorMessage(null);
    setActiveTab('single');
  };

  const handleExportAllDossiers = () => {
    if (dossiers.length === 0) return;
    const dataStr = JSON.stringify(dossiers, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riasattrace-all-dossiers-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isCurrentSaved = Boolean(
    currentScan && dossiers.some((d) => d.email.toLowerCase() === currentScan.email.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-200">
      {/* 1-Row 3-Zone Top Bar with Theme Toggle and Profile Menu */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewScan={() => {
          setActiveTab('single');
          setCurrentScan(null);
          setErrorMessage(null);
        }}
        dossierCount={dossiers.length}
        theme={theme}
        toggleTheme={toggleTheme}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onScanEmail={handleScanEmail}
        onExportAllDossiers={handleExportAllDossiers}
      />

      {/* Dismissible Feedback / Auth Banner */}
      {authNotification && (
        <div className="max-w-7xl w-full mx-auto px-4 lg:px-8 pt-4 animate-fade-in">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-3 flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-medium">{authNotification}</span>
            </div>
            <button
              onClick={() => setAuthNotification(null)}
              className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 p-1 cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Dismissible Error Banner */}
      {errorMessage && (
        <div className="max-w-7xl w-full mx-auto px-4 lg:px-8 pt-4">
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-3.5 flex items-center justify-between text-rose-700 dark:text-rose-300 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 p-1 cursor-pointer"
              title="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 md:py-8">
        {activeTab === 'single' && (
          <SingleLookupView
            currentScan={currentScan}
            isLoading={isLoading}
            onScanEmail={handleScanEmail}
            onScanPhone={handleScanPhone}
            onSaveDossier={handleSaveDossier}
            isSavedInDossier={isCurrentSaved}
          />
        )}

        {activeTab === 'bulk' && (
          <BulkLookupView onSelectResult={handleSelectScanFromDossier} />
        )}

        {activeTab === 'header' && (
          <HeaderAnalyzerView onScanEmail={handleScanEmail} />
        )}

        {activeTab === 'permutator' && (
          <PermutatorView onScanEmail={handleScanEmail} />
        )}

        {activeTab === 'dossier' && (
          <WatchlistView
            dossiers={dossiers}
            onSelectScan={handleSelectScanFromDossier}
            onDeleteDossier={handleDeleteDossier}
            onUpdateNotes={handleUpdateNotes}
          />
        )}
      </main>

      {/* Save Dossier Modal */}
      {dossierModalScan && (
        <DossierModal
          scan={dossierModalScan}
          isOpen={Boolean(dossierModalScan)}
          onClose={() => setDossierModalScan(null)}
          onConfirmSave={handleConfirmSaveDossier}
        />
      )}

      {/* Investigator Authentication & Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        currentUser={currentUser}
        onClose={() => setIsAuthModalOpen(false)}
        onSaveUser={(updatedUser) => {
          setCurrentUser(updatedUser);
          setAuthNotification(
            `Session verified: Signed in as ${updatedUser.name} (${updatedUser.clearance}).`
          );
          setTimeout(() => setAuthNotification(null), 4500);
        }}
      />

      {/* Quiet, ethical footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#080c14] py-6 px-4 lg:px-8 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono flex-wrap">
            <span className="text-slate-900 dark:text-white font-semibold">RiasatTrace</span>
            <span>·</span>
            <span>100% Free Reverse OSINT Intelligence</span>
            <span>·</span>
            <span>Zero Paywalls & No Daily Token Caps</span>
          </div>

          <div className="text-slate-500 dark:text-slate-400 text-center md:text-right leading-relaxed">
            Non-intrusive lookup protocol · Queries public DNS, DoH, and open platform registries without alerting recipient.
          </div>
        </div>
      </footer>
    </div>
  );
}

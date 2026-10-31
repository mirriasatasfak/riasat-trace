import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Layers,
  FileCode,
  Users,
  ShieldCheck,
  Bookmark,
  Sun,
  Moon,
  User,
  ChevronDown,
  LogOut,
  UserCheck,
  Download,
  KeyRound,
  Shield,
  Activity,
  LogIn,
} from 'lucide-react';
import { AnalystUser } from './AuthModal';

interface HeaderProps {
  activeTab: 'single' | 'bulk' | 'header' | 'permutator' | 'dossier';
  setActiveTab: (tab: 'single' | 'bulk' | 'header' | 'permutator' | 'dossier') => void;
  onNewScan: () => void;
  dossierCount: number;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  currentUser: AnalystUser;
  onOpenAuthModal: () => void;
  onLogout?: () => void;
  onScanEmail: (email: string) => Promise<void>;
  onExportAllDossiers?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewScan,
  dossierCount,
  theme,
  toggleTheme,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onScanEmail,
  onExportAllDossiers,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 lg:px-8 py-3 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setActiveTab('single')}
          className="flex items-center gap-2.5 text-left text-slate-900 dark:text-slate-100 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 group focus:outline-none cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:border-cyan-400/60 transition-colors shadow-xs">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white block">
              RiasatTrace
            </span>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400/90 tracking-wider uppercase font-mono block -mt-0.5 font-medium">
              Advanced OSINT Intelligence
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 text-sm font-medium">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'single'
                ? 'bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Reverse Lookup</span>
          </button>

          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bulk'
                ? 'bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bulk Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('header')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'header'
                ? 'bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Header Inspector</span>
          </button>

          <button
            onClick={() => setActiveTab('permutator')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'permutator'
                ? 'bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Permutator</span>
          </button>

          <button
            onClick={() => setActiveTab('dossier')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dossier'
                ? 'bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Dossiers</span>
            {dossierCount > 0 && (
              <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold ml-0.5">
                ({dossierCount})
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Primary Actions, Theme Toggle, Profile & New Scan */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Smooth Dark/Light Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="p-2 rounded-lg border transition-all text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer shadow-xs focus:outline-none"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* If user is not authenticated, show quick Sign In button */}
          {!currentUser.isAuthenticated && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-label="Investigator Profile Menu"
              aria-expanded={isProfileOpen}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer shadow-xs focus:outline-none ${
                currentUser.isAuthenticated
                  ? 'bg-slate-100 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 hover:border-cyan-500/50 text-slate-800 dark:text-slate-100'
                  : 'bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700/70 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                    currentUser.isAuthenticated
                      ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-400/40'
                  }`}
                >
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'MR'}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-white dark:ring-[#0b0f19] ${
                    currentUser.isAuthenticated ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
              </div>
              <div className="hidden xl:block text-left text-xs leading-tight">
                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
                  {currentUser.isAuthenticated
                    ? currentUser.clearance.replace('Clearance', '').trim() || 'L4'
                    : 'Guest Access'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-slate-800 dark:text-slate-200 animate-fade-in text-xs font-sans">
                {/* Profile Header */}
                <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 rounded-t-xl">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                        currentUser.isAuthenticated
                          ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {currentUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || 'MR'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono truncate">
                        {currentUser.email || 'Unauthenticated Guest'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Shield className="w-3 h-3 text-cyan-500" />
                        <span>{currentUser.role}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    <span
                      className={`flex items-center gap-1 ${
                        currentUser.isAuthenticated
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          currentUser.isAuthenticated ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      {currentUser.isAuthenticated ? 'Session Active' : 'Public Access'}
                    </span>
                    <span className="text-slate-400">
                      {currentUser.sessionToken || (currentUser.isAuthenticated ? 'RT-SEC-2026' : 'GUEST')}
                    </span>
                  </div>
                </div>

                {/* Dropdown Action Links */}
                <div className="py-1">
                  {currentUser.isAuthenticated && currentUser.email && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onScanEmail(currentUser.email);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/70 flex items-center gap-2.5 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 text-cyan-500" />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">Run Self Audit</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Scan {currentUser.email}
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setActiveTab('dossier');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/70 flex items-center gap-2.5 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-cyan-500" />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Case Dossiers</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {dossierCount} saved targets
                      </div>
                    </div>
                  </button>

                  {onExportAllDossiers && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onExportAllDossiers();
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/70 flex items-center gap-2.5 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-500" />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">Export All Dossiers</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">JSON Archive</div>
                      </div>
                    </button>
                  )}
                </div>

                {/* Footer Switch & Logout */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-1 mt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/70 flex items-center gap-2.5 text-cyan-600 dark:text-cyan-400 transition-colors cursor-pointer font-medium"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{currentUser.isAuthenticated ? 'Switch Profile / Clearance' : 'Sign In / Register'}</span>
                  </button>

                  {/* Dedicated Logout Button */}
                  {currentUser.isAuthenticated && onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <div>
                        <div className="font-semibold">Logout / Terminate Session</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Clear active tokens & session
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* New Lookup CTA Button */}
          <button
            onClick={onNewScan}
            className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-xs hover:shadow-cyan-500/20 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            New Lookup
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex items-center justify-between overflow-x-auto pt-2 pb-0.5 gap-1.5 border-t border-slate-200 dark:border-slate-800/60 mt-2">
        <button
          onClick={() => setActiveTab('single')}
          className={`text-xs px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
            activeTab === 'single'
              ? 'bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Lookup
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`text-xs px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
            activeTab === 'bulk'
              ? 'bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Bulk Scan
        </button>
        <button
          onClick={() => setActiveTab('header')}
          className={`text-xs px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
            activeTab === 'header'
              ? 'bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Headers
        </button>
        <button
          onClick={() => setActiveTab('permutator')}
          className={`text-xs px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
            activeTab === 'permutator'
              ? 'bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Permutator
        </button>
        <button
          onClick={() => setActiveTab('dossier')}
          className={`text-xs px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
            activeTab === 'dossier'
              ? 'bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Dossiers ({dossierCount})
        </button>
      </div>
    </header>
  );
};

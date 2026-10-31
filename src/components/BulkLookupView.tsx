import React, { useState } from 'react';
import {
  Layers,
  Upload,
  Download,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  FileSpreadsheet,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { BulkScanItem, OsintScanResult } from '../types/osint';
import { runOsintScan } from '../services/osintEngine';

import { sanitizeCsvCell, sanitizeEmail, getSafeErrorMessage } from '../utils/security';

interface BulkLookupViewProps {
  onSelectResult: (scan: OsintScanResult) => void;
}

export const BulkLookupView: React.FC<BulkLookupViewProps> = ({ onSelectResult }) => {
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState<BulkScanItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const sampleBulk = `satya.nadella@microsoft.com
torvalds@linux-foundation.org
mirriasat123@gmail.com
contact@stripe.com
disposable-test@10minutemail.com`;

  const handleLoadSample = () => {
    setInputText(sampleBulk);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security check: limit upload size to 2MB max to prevent memory exhaustion
    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds the 2MB limit. Please upload a smaller email list.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      if (content) {
        // Extract emails using safe regex
        const matches = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        if (matches) {
          const unique = Array.from(new Set(matches.map((m) => sanitizeEmail(m).email).filter(Boolean))).slice(0, 50);
          setInputText(unique.join('\n'));
        }
      }
    };
    reader.readAsText(file);
  };

  const handleStartBulkScan = async () => {
    const lines = inputText
      .split('\n')
      .map((l) => sanitizeEmail(l).email)
      .filter((l) => l.includes('@') && l.includes('.'));

    // Limit to 50 unique targets per batch
    const uniqueEmails = Array.from(new Set(lines)).slice(0, 50);
    if (uniqueEmails.length === 0) return;

    const initialItems: BulkScanItem[] = uniqueEmails.map((email, idx) => ({
      id: `bulk_${idx}_${Date.now()}`,
      email,
      status: 'pending',
    }));

    setItems(initialItems);
    setIsProcessing(true);
    setCompletedCount(0);

    // Process in sequential items
    for (let i = 0; i < initialItems.length; i++) {
      const item = initialItems[i];
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'scanning' } : it))
      );

      try {
        const result = await runOsintScan(item.email);
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: 'completed', result } : it
          )
        );
      } catch (err: unknown) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: 'error', errorMessage: getSafeErrorMessage(err, 'Scan failed') }
              : it
          )
        );
      }

      setCompletedCount((prev) => prev + 1);
    }

    setIsProcessing(false);
  };

  const handleExportCsv = () => {
    const completed = items.filter((it) => it.result);
    if (completed.length === 0) return;

    const headers = [
      'Email',
      'Masked Email',
      'Suffix Identifier',
      'Probable Name',
      'Mail Provider',
      'Has MX',
      'SPF Valid',
      'DMARC Policy',
      'Is Disposable',
      'Google Account',
      'Gaia ID',
      'Platforms Found',
      'Breach Count',
      'Risk Score',
      'Risk Level',
    ];

    const rows = completed.map((it) => {
      const r = it.result!;
      const platformsFound = r.platforms.filter((p) => p.status === 'found' || p.status === 'likely').length;
      return [
        r.email,
        r.identity.maskedEmail || '',
        r.identity.suffixIdentifier || '',
        r.identity.probableName || '',
        r.dns.providerName,
        r.dns.hasMx ? 'Yes' : 'No',
        r.dns.spfValid ? 'Yes' : 'No',
        r.dns.dmarcPolicy || 'none',
        r.dns.isDisposable ? 'Yes' : 'No',
        r.google.accountExists ? 'Yes' : 'No',
        r.google.gaiaId || '',
        platformsFound,
        r.breaches.length,
        r.risk.score,
        r.risk.level,
      ];
    });

    const csvContent = [headers.map((h) => sanitizeCsvCell(h)).join(','), ...rows.map((r) => r.map((c) => sanitizeCsvCell(c)).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riasattrace-bulk-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const completedItems = items.filter((it) => it.status === 'completed' && it.result);
  const totalBreaches = completedItems.reduce((acc, it) => acc + (it.result?.breaches.length || 0), 0);
  const avgRisk = completedItems.length > 0 ? Math.round(completedItems.reduce((acc, it) => acc + (it.result?.risk.score || 0), 0) / completedItems.length) : 0;

  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-cyan-400" />
              <span>Bulk Reverse Email Scanner</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Batch query up to dozens of targets at once. RiasatTrace provides free, unlimited, and private bulk intelligence scanning with zero paywalls or subscription limits.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleLoadSample}
              className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Load Sample List
            </button>
            <label className="px-3 py-2 text-xs font-medium text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 font-semibold">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV / TXT</span>
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Input Text Area */}
        <div className="mt-5 space-y-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
            rows={5}
            placeholder="Paste list of emails (one per line, e.g. satya@microsoft.com)..."
            className="w-full p-3 bg-[#0b0f19] border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-slate-500 font-mono">
              {inputText.split('\n').filter((l) => l.trim()).length} target emails queued
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={() => setItems([])}
                  disabled={isProcessing}
                  className="px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Results</span>
                </button>
              )}

              <button
                onClick={handleStartBulkScan}
                disabled={isProcessing || !inputText.trim()}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing ({completedCount}/{items.length})...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Run Batch Intelligence Scan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Progress & Summary Bar */}
      {items.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Batch Progress:</span>
              <span className="font-mono text-cyan-400">
                {completedCount} / {items.length} ({Math.round((completedCount / items.length) * 100) || 0}%)
              </span>
            </div>

            {completedItems.length > 0 && (
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Batch CSV</span>
              </button>
            )}
          </div>

          {/* Progress bar line */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${(completedCount / items.length) * 100}%` }}
            />
          </div>

          {/* Stat metrics */}
          {completedItems.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
              <div>
                <div className="text-[11px] text-slate-400">Scanned Targets</div>
                <div className="text-lg font-bold font-mono text-white tabular-nums">{completedItems.length}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Average Risk Score</div>
                <div className="text-lg font-bold font-mono text-amber-400 tabular-nums">{avgRisk}/100</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Total Leaks Identified</div>
                <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">{totalBreaches}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Valid Mailboxes</div>
                <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                  {completedItems.filter((it) => it.result?.dns.hasMx).length}
                </div>
              </div>
            </div>
          )}

          {/* Results High-Density Table */}
          <div className="border border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0b0f19] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Target Email</th>
                  <th className="px-4 py-3">Inferred Identity</th>
                  <th className="px-4 py-3">Mail Provider</th>
                  <th className="px-4 py-3">Platforms</th>
                  <th className="px-4 py-3">Breaches</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900">
                {items.map((item) => {
                  const r = item.result;
                  const platformsCount = r
                    ? r.platforms.filter((p) => p.status === 'found' || p.status === 'likely').length
                    : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2.5">
                        {item.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {item.status === 'scanning' && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />}
                        {item.status === 'pending' && <span className="text-slate-600">Queued</span>}
                        {item.status === 'error' && <XCircle className="w-4 h-4 text-rose-400" />}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-white max-w-[220px]">
                        <div className="truncate">{item.email}</div>
                        {r?.identity.maskedEmail && (
                          <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium text-slate-400">Mask:</span>
                            <span className="text-cyan-300">{r.identity.maskedEmail}</span>
                            {r.identity.suffixIdentifier && (
                              <span className="text-[9px] bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 px-1 rounded">
                                ...{r.identity.suffixIdentifier}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">{r?.identity.probableName || '—'}</td>
                      <td className="px-4 py-2.5 text-slate-400">{r?.dns.providerName || '—'}</td>
                      <td className="px-4 py-2.5 text-cyan-400 tabular-nums">{r ? `${platformsCount} found` : '—'}</td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {r ? (
                          r.breaches.length > 0 ? (
                            <span className="text-rose-400 font-bold">{r.breaches.length} breaches</span>
                          ) : (
                            <span className="text-emerald-400">Clean</span>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {r ? (
                          <span
                            className={
                              r.risk.score >= 50
                                ? 'text-rose-400 font-bold'
                                : r.risk.score >= 25
                                ? 'text-amber-400 font-bold'
                                : 'text-emerald-400 font-bold'
                            }
                          >
                            {r.risk.score} ({r.risk.level})
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {r && (
                          <button
                            onClick={() => onSelectResult(r)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            title="Inspect full intelligence report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

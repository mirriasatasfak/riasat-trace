import React, { useState } from 'react';
import {
  FileCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Server,
  Terminal,
  Search,
} from 'lucide-react';
import { parseRawEmailHeaders, SAMPLE_HEADER } from '../services/headerParser';
import { ParsedEmailHeaders } from '../types/osint';

interface HeaderAnalyzerViewProps {
  onScanEmail: (email: string) => void;
}

export const HeaderAnalyzerView: React.FC<HeaderAnalyzerViewProps> = ({ onScanEmail }) => {
  const [rawText, setRawText] = useState(SAMPLE_HEADER);
  const [parsed, setParsed] = useState<ParsedEmailHeaders | null>(() => parseRawEmailHeaders(SAMPLE_HEADER));

  const handleAnalyze = () => {
    if (!rawText.trim()) return;
    setParsed(parseRawEmailHeaders(rawText));
  };

  const handleClear = () => {
    setRawText('');
    setParsed(null);
  };

  const extractSenderEmail = (fromStr?: string): string | null => {
    if (!fromStr) return null;
    const match = fromStr.match(/<([^>]+)>/) || fromStr.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1] : null;
  };

  const senderEmail = extractSenderEmail(parsed?.from);

  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileCode className="w-6 h-6 text-cyan-400" />
              <span>Email Header & Relay Hop Inspector</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Paste raw RFC 822/5322 email headers (from Gmail "Show original", Outlook "View message source", or Apple Mail) to analyze sender hops, SPF/DKIM authentication, and detect spoofing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRawText(SAMPLE_HEADER);
                setParsed(parseRawEmailHeaders(SAMPLE_HEADER));
              }}
              className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Load Sample Header
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-2 text-xs font-medium text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Text area */}
        <div className="mt-5 space-y-3">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={7}
            placeholder="Paste raw email headers starting with Received: or Delivered-To:..."
            className="w-full p-3 bg-[#0b0f19] border border-slate-800 rounded-lg text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />

          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={!rawText.trim()}
              className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>Parse & Verify Hop Chain</span>
            </button>
          </div>
        </div>
      </section>

      {/* Analysis Results */}
      {parsed && (
        <div className="space-y-6">
          {/* Top Verdicts & Authentication */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-mono tracking-wider">Subject</span>
                <h2 className="text-lg font-bold text-white mt-0.5">{parsed.subject || '(No Subject)'}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1 flex-wrap">
                  <span>From: <strong className="text-slate-200">{parsed.from}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Date: {parsed.date || 'Unknown'}</span>
                </div>
              </div>

              {senderEmail && (
                <button
                  onClick={() => onScanEmail(senderEmail)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all self-start md:self-auto cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Scan Sender Email ({senderEmail})</span>
                </button>
              )}
            </div>

            {/* Authentication verdict triplet */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#0b0f19] border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">SPF Authentication</span>
                  {parsed.spfStatus === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {parsed.spfStatus === 'fail' && <XCircle className="w-4 h-4 text-rose-400" />}
                  {parsed.spfStatus === 'none' && <span className="text-xs text-slate-500">None</span>}
                </div>
                <div className="text-base font-bold font-mono mt-1 uppercase">
                  <span className={parsed.spfStatus === 'pass' ? 'text-emerald-400' : parsed.spfStatus === 'fail' ? 'text-rose-400' : 'text-slate-400'}>
                    {parsed.spfStatus}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-[#0b0f19] border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">DKIM Signature</span>
                  {parsed.dkimStatus === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {parsed.dkimStatus === 'fail' && <XCircle className="w-4 h-4 text-rose-400" />}
                  {parsed.dkimStatus === 'none' && <span className="text-xs text-slate-500">None</span>}
                </div>
                <div className="text-base font-bold font-mono mt-1 uppercase">
                  <span className={parsed.dkimStatus === 'pass' ? 'text-emerald-400' : parsed.dkimStatus === 'fail' ? 'text-rose-400' : 'text-slate-400'}>
                    {parsed.dkimStatus}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-[#0b0f19] border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">DMARC Alignment</span>
                  {parsed.dmarcStatus === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {parsed.dmarcStatus === 'fail' && <XCircle className="w-4 h-4 text-rose-400" />}
                  {parsed.dmarcStatus === 'none' && <span className="text-xs text-slate-500">None</span>}
                </div>
                <div className="text-base font-bold font-mono mt-1 uppercase">
                  <span className={parsed.dmarcStatus === 'pass' ? 'text-emerald-400' : parsed.dmarcStatus === 'fail' ? 'text-rose-400' : 'text-slate-400'}>
                    {parsed.dmarcStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Suspicious Signals Callout */}
            {parsed.suspiciousSignals.length > 0 && (
              <div className="p-4 bg-rose-950/20 border border-rose-900/50 rounded-lg space-y-2">
                <div className="text-xs font-bold text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Security & Spoofing Warnings Detected</span>
                </div>
                <ul className="list-disc list-inside text-xs text-rose-200/90 space-y-1">
                  {parsed.suspiciousSignals.map((sig, i) => (
                    <li key={i}>{sig}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Hop-by-Hop Transit Chain */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span>Relay Hop Chain ({parsed.hops.length} Hops in Transit)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chronological transit trail from originating sender MTA to destination inbox
                </p>
              </div>
              {parsed.originatingIp && (
                <span className="text-xs font-mono text-cyan-300">
                  Originating IP: <strong>{parsed.originatingIp}</strong>
                </span>
              )}
            </div>

            <div className="space-y-3 pt-2">
              {parsed.hops.map((hop) => (
                <div key={hop.hopNumber} className="p-4 bg-[#0b0f19] border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                    <span className="px-2 py-0.5 bg-slate-800 text-cyan-300 rounded font-bold">
                      Hop #{hop.hopNumber}
                    </span>
                    {hop.delaySeconds !== undefined && (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Transit Delay: +{hop.delaySeconds}s</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-1">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Transmitted By / MTA:</span>
                      <span className="text-slate-200 font-medium truncate block">{hop.by}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Received From:</span>
                      <span className="text-slate-200 font-medium truncate block">{hop.from}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono text-slate-400">
                    <span>Protocol: {hop.with}</span>
                    {hop.ip && <span className="text-cyan-400">Relay IP: {hop.ip}</span>}
                    {hop.timestamp && <span>{hop.timestamp}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

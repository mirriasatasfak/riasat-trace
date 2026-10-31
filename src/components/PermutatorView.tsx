import React, { useState } from 'react';
import { Users, Search, Copy, Check, ArrowRight, Sparkles, Building, Mail } from 'lucide-react';
import { generateEmailPermutations } from '../services/permutatorService';
import { PermutationResult } from '../types/osint';
import { sanitizeDomain, sanitizeUsername } from '../utils/security';

interface PermutatorViewProps {
  onScanEmail: (email: string) => void;
}

export const PermutatorView: React.FC<PermutatorViewProps> = ({ onScanEmail }) => {
  const [firstName, setFirstName] = useState('Satya');
  const [lastName, setLastName] = useState('Nadella');
  const [domain, setDomain] = useState('microsoft.com');
  const [permutations, setPermutations] = useState<PermutationResult[]>(() =>
    generateEmailPermutations('Satya', 'Nadella', 'microsoft.com')
  );
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirst = sanitizeUsername(firstName);
    const cleanLast = sanitizeUsername(lastName);
    const cleanDom = sanitizeDomain(domain);
    if (!cleanFirst || !cleanDom) return;
    setPermutations(generateEmailPermutations(cleanFirst, cleanLast, cleanDom));
  };

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleCopyAll = () => {
    const list = permutations.map((p) => p.email).join('\n');
    navigator.clipboard.writeText(list);
    setCopiedEmail('all');
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro & Generator Form */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>Corporate Email Permutation Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            In OSINT investigations, when you only possess a person's name and employer, generate standard corporate mailbox patterns to discover and verify their active corporate inbox.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Satya"
              required
              className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Nadella"
              className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Company Domain</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. microsoft.com"
              required
              className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Permutations ({permutations.length})</span>
            </button>
          </div>
        </form>
      </section>

      {/* Permutation Results Matrix */}
      {permutations.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Generated Variations for {firstName} {lastName} ({permutations.length} patterns)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Target company domain: <span className="font-mono text-cyan-300">@{domain}</span>
              </p>
            </div>

            <button
              onClick={handleCopyAll}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedEmail === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy All ({permutations.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {permutations.map((p, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#0b0f19] border border-slate-800 hover:border-slate-700 rounded-lg flex items-center justify-between gap-3 text-xs font-mono group transition-colors"
              >
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 block truncate uppercase">{p.pattern}</span>
                  <span className="font-semibold text-slate-200 truncate block mt-0.5">{p.email}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(p.email)}
                    className="p-1.5 text-slate-500 hover:text-slate-300 rounded transition-colors cursor-pointer"
                    title="Copy email"
                  >
                    {copiedEmail === p.email ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => onScanEmail(p.email)}
                    className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors cursor-pointer"
                    title="Run OSINT scan on this variation"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

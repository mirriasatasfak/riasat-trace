import React, { useState } from 'react';
import { Bookmark, X, Check } from 'lucide-react';
import { OsintScanResult } from '../types/osint';
import { sanitizePlainText } from '../utils/security';

interface DossierModalProps {
  scan: OsintScanResult;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSave: (tag: string, caseId: string, notes: string) => void;
}

export const DossierModal: React.FC<DossierModalProps> = ({ scan, isOpen, onClose, onConfirmSave }) => {
  const [tag, setTag] = useState('Fraud & Risk');
  const [caseId, setCaseId] = useState(`CASE-${Date.now().toString().slice(-4)}`);
  const [notes, setNotes] = useState(
    `Initial reverse email scan completed. Score: ${scan.risk.score}/100. Provider: ${scan.dns.providerName}.`
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = sanitizePlainText(tag, 50) || 'General';
    const cleanCaseId = sanitizePlainText(caseId, 50);
    const cleanNotes = sanitizePlainText(notes, 1000);
    onConfirmSave(cleanTag, cleanCaseId, cleanNotes);
    onClose();
  };

  const tagPresets = ['Fraud & Risk', 'Phishing Threat', 'Sales Lead', 'Candidate Enrichment', 'OSINT Dossier'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 text-slate-900 dark:text-slate-100">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Save to Investigation Dossier</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono break-all">{scan.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Case Classification Tag
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tagPresets.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setTag(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    tag === preset
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Investigation Case ID (Optional)
            </label>
            <input
              type="text"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Analyst Findings & Dossier Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Save Case Dossier</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

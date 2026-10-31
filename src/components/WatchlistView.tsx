import React, { useState } from 'react';
import {
  Bookmark,
  Search,
  Trash2,
  Eye,
  FileSpreadsheet,
  Download,
  Tag,
  Clock,
  ShieldAlert,
  FileText,
  Plus,
  Printer,
} from 'lucide-react';
import { DossierRecord, OsintScanResult } from '../types/osint';
import { sanitizePlainText, sanitizeCsvCell } from '../utils/security';

interface WatchlistViewProps {
  dossiers: DossierRecord[];
  onSelectScan: (scan: OsintScanResult) => void;
  onDeleteDossier: (id: string) => void;
  onUpdateNotes: (id: string, notes: string, tag: string) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  dossiers,
  onSelectScan,
  onDeleteDossier,
  onUpdateNotes,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteEdit, setNoteEdit] = useState('');
  const [tagEdit, setTagEdit] = useState('');

  const filteredDossiers = dossiers.filter((d) => {
    const matchesSearch =
      d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.name && d.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      d.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.caseId && d.caseId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = selectedTag === 'all' || d.tag === selectedTag;
    return matchesSearch && matchesTag;
  });

  const availableTags = Array.from(new Set(dossiers.map((d) => d.tag))).filter(Boolean);

  const handleStartEdit = (d: DossierRecord) => {
    setEditingId(d.id);
    setNoteEdit(d.notes);
    setTagEdit(d.tag);
  };

  const handleSaveEdit = (id: string) => {
    const cleanNote = sanitizePlainText(noteEdit, 1000);
    const cleanTag = sanitizePlainText(tagEdit, 50) || 'General';
    onUpdateNotes(id, cleanNote, cleanTag);
    setEditingId(null);
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(dossiers, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riasattrace-dossiers-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (dossiers.length === 0) return;
    const rows = [
      ['Case ID', 'Target Identifier', 'Subject Name', 'Classification Tag', 'Risk Score', 'Detected Platforms', 'Breaches', 'Saved Date', 'Investigator Notes'],
      ...dossiers.map((d) => [
        d.caseId || '',
        d.email,
        d.name || '',
        d.tag,
        String(d.lastScore),
        String(d.platformsCount),
        String(d.breachesCount),
        d.savedAt,
        d.notes || '',
      ]),
    ];

    const csvContent = rows
      .map((row) => row.map((cell) => `"${sanitizeCsvCell(cell)}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riasattrace-dossiers-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintDossiers = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 shadow-xl relative overflow-hidden transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              <span>Investigation Dossiers & Casebook</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Locally stored case files, notes, and threat dossiers. Stored privately and securely in encrypted local browser memory.
            </p>
          </div>

          {dossiers.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportJson}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Export all records as JSON"
              >
                <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>JSON</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Export all records as CSV spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>CSV</span>
              </button>

              <button
                onClick={handlePrintDossiers}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Print or save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Casebook</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search dossiers by target identifier, subject name, case ID, or notes..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          {availableTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedTag === 'all'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All ({dossiers.length})
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    selectedTag === tag
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Dossiers List */}
      {filteredDossiers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDossiers.map((d) => (
            <div
              key={d.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono break-all">{d.email}</h3>
                    {d.scanData?.identity.maskedEmail && (
                      <div className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 mt-0.5 flex items-center gap-1.5">
                        <span>{d.scanData.identity.maskedEmail}</span>
                        {d.scanData.identity.suffixIdentifier && (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-slate-800 px-1 rounded border border-emerald-200 dark:border-emerald-800">
                            ...{d.scanData.identity.suffixIdentifier}
                          </span>
                        )}
                      </div>
                    )}
                    {d.name && <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">{d.name}</p>}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1 flex-wrap">
                      {d.caseId && <span className="text-cyan-700 dark:text-cyan-400 font-semibold">{d.caseId}</span>}
                      {d.caseId && <span aria-hidden="true">·</span>}
                      <span>Saved {new Date(d.savedAt).toLocaleDateString()}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-cyan-600 dark:text-cyan-400">{d.tag || 'General Target'}</span>
                    </div>
                  </div>

                  {/* Risk Badge */}
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                      d.lastScore >= 50
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                        : d.lastScore >= 25
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
                    }`}
                  >
                    Risk {d.lastScore}/100
                  </span>
                </div>

                {/* Edit notes or view notes */}
                {editingId === d.id ? (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      value={tagEdit}
                      onChange={(e) => setTagEdit(e.target.value)}
                      placeholder="Case tag (e.g. Lead, Fraud, Phishing)..."
                      className="w-full p-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                    />
                    <textarea
                      value={noteEdit}
                      onChange={(e) => setNoteEdit(e.target.value)}
                      placeholder="Investigative findings and notes..."
                      rows={3}
                      className="w-full p-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(d.id)}
                        className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold rounded cursor-pointer"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs text-slate-700 dark:text-slate-300">
                    <div className="text-[10px] text-slate-500 uppercase font-mono mb-1 flex items-center justify-between">
                      <span>Investigative Notes</span>
                      <button
                        onClick={() => handleStartEdit(d)}
                        className="text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="line-clamp-3 italic">{d.notes || 'No notes added yet. Click edit to add findings.'}</p>
                  </div>
                )}
              </div>

              {/* Action row */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 dark:text-slate-400">
                  {d.platformsCount} platforms · {d.breachesCount} leaks
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onDeleteDossier(d.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove from dossiers"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSelectScan(d.scanData)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 rounded font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Dossier</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
          <Bookmark className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Saved Dossiers Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            When you run an intelligence search in the Reverse Lookup tab, click "Save Dossier" to file targets into your private case notebook.
          </p>
        </div>
      )}
    </div>
  );
};

import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Download, Upload, Trash2, FileJson, FileSpreadsheet, Shield, Share2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Cycle } from '../types';

interface SettingsViewProps {
  cycles: Cycle[];
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => Promise<number>;
  onImportJSON: (file: File) => Promise<number>;
  onClearAll: () => void;
  shareSummary?: string;
}

export function SettingsView({ cycles, onExportJSON, onExportCSV, onImportCSV, onImportJSON, onClearAll, shareSummary }: SettingsViewProps) {
  const [clearConfirm, setClearConfirm] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const count = await onImportCSV(file);
    setImportMsg(count > 0 ? `Imported ${count} cycle${count > 1 ? 's' : ''}` : 'No new cycles found');
    setTimeout(() => setImportMsg(null), 3000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-serif font-bold">Settings</h2>

      {/* Privacy */}
      <div className="glass rounded-3xl p-5 border border-emerald-500/10">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-emerald-400/70 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-sm">Your data is private</div>
            <p className="text-xs text-white/40 mt-1">
              Everything stays on your device. No accounts, no cloud, no tracking. We never see your data.
            </p>
          </div>
        </div>
      </div>

      {/* Data Info */}
      <div className="glass rounded-3xl p-5">
        <div className="text-xs text-white/40 uppercase tracking-wider font-medium">Data</div>
        <div className="text-lg font-semibold mt-1">{cycles.length} cycle{cycles.length !== 1 ? 's' : ''} logged</div>
        <p className="text-xs text-white/30 mt-1">All data stored locally on this device</p>
      </div>

      {/* Export */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 px-1">Export</h3>
        <button
          onClick={onExportJSON}
          disabled={!cycles.length}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors disabled:opacity-30"
        >
          <FileJson size={20} className="text-white/50" />
          <div className="text-left">
            <div className="text-sm font-medium">Export as JSON</div>
            <div className="text-xs text-white/40">Full backup with all data</div>
          </div>
          <Download size={16} className="text-white/30 ml-auto" />
        </button>
        <button
          onClick={onExportCSV}
          disabled={!cycles.length}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors disabled:opacity-30"
        >
          <FileSpreadsheet size={20} className="text-white/50" />
          <div className="text-left">
            <div className="text-sm font-medium">Export as CSV</div>
            <div className="text-xs text-white/40">For spreadsheets</div>
          </div>
          <Download size={16} className="text-white/30 ml-auto" />
        </button>
      </div>

      {/* Import */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 px-1">Import</h3>
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const count = await onImportJSON(file);
            setImportMsg(count > 0 ? `Imported ${count} cycle${count > 1 ? 's' : ''} with symptoms` : 'No new cycles found');
            setTimeout(() => setImportMsg(null), 3000);
            if (jsonInputRef.current) jsonInputRef.current.value = '';
          }}
          className="hidden"
        />
        <button
          onClick={() => jsonInputRef.current?.click()}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors"
        >
          <FileJson size={20} className="text-white/50" />
          <div className="text-left">
            <div className="text-sm font-medium">Import JSON</div>
            <div className="text-xs text-white/40">Restore from a backup file</div>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors"
        >
          <Upload size={20} className="text-white/50" />
          <div className="text-left">
            <div className="text-sm font-medium">Import CSV</div>
            <div className="text-xs text-white/40">Add cycles from a CSV file</div>
          </div>
        </button>
        {importMsg && (
          <p className="text-sm text-follicular text-center">{importMsg}</p>
        )}
      </div>

      {/* Share Summary */}
      {shareSummary && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 px-1">Share</h3>
          <button
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({ text: shareSummary });
                } catch { /* user cancelled */ }
              } else {
                await navigator.clipboard.writeText(shareSummary);
                setImportMsg('Summary copied to clipboard');
                setTimeout(() => setImportMsg(null), 3000);
              }
            }}
            className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors"
          >
            <Share2 size={20} className="text-white/50" />
            <div className="text-left">
              <div className="text-sm font-medium">Share Summary</div>
              <div className="text-xs text-white/40">Share current cycle status</div>
            </div>
          </button>
        </div>
      )}

      {/* Danger Zone */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-menstrual/60 px-1">Danger Zone</h3>
        <button
          onClick={() => setClearConfirm(true)}
          disabled={!cycles.length}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:bg-menstrual/10 transition-colors disabled:opacity-30 border-menstrual/20"
        >
          <Trash2 size={20} className="text-menstrual/60" />
          <div className="text-left">
            <div className="text-sm font-medium text-menstrual/80">Clear All Data</div>
            <div className="text-xs text-white/40">Permanently delete all cycles</div>
          </div>
        </button>
      </div>

      {/* Version */}
      <p className="text-center text-xs text-white/20 pt-4">Cycle Vault</p>

      <ConfirmDialog
        open={clearConfirm}
        title="Clear All Data"
        message="This will permanently delete all your cycle data. This cannot be undone."
        confirmLabel="Delete Everything"
        onConfirm={() => { onClearAll(); setClearConfirm(false); }}
        onCancel={() => setClearConfirm(false)}
      />
    </motion.div>
  );
}

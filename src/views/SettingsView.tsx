import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Upload, Trash2, FileJson, FileSpreadsheet, Shield, Share2, RefreshCw, Check } from 'lucide-react';
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
  customCycleLength: number | undefined;
  onSetCycleLength: (v: number | undefined) => void;
  computedCycleLength: number | undefined;
}

export function SettingsView({ cycles, onExportJSON, onExportCSV, onImportCSV, onImportJSON, onClearAll, shareSummary, customCycleLength, onSetCycleLength, computedCycleLength }: SettingsViewProps) {
  const [clearConfirm, setClearConfirm] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Cycle length input — raw string to avoid mid-type clamping
  const [cycleLengthInput, setCycleLengthInput] = useState(customCycleLength?.toString() ?? '');
  const [cycleSaved, setCycleSaved] = useState(false);
  const cycleSavedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Keep input in sync if parent resets the value
  useEffect(() => {
    setCycleLengthInput(customCycleLength?.toString() ?? '');
  }, [customCycleLength]);

  const isCycleDirty = cycleLengthInput !== (customCycleLength?.toString() ?? '');

  const saveCycleLength = useCallback(() => {
    const v = parseInt(cycleLengthInput, 10);
    if (cycleLengthInput === '') {
      onSetCycleLength(undefined);
    } else if (!isNaN(v)) {
      const clamped = Math.min(60, Math.max(15, v));
      setCycleLengthInput(clamped.toString());
      onSetCycleLength(clamped);
    }
    setCycleSaved(true);
    clearTimeout(cycleSavedTimer.current);
    cycleSavedTimer.current = setTimeout(() => setCycleSaved(false), 2000);
  }, [cycleLengthInput, onSetCycleLength]);

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

      {/* Cycle Length */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 px-1">Cycle</h3>
        <div className="glass rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Average cycle length</div>
              <div className="text-xs text-white/40 mt-0.5">
                {computedCycleLength
                  ? `Computed from your data: ${computedCycleLength} days`
                  : 'Used until enough cycles are logged'}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={15}
                max={60}
                value={cycleLengthInput}
                onChange={e => setCycleLengthInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveCycleLength()}
                placeholder="28"
                className="w-16 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-sm text-center text-white/80 focus:outline-none focus:border-accent/40"
              />
              <span className="text-xs text-white/40">days</span>
            </div>
          </div>

          {/* Save / Saved feedback */}
          <div className="flex items-center justify-between">
            <AnimatePresence mode="wait">
              {cycleSaved ? (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-1.5 text-accent/70 text-xs font-medium"
                >
                  <Check size={13} />
                  Saved
                </motion.div>
              ) : isCycleDirty ? (
                <motion.button
                  key="save-btn"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  onClick={saveCycleLength}
                  className="px-4 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-xs font-medium text-white hover:bg-accent/30 transition-colors"
                >
                  Save
                </motion.button>
              ) : customCycleLength ? (
                <button
                  onClick={() => { onSetCycleLength(undefined); setCycleLengthInput(''); }}
                  className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  <RefreshCw size={12} />
                  Reset to default (28)
                </button>
              ) : <span />}
            </AnimatePresence>
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
            <div className="text-xs text-white/40">Full backup — includes symptoms, notes &amp; history</div>
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
            <div className="text-xs text-white/40">Symptoms, notes &amp; cycle dates — opens in Excel</div>
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
      <p className="text-center text-xs text-white/20 pt-4">cycle vault</p>

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

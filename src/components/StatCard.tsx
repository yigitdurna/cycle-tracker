interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="glass rounded-3xl p-5 flex-1 flex flex-col gap-3">
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
        <Icon size={16} className="text-white/70" />
      </div>
      <div>
        <div className="text-xs text-white/40 uppercase tracking-wider font-medium">{label}</div>
        <div className="text-xl font-semibold mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export default function EmergencyHub({ isSos = false }) {
  const contacts = [
    {
      name: 'National Emergency',
      number: '112',
      tel: 'tel:112',
      badge: 'All Services',
      icon: '🚨',
      bg: isSos ? 'bg-rose-600 hover:bg-rose-500' : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/40',
    },
    {
      name: 'Police Assistance',
      number: '100',
      tel: 'tel:100',
      badge: 'Immediate Response',
      icon: '👮',
      bg: isSos ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border-blue-500/40',
    },
    {
      name: "Women's Helpline",
      number: '1091',
      tel: 'tel:1091',
      badge: '24/7 Safety Desk',
      icon: '🛡️',
      bg: isSos ? 'bg-rose-700 hover:bg-rose-600' : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border-purple-500/40',
    },
    {
      name: 'Ambulance & Medical',
      number: '102',
      tel: 'tel:102',
      badge: 'Medical Emergency',
      icon: '🚑',
      bg: isSos ? 'bg-red-800 hover:bg-red-700' : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-500/40',
    },
  ];

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 transition-all duration-500 ${
        isSos
          ? 'glass-card-sos border-2 border-rose-500/80 shadow-2xl shadow-rose-600/35 animate-pulse'
          : 'glass-card'
      }`}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{isSos ? '🚨' : '📞'}</span>
          <div>
            <h3 className={`text-base font-extrabold tracking-tight ${isSos ? 'text-white' : 'text-slate-100'}`}>
              {isSos ? 'Emergency Assistance Hub — Immediate Call' : 'Emergency Quick-Dial Hub'}
            </h3>
            <p className={`text-xs ${isSos ? 'text-rose-200 font-bold' : 'text-slate-400'}`}>
              {isSos ? 'Tap any number below to connect with emergency dispatch instantly' : 'One-tap direct dial to emergency response helplines'}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            isSos
              ? 'bg-white text-rose-700 shadow-md font-black'
              : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
          }`}
        >
          {isSos ? 'SOS DISPATCH' : 'Direct Line'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {contacts.map((c) => (
          <a
            key={c.number}
            href={c.tel}
            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all duration-200 active:scale-95 text-decoration-none group shadow-xs ${
              isSos
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-white/40 shadow-lg shadow-rose-600/30 hover:brightness-110'
                : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-100 border-slate-700/70 hover:border-indigo-500/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{c.icon}</span>
              <div>
                <span className="block text-xs font-bold leading-tight">{c.name}</span>
                <span className="text-[10px] opacity-75 font-medium">{c.badge}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg ${
                  isSos ? 'bg-black/30 text-white' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                {c.number}
              </span>
              <svg
                className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

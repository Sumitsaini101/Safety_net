export default function EmergencyHub({ isSos = false }) {
  const contacts = [
    {
      name: 'National Emergency',
      number: '112',
      tel: 'tel:112',
      badge: 'All Services Dispatch',
      icon: '🚨',
      border: isSos ? 'border-rose-300 bg-rose-50/80 text-rose-900' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-900',
    },
    {
      name: 'Police Assistance',
      number: '100',
      tel: 'tel:100',
      badge: 'Immediate Response',
      icon: '👮',
      border: isSos ? 'border-rose-300 bg-rose-50/80 text-rose-900' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-900',
    },
    {
      name: "Women's Helpline",
      number: '1091',
      tel: 'tel:1091',
      badge: '24/7 Safety Desk',
      icon: '🛡️',
      border: isSos ? 'border-rose-300 bg-rose-50/80 text-rose-900' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-900',
    },
    {
      name: 'Ambulance & Medical',
      number: '102',
      tel: 'tel:102',
      badge: 'Medical Emergency',
      icon: '🚑',
      border: isSos ? 'border-rose-300 bg-rose-50/80 text-rose-900' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-900',
    },
  ];

  return (
    <div
      className={`rounded-2xl p-6 sm:p-7 transition-all duration-300 ${
        isSos
          ? 'saas-card-sos bg-rose-50 border-2 border-rose-400 shadow-md'
          : 'saas-card'
      }`}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{isSos ? '🚨' : '📞'}</span>
          <div>
            <h3 className={`text-base font-extrabold tracking-tight ${isSos ? 'text-rose-950' : 'text-slate-900'}`}>
              {isSos ? 'Emergency Assistance Hub — Immediate Dispatch' : 'Emergency Quick-Dial Hub'}
            </h3>
            <p className={`text-xs font-medium ${isSos ? 'text-rose-700' : 'text-slate-500'}`}>
              {isSos ? 'Tap any number below to connect with emergency services immediately' : 'Direct tel: links to verified emergency services and helplines'}
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
            isSos
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          }`}
        >
          {isSos ? 'SOS PRIORITY' : 'Verified Hub'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {contacts.map((c) => (
          <a
            key={c.number}
            href={c.tel}
            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all duration-150 active:scale-95 text-decoration-none shadow-2xs hover:shadow-xs ${c.border}`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{c.icon}</span>
              <div>
                <span className="block text-xs font-bold leading-tight">{c.name}</span>
                <span className="text-[10px] text-slate-500 font-medium">{c.badge}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-2 py-1 rounded-md border border-slate-200">
                {c.number}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

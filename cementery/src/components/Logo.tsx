export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center shadow-lg">
          <img src="/icon_white.png" alt="CemeteryHub Logo" className="w-8 h-8" />
        </div>
      </div>
      <div>
        <h1 className="leading-tight font-bold text-lg text-white">CemeteryHub</h1>
        <p className="text-slate-300 text-sm">System Zarządzania Cmentarzem</p>
      </div>
    </div>
  );
}

import { MapPin, Cross } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center shadow-lg">
          <MapPin className="size-6 text-white absolute" />
          <Cross className="size-4 text-slate-300 absolute top-1 right-1" />
        </div>
      </div>
      <div>
        <h1 className="leading-tight">Eternal Rest Cemetery</h1>
        <p className="text-slate-300 text-sm">Location & Services Management</p>
      </div>
    </div>
  );
}

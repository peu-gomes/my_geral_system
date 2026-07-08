import Link from 'next/link';
import { Layers, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200/50 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white mx-auto shadow-lg">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">404</h1>
          <h2 className="text-sm font-bold text-slate-800">Página Não Encontrada</h2>
          <p className="text-xs text-slate-400 font-mono">
            O caminho que você tentou acessar não existe ou foi removido.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

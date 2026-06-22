import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-mesh gradient-surface flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-br from-brand-200/30 to-brand-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-brand-300/20 rounded-full blur-3xl animate-float [animation-delay:-3s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-emerald-200/20 to-teal-300/20 rounded-full blur-3xl animate-float [animation-delay:-1.5s]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-fade-up">
          <h1 className="text-4xl font-display font-extrabold text-gradient tracking-tight">
            RideHail
          </h1>
          <p className="text-surface-400 mt-2 text-sm font-medium">
            Your premium ride experience
          </p>
        </div>
        <div className="glass-strong rounded-3xl p-6 sm:p-8 shadow-elevated animate-fade-up">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-display font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-slate-300">Welcome to your Dynasty Trader dashboard.</p>
        
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card">
            <h3 className="text-lg font-medium text-white">Active Characters</h3>
            <p className="mt-2 text-3xl font-bold text-dynasty-400">0</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-white">Dynasty Wealth</h3>
            <p className="mt-2 text-3xl font-bold text-dynasty-400">0</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-white">Generation</h3>
            <p className="mt-2 text-3xl font-bold text-dynasty-400">1</p>
          </div>
        </div>
      </div>
    </div>
  );
}
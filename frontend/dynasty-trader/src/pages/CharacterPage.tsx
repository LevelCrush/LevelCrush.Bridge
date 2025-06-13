export default function CharacterPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-display font-bold text-white">Character</h1>
        <p className="mt-2 text-slate-300">Manage your dynasty's characters.</p>
        
        <div className="mt-8">
          <div className="card">
            <p className="text-slate-400">No active characters. Create your first character to begin trading.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
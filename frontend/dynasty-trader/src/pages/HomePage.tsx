import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  BanknotesIcon,
  TrophyIcon,
  SparklesIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Dynasty Building',
    description: 'Create and manage a multi-generational trading empire that persists through character deaths.',
    icon: UserGroupIcon,
  },
  {
    name: 'Regional Markets',
    description: 'Navigate distinct regional economies with unique supply, demand, and pricing dynamics.',
    icon: ChartBarIcon,
  },
  {
    name: 'Permadeath Economy',
    description: 'Character deaths create market shocks and opportunities. Death drives the economy.',
    icon: BanknotesIcon,
  },
  {
    name: 'Ghost Markets',
    description: 'Deceased characters continue to influence markets through automated ghost listings.',
    icon: SparklesIcon,
  },
  {
    name: 'Risk & Reward',
    description: 'Balance safe local trades against risky but profitable long-distance commerce.',
    icon: TrophyIcon,
  },
  {
    name: 'Living Economy',
    description: 'Real-time market events, seasonal changes, and player-driven economic cycles.',
    icon: ShieldCheckIcon,
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Hero section */}
      <div className="relative pb-16 pt-6 sm:pb-24">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              <span className="block">Build Your</span>
              <span className="block text-dynasty-400">Trading Dynasty</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base text-slate-300 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
              A roguelike economy game where death drives markets. Build a multi-generational trading empire, 
              navigate regional economies, and leave your mark even after death.
            </p>
            <div className="mx-auto mt-5 max-w-md sm:flex sm:justify-center md:mt-8">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="flex w-full items-center justify-center rounded-md bg-dynasty-600 px-8 py-3 text-base font-medium text-white hover:bg-dynasty-700 md:py-4 md:px-10 md:text-lg"
                >
                  Enter Dynasty
                </Link>
              ) : (
                <>
                  <div className="rounded-md shadow">
                    <Link
                      to="/register"
                      className="flex w-full items-center justify-center rounded-md bg-dynasty-600 px-8 py-3 text-base font-medium text-white hover:bg-dynasty-700 md:py-4 md:px-10 md:text-lg"
                    >
                      Start Your Dynasty
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      to="/login"
                      className="flex w-full items-center justify-center rounded-md bg-slate-700 px-8 py-3 text-base font-medium text-white hover:bg-slate-600 md:py-4 md:px-10 md:text-lg"
                    >
                      Sign In
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Features section */}
      <div className="relative bg-slate-800 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold text-white sm:text-4xl">
              A New Kind of Economy Game
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-xl text-slate-300">
              Where every death creates opportunity and every trade builds legacy
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="card">
                  <div className="flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-dynasty-600">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-white">{feature.name}</h3>
                  </div>
                  <p className="mt-2 text-base text-slate-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-dynasty-700">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:flex lg:items-center lg:justify-between lg:px-8 lg:py-16">
          <h2 className="text-3xl font-display font-bold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to build your legacy?</span>
            <span className="block text-dynasty-300">Start your dynasty today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            {!isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-base font-medium text-dynasty-700 hover:bg-dynasty-50"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
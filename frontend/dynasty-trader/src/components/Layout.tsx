import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { 
  HomeIcon, 
  UserIcon, 
  ChartBarIcon, 
  UsersIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Skull } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon, public: true },
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Character', href: '/character', icon: UserIcon },
  { name: 'Market', href: '/market', icon: ChartBarIcon },
  { name: 'Dynasty', href: '/dynasty', icon: UsersIcon },
  { name: 'Deaths', href: '/deaths', icon: Skull },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredNavigation = navigation.filter(
    item => item.public || isAuthenticated
  );

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to="/" className="text-2xl font-display font-semibold text-dynasty-400">
                  Dynasty Trader
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {filteredNavigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={clsx(
                          isActive
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                          'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
                        )}
                      >
                        <item.icon
                          className={clsx(
                            isActive ? 'text-dynasty-400' : 'text-slate-400',
                            'mr-3 h-5 w-5 flex-shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <div className="flex items-center space-x-4">
                  {isConnected && (
                    <div className="flex items-center space-x-1">
                      <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs text-slate-400">Live</span>
                    </div>
                  )}
                  
                  {isAuthenticated ? (
                    <>
                      <span className="text-sm text-slate-300">
                        {user?.username}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="text-slate-300 hover:text-white p-2"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <Link
                        to="/login"
                        className="text-slate-300 hover:text-white text-sm font-medium"
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/register"
                        className="bg-dynasty-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-dynasty-700"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                      'group flex items-center px-3 py-2 text-base font-medium rounded-md'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon
                      className={clsx(
                        isActive ? 'text-dynasty-400' : 'text-slate-400',
                        'mr-3 h-5 w-5 flex-shrink-0'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-slate-700 pb-3 pt-4">
              {isAuthenticated ? (
                <div className="px-5">
                  <div className="text-base font-medium text-white">{user?.username}</div>
                  <div className="text-sm font-medium text-slate-400">{user?.email}</div>
                  <button
                    onClick={handleLogout}
                    className="mt-3 flex items-center text-sm font-medium text-slate-300 hover:text-white"
                  >
                    <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="px-5 space-y-3">
                  <Link
                    to="/login"
                    className="block text-base font-medium text-slate-300 hover:text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="block bg-dynasty-600 text-white px-4 py-2 rounded-md text-base font-medium hover:bg-dynasty-700 text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
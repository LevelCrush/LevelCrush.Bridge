import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function DiscordLinkPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<'linking' | 'success' | 'error'>('linking');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  // Add a small delay to ensure everything is loaded
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const linkMutation = useMutation({
    mutationFn: async ({ discordId, discordUsername }: { discordId: string; discordUsername: string }) => {
      return await api.post<{
        success: boolean;
        message: string;
        discord_id?: string;
        discord_username?: string;
      }>('/users/link-discord', {
        user_id: user?.id,
        discord_id: discordId,
        discord_username: discordUsername
      });
    },
    onSuccess: (data) => {
      setStatus('success');
      // Update user context
      if (user) {
        updateUser({
          ...user,
          discord_id: data.discord_id,
          discord_username: data.discord_username
        });
      }
      // Redirect to settings after a short delay
      setTimeout(() => {
        navigate('/settings');
      }, 2000);
    },
    onError: (error: any) => {
      setStatus('error');
      setErrorMessage(error.response?.data?.message || 'Failed to link Discord account');
    }
  });

  useEffect(() => {
    // Wait for auth to load and app to be ready
    if (authLoading || !isReady) {
      return;
    }

    const discordId = searchParams.get('discord_id');
    const discordUsername = searchParams.get('discord_username');
    const state = searchParams.get('state');

    if (!user) {
      // User not logged in, redirect to login with return URL
      const returnUrl = `/discord-link?${searchParams.toString()}`;
      navigate(`/login?return=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (discordId && state) {
      // Attempt to link the account
      linkMutation.mutate({ discordId, discordUsername: discordUsername || '' });
    } else {
      setStatus('error');
      setErrorMessage('Invalid link parameters');
    }
  }, [user, searchParams, navigate, authLoading, isReady]);

  // Show loading state while auth is loading or app is initializing
  if (authLoading || !isReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="card max-w-md w-full">
          <div className="flex flex-col items-center space-y-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-dynasty-500" />
            <p className="text-sm text-slate-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Discord Account Linking</h2>
          <p className="text-sm text-slate-400">
            Connecting your Discord account to Dynasty Trader
          </p>
        </div>

        <div className="border-t border-slate-700 pt-4">
          {status === 'linking' && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-dynasty-500" />
              <p className="text-sm text-slate-400">
                Linking your Discord account...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 text-center">
                <p className="text-sm">
                  Discord account linked successfully! Redirecting to settings...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-center">
                <p className="text-sm">
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="btn-secondary"
              >
                Return to Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
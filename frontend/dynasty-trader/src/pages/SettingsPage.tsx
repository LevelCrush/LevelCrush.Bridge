import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface DiscordLinkStatus {
  linked: boolean;
  discord_id?: string;
  discord_username?: string;
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [isLinking, setIsLinking] = useState(false);

  // Check Discord link status
  const { data: linkStatus, refetch: refetchStatus } = useQuery<DiscordLinkStatus>({
    queryKey: ['discord-link-status', user?.discord_id],
    queryFn: async () => {
      // For now, check if user has discord_id
      return {
        linked: !!user?.discord_id,
        discord_id: user?.discord_id,
        discord_username: user?.discord_username
      };
    },
    // Re-fetch when user changes
    enabled: !!user
  });

  // Link Discord account
  const linkMutation = useMutation({
    mutationFn: async (discordId: string) => {
      return await api.post<{
        success: boolean;
        message: string;
        discord_id?: string;
        discord_username?: string;
      }>('/users/link-discord', {
        user_id: user?.id,
        discord_id: discordId
      });
    },
    onSuccess: (data) => {
      toast.success('Discord account linked successfully!');
      // Update user context
      if (user) {
        updateUser({
          ...user,
          discord_id: data.discord_id,
          discord_username: data.discord_username
        });
      }
      setIsLinking(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to link Discord account');
    }
  });

  // Unlink Discord account
  const unlinkMutation = useMutation({
    mutationFn: async () => {
      return await api.post<{
        success: boolean;
        message: string;
        discord_id?: string;
        discord_username?: string;
      }>('/users/unlink-discord');
    },
    onSuccess: () => {
      toast.success('Discord account unlinked successfully!');
      // Update user context - ensure we clear the Discord fields
      if (user) {
        const updatedUser = {
          ...user,
          discord_id: undefined,
          discord_username: undefined
        };
        updateUser(updatedUser);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unlink Discord account');
    }
  });

  // Handle Discord linking from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordId = params.get('discord_id');
    const discordUsername = params.get('discord_username');
    const state = params.get('state');

    if (discordId && state) {
      // Verify state and link account
      linkMutation.mutate(discordId);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      {/* Discord Integration Card */}
      <div className="card mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
            <MessageSquare className="h-5 w-5" />
            Discord Integration
          </h2>
          <p className="text-sm text-slate-400">
            Connect your Discord account to use Dynasty Trader commands in Discord
          </p>
        </div>

        <div className="border-t border-slate-700 pt-4">
          {linkStatus?.linked ? (
            <div className="space-y-4">
              <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">
                    Connected as <strong>{linkStatus.discord_username || linkStatus.discord_id}</strong>
                  </span>
                </div>
              </div>
              <button
                className="btn-secondary"
                onClick={() => unlinkMutation.mutate()}
                disabled={unlinkMutation.isPending}
              >
                {unlinkMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Unlinking...
                  </>
                ) : (
                  'Unlink Discord Account'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {isLinking ? (
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="font-medium mb-2">To complete the linking process:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-slate-300">
                    <li>Open Discord and find the Dynasty Trader bot</li>
                    <li>Use the <code className="bg-slate-800 px-1 py-0.5 rounded">/link</code> command</li>
                    <li>The bot will provide you with a link to click</li>
                  </ol>
                  <button
                    className="btn-secondary mt-3"
                    onClick={() => setIsLinking(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLinking(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Link Discord Account
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account Information Card */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Account Information</h2>
          <p className="text-sm text-slate-400">Your account details</p>
        </div>

        <div className="border-t border-slate-700 pt-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-400">Username</p>
            <p className="text-base">{user?.username}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Email</p>
            <p className="text-base">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Account Created</p>
            <p className="text-base">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
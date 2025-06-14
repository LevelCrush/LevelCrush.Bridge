import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useCharacterDeathListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleCharacterDeath = (event: CustomEvent) => {
      // Invalidate queries that might be affected by character death
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['dynasty'] });
      queryClient.invalidateQueries({ queryKey: ['dynasty-stats'] });
      
      // If it's the currently selected character, we might need to clear selection
      const characterId = event.detail.characterId;
      const selectedCharacterId = localStorage.getItem('selectedCharacterId');
      
      if (selectedCharacterId === characterId) {
        localStorage.removeItem('selectedCharacterId');
        // Trigger a re-render of components using character selection
        window.dispatchEvent(new Event('storage'));
      }
    };

    window.addEventListener('character-death-processed', handleCharacterDeath as EventListener);

    return () => {
      window.removeEventListener('character-death-processed', handleCharacterDeath as EventListener);
    };
  }, [queryClient]);
}
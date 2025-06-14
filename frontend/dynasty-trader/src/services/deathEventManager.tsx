import { createRoot } from 'react-dom/client';
import { DeathNotification } from '@/components/DeathNotification';
import { InheritanceModal } from '@/components/InheritanceModal';
import { CharacterDeathData } from '@/types';
import { characterService } from '@/services/character';
import { dynastyService } from '@/services/dynasty';
import { storage } from '@/lib/storage';

class DeathEventManager {
  private activeNotifications: Set<string> = new Set();
  private notificationContainer: HTMLDivElement | null = null;

  constructor() {
    this.initializeContainer();
  }

  private initializeContainer() {
    // Create or get the notification container
    let container = document.getElementById('death-notifications') as HTMLDivElement;
    if (!container) {
      container = document.createElement('div');
      container.id = 'death-notifications';
      container.className = 'fixed top-0 right-0 z-50 pointer-events-none';
      document.body.appendChild(container);
    }
    this.notificationContainer = container;
  }

  async handleCharacterDeath(deathData: CharacterDeathData) {
    // Prevent duplicate notifications
    if (this.activeNotifications.has(deathData.character_id)) {
      return;
    }
    this.activeNotifications.add(deathData.character_id);

    // Check if this is the user's character
    const isUserCharacter = await this.checkIfUserCharacter(deathData.character_id);

    if (isUserCharacter) {
      // Show detailed inheritance modal for user's characters
      await this.showInheritanceModal(deathData);
    } else {
      // Show notification for other players' deaths
      this.showDeathNotification(deathData);
    }
  }

  private async checkIfUserCharacter(characterId: string): Promise<boolean> {
    try {
      const user = storage.getUser();
      if (!user) return false;

      // Get user's dynasty
      const dynasty = await dynastyService.getMyDynasty();
      if (!dynasty) return false;

      // Get dynasty characters
      const characters = await characterService.getDynastyCharacters();
      return characters.some(char => char.id === characterId);
    } catch (error) {
      console.error('Error checking character ownership:', error);
      return false;
    }
  }

  private showDeathNotification(deathData: CharacterDeathData) {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'pointer-events-auto';
    this.notificationContainer?.appendChild(notificationDiv);

    const root = createRoot(notificationDiv);
    
    const handleClose = () => {
      root.unmount();
      notificationDiv.remove();
      this.activeNotifications.delete(deathData.character_id);
    };

    root.render(
      <DeathNotification 
        deathData={deathData} 
        onClose={handleClose}
      />
    );
  }

  private async showInheritanceModal(deathData: CharacterDeathData) {
    try {
      // Fetch additional inheritance details
      const inheritanceDetails = await this.fetchInheritanceDetails(deathData);

      const modalDiv = document.createElement('div');
      modalDiv.className = 'pointer-events-auto';
      document.body.appendChild(modalDiv);

      const root = createRoot(modalDiv);
      
      const handleClose = () => {
        root.unmount();
        modalDiv.remove();
        this.activeNotifications.delete(deathData.character_id);
        
        // Refresh character list after viewing inheritance
        window.dispatchEvent(new CustomEvent('character-death-processed', {
          detail: { characterId: deathData.character_id }
        }));
      };

      root.render(
        <InheritanceModal
          isOpen={true}
          onClose={handleClose}
          inheritanceData={inheritanceDetails}
        />
      );
    } catch (error) {
      console.error('Error showing inheritance modal:', error);
      // Fall back to simple notification
      this.showDeathNotification(deathData);
    }
  }

  private async fetchInheritanceDetails(deathData: CharacterDeathData) {
    // For now, we'll construct the data from what we have
    // In a real implementation, this would fetch from an API endpoint
    const deathTax = parseFloat(deathData.wealth) * 0.1;
    const netInheritance = parseFloat(deathData.wealth) - deathTax;

    // Get living characters in the dynasty to determine heirs
    const characters = await characterService.getDynastyCharacters();
    const livingCharacters = characters.filter(char => !char.death_date);

    // Simulate heir distribution
    const heirs = livingCharacters
      .filter(char => char.id !== deathData.character_id)
      .slice(0, 3) // Show up to 3 heirs
      .map(char => ({
        id: char.id,
        name: char.name,
        relationship: 'Dynasty Member', // Could be enhanced with actual relationships
        inheritanceAmount: netInheritance / Math.max(livingCharacters.length - 1, 1)
      }));

    return {
      characterName: deathData.character_name,
      characterAge: deathData.age,
      dynastyName: deathData.dynasty_name,
      deathCause: deathData.death_cause,
      totalWealth: parseFloat(deathData.wealth),
      deathTax,
      netInheritance,
      heirs,
      dynastyTreasuryAmount: heirs.length === 0 ? netInheritance : 0,
      marketImpact: {
        affectedRegions: deathData.market_impact.affected_regions,
        ghostListingsCreated: deathData.market_impact.ghost_listings_created
      }
    };
  }
}

// Create singleton instance
export const deathEventManager = new DeathEventManager();
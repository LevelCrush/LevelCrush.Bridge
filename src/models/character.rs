use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Character {
    pub id: Uuid,
    pub dynasty_id: Uuid,
    pub name: String,
    pub birth_date: DateTime<Utc>,
    pub death_date: Option<DateTime<Utc>>,
    pub death_cause: Option<String>,
    pub health: i32,
    pub stamina: i32,
    pub charisma: i32,
    pub intelligence: i32,
    pub luck: i32,
    pub location_id: Option<Uuid>,
    pub is_alive: bool,
    pub generation: i32,
    pub parent_character_id: Option<Uuid>,
    pub inheritance_received: rust_decimal::Decimal,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Character {
    /// Calculate the current age of the character
    pub fn age(&self) -> i32 {
        let end_date = self.death_date.unwrap_or_else(Utc::now);
        let years = end_date.signed_duration_since(self.birth_date).num_days() / 365;
        years as i32
    }

    /// Check if the character should die of old age
    pub fn should_die_of_old_age(&self) -> bool {
        if !self.is_alive {
            return false;
        }

        let age = self.age();
        
        // Base death chance increases with age
        let base_death_chance = match age {
            0..=30 => 0.0,
            31..=50 => 0.001,
            51..=60 => 0.01,
            61..=70 => 0.05,
            71..=80 => 0.15,
            81..=90 => 0.30,
            91..=100 => 0.50,
            _ => 0.80,
        };

        // Health modifier
        let health_modifier = (100 - self.health) as f64 / 200.0;
        
        // Final death chance
        let death_chance = base_death_chance + health_modifier;
        
        // Random check
        rand::random::<f64>() < death_chance
    }

    /// Apply aging effects to the character
    pub fn apply_aging_effects(&mut self) {
        let age = self.age();
        
        // Health degradation
        if age > 40 {
            let health_loss = ((age - 40) as f64 * 0.1).min(2.0) as i32;
            self.health = (self.health - health_loss).max(0);
        }
        
        // Stamina degradation
        if age > 30 {
            let stamina_loss = ((age - 30) as f64 * 0.15).min(3.0) as i32;
            self.stamina = (self.stamina - stamina_loss).max(0);
        }
        
        // Charisma changes (peaks in middle age)
        if age >= 25 && age <= 55 {
            self.charisma = (self.charisma + 1).min(100);
        } else if age > 70 {
            self.charisma = (self.charisma - 1).max(0);
        }
        
        // Intelligence increases with age (wisdom)
        if age >= 20 && age <= 70 {
            if rand::random::<f64>() < 0.3 {
                self.intelligence = (self.intelligence + 1).min(100);
            }
        }
    }

    /// Calculate the character's trading bonus based on stats
    pub fn trading_bonus(&self) -> f64 {
        let charisma_bonus = self.charisma as f64 / 100.0 * 0.3;
        let intelligence_bonus = self.intelligence as f64 / 100.0 * 0.3;
        let luck_bonus = self.luck as f64 / 100.0 * 0.2;
        let health_penalty = if self.health < 50 {
            (50 - self.health) as f64 / 100.0 * 0.2
        } else {
            0.0
        };
        
        charisma_bonus + intelligence_bonus + luck_bonus - health_penalty
    }

    /// Calculate inheritance amount based on wealth
    pub fn calculate_inheritance(&self, total_wealth: rust_decimal::Decimal) -> rust_decimal::Decimal {
        use rust_decimal::Decimal;
        use std::str::FromStr;
        
        // Base inheritance is 80% of wealth
        let inheritance_rate = Decimal::from_str("0.8").unwrap();
        
        // Reputation bonus (up to 10% extra)
        let reputation_bonus = Decimal::from_str("0.1").unwrap(); // TODO: Calculate from actual reputation
        
        total_wealth * (inheritance_rate + reputation_bonus)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCharacterRequest {
    pub dynasty_id: Uuid,
    pub name: String,
    pub parent_character_id: Option<Uuid>,
    pub starting_location_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterDeathRequest {
    pub death_cause: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterStats {
    pub character_id: Uuid,
    pub name: String,
    pub age: i32,
    pub health: i32,
    pub stamina: i32,
    pub charisma: i32,
    pub intelligence: i32,
    pub luck: i32,
    pub trading_bonus: f64,
    pub location: Option<String>,
    pub wealth: rust_decimal::Decimal,
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;

    fn create_test_character() -> Character {
        Character {
            id: Uuid::new_v4(),
            dynasty_id: Uuid::new_v4(),
            name: "Test Character".to_string(),
            birth_date: Utc::now() - Duration::days(365 * 25), // 25 years old
            death_date: None,
            death_cause: None,
            health: 100,
            stamina: 100,
            charisma: 50,
            intelligence: 50,
            luck: 50,
            location_id: None,
            is_alive: true,
            generation: 1,
            parent_character_id: None,
            inheritance_received: rust_decimal::Decimal::ZERO,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    #[test]
    fn test_age_calculation() {
        let mut character = create_test_character();
        assert_eq!(character.age(), 25);
        
        // Test with death date
        character.death_date = Some(character.birth_date + Duration::days(365 * 50));
        assert_eq!(character.age(), 50);
    }

    #[test]
    fn test_trading_bonus() {
        let character = create_test_character();
        let bonus = character.trading_bonus();
        assert!(bonus >= 0.0 && bonus <= 1.0);
        
        // Test with max stats
        let mut max_character = character.clone();
        max_character.charisma = 100;
        max_character.intelligence = 100;
        max_character.luck = 100;
        assert_eq!(max_character.trading_bonus(), 0.8); // 0.3 + 0.3 + 0.2
    }

    #[test]
    fn test_aging_effects() {
        let mut character = create_test_character();
        character.birth_date = Utc::now() - Duration::days(365 * 50); // 50 years old
        let original_health = character.health;
        let original_stamina = character.stamina;
        
        character.apply_aging_effects();
        
        assert!(character.health < original_health);
        assert!(character.stamina < original_stamina);
    }
}
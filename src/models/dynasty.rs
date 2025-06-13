use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Dynasty {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub motto: Option<String>,
    pub founded_at: DateTime<Utc>,
    pub generation: i32,
    pub total_wealth: rust_decimal::Decimal,
    pub reputation: i32,
    pub legacy_points: i32,
    pub is_active: bool,
}

impl Dynasty {
    /// Calculate dynasty prestige based on various factors
    pub fn calculate_prestige(&self) -> i32 {
        let wealth_prestige = (self.total_wealth.to_string().parse::<f64>().unwrap_or(0.0) / 10000.0) as i32;
        let generation_prestige = self.generation * 10;
        let reputation_prestige = self.reputation / 10;
        let legacy_prestige = self.legacy_points;
        
        wealth_prestige + generation_prestige + reputation_prestige + legacy_prestige
    }

    /// Check if dynasty qualifies for special perks
    pub fn get_perks(&self) -> Vec<DynastyPerk> {
        let mut perks = Vec::new();
        
        if self.generation >= 5 {
            perks.push(DynastyPerk::AncientLineage);
        }
        
        if self.reputation >= 1000 {
            perks.push(DynastyPerk::Renowned);
        }
        
        if self.total_wealth > rust_decimal::Decimal::from(1000000) {
            perks.push(DynastyPerk::Wealthy);
        }
        
        if self.legacy_points >= 100 {
            perks.push(DynastyPerk::Legendary);
        }
        
        perks
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DynastyPerk {
    AncientLineage,  // 5+ generations
    Renowned,        // 1000+ reputation
    Wealthy,         // 1M+ wealth
    Legendary,       // 100+ legacy points
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateDynastyRequest {
    pub name: String,
    pub motto: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DynastyStats {
    pub id: Uuid,
    pub name: String,
    pub motto: Option<String>,
    pub generation: i32,
    pub total_wealth: rust_decimal::Decimal,
    pub reputation: i32,
    pub legacy_points: i32,
    pub prestige: i32,
    pub perks: Vec<DynastyPerk>,
    pub active_characters: i32,
    pub total_characters: i32,
    pub founded_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DynastyAlliance {
    pub id: Uuid,
    pub name: String,
    pub founded_by_dynasty_id: Uuid,
    pub founded_at: DateTime<Utc>,
    pub reputation: i32,
    pub treasury: rust_decimal::Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AllianceMembership {
    pub id: Uuid,
    pub dynasty_id: Uuid,
    pub alliance_id: Uuid,
    pub joined_at: DateTime<Utc>,
    pub role: String,
    pub contribution_total: rust_decimal::Decimal,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    fn create_test_dynasty() -> Dynasty {
        Dynasty {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            name: "House Test".to_string(),
            motto: Some("Testing is Power".to_string()),
            founded_at: Utc::now(),
            generation: 1,
            total_wealth: rust_decimal::Decimal::from(10000),
            reputation: 100,
            legacy_points: 10,
            is_active: true,
        }
    }

    #[test]
    fn test_calculate_prestige() {
        let dynasty = create_test_dynasty();
        let prestige = dynasty.calculate_prestige();
        assert!(prestige > 0);
    }

    #[test]
    fn test_dynasty_perks() {
        let mut dynasty = create_test_dynasty();
        
        // Test Ancient Lineage
        dynasty.generation = 5;
        assert!(dynasty.get_perks().contains(&DynastyPerk::AncientLineage));
        
        // Test Renowned
        dynasty.reputation = 1000;
        assert!(dynasty.get_perks().contains(&DynastyPerk::Renowned));
        
        // Test Wealthy
        dynasty.total_wealth = rust_decimal::Decimal::from_str("1000001").unwrap();
        assert!(dynasty.get_perks().contains(&DynastyPerk::Wealthy));
        
        // Test Legendary
        dynasty.legacy_points = 100;
        let perks = dynasty.get_perks();
        assert_eq!(perks.len(), 4);
    }
}
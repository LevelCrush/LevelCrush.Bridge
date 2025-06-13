-- Create market item rarity enum (renamed to avoid conflict with existing inventory ItemRarity)
CREATE TYPE market_item_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');

-- Create items table
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    weight INTEGER NOT NULL DEFAULT 1,
    perishable BOOLEAN DEFAULT false,
    rarity market_item_rarity DEFAULT 'common',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create market event type enum
CREATE TYPE market_event_type AS ENUM (
    'shortage', 'surplus', 'disaster', 'festival', 
    'war', 'discovery', 'embargo', 'tax_change'
);

-- Add event_type column to market_events if it doesn't exist
ALTER TABLE market_events 
ADD COLUMN IF NOT EXISTS event_type market_event_type DEFAULT 'shortage';

-- Insert seed items
INSERT INTO items (name, category, base_price, weight, perishable, rarity, description) VALUES
-- Food items
('Wheat', 'Food', 10.00, 50, true, 'common', 'Basic grain used for bread and other foods'),
('Salt', 'Food', 25.00, 10, false, 'common', 'Essential preservative and seasoning'),
('Spices', 'Food', 100.00, 2, false, 'uncommon', 'Exotic spices from distant lands'),
('Wine', 'Food', 50.00, 30, false, 'common', 'Fermented grape beverage'),
('Honey', 'Food', 40.00, 15, false, 'uncommon', 'Sweet natural preservative'),

-- Raw materials
('Iron Ore', 'Raw Material', 30.00, 100, false, 'common', 'Unrefined iron for smithing'),
('Copper', 'Raw Material', 45.00, 80, false, 'common', 'Versatile metal for tools and coins'),
('Silver', 'Raw Material', 200.00, 50, false, 'uncommon', 'Precious metal for coins and jewelry'),
('Gold', 'Raw Material', 1000.00, 50, false, 'rare', 'The most valuable precious metal'),
('Timber', 'Raw Material', 20.00, 200, false, 'common', 'Wood for construction and crafts'),

-- Textiles
('Wool', 'Textile', 35.00, 40, false, 'common', 'Warm fabric from sheep'),
('Linen', 'Textile', 45.00, 30, false, 'common', 'Light fabric from flax'),
('Silk', 'Textile', 300.00, 5, false, 'rare', 'Luxurious fabric from silkworms'),
('Cotton', 'Textile', 40.00, 35, false, 'common', 'Versatile plant-based fabric'),
('Dye', 'Textile', 80.00, 10, false, 'uncommon', 'Colors for fabrics'),

-- Luxury goods
('Jewelry', 'Luxury', 500.00, 2, false, 'rare', 'Ornamental accessories'),
('Perfume', 'Luxury', 150.00, 1, false, 'uncommon', 'Fragrant oils and essences'),
('Art', 'Luxury', 800.00, 20, false, 'rare', 'Paintings and sculptures'),
('Books', 'Luxury', 200.00, 10, false, 'uncommon', 'Written knowledge and stories'),
('Gems', 'Luxury', 2000.00, 1, false, 'epic', 'Precious stones'),

-- Tools and weapons
('Tools', 'Equipment', 60.00, 30, false, 'common', 'Basic implements for work'),
('Weapons', 'Equipment', 150.00, 40, false, 'uncommon', 'Arms for protection'),
('Armor', 'Equipment', 300.00, 100, false, 'uncommon', 'Protective gear'),
('Medicine', 'Equipment', 100.00, 5, true, 'uncommon', 'Herbs and remedies'),
('Maps', 'Equipment', 250.00, 1, false, 'rare', 'Detailed route information');

-- Insert seed regions
INSERT INTO regions (name, description, tax_rate, safety_level, prosperity_level) VALUES
('Haven Port', 'A bustling coastal trade hub with heavy naval protection', 15.0, 85, 90),
('Mountain Pass', 'Treacherous route through the mountains, low taxes but dangerous', 5.0, 30, 40),
('Desert Oasis', 'Remote trading post in the desert, rare goods but harsh conditions', 10.0, 50, 60),
('Forest Village', 'Peaceful woodland settlement, good for basic goods', 12.0, 70, 50),
('Capital City', 'The empire''s heart, high taxes but excellent opportunities', 25.0, 95, 100),
('Frontier Town', 'Wild borderlands with minimal law enforcement', 3.0, 20, 30),
('River Crossing', 'Strategic bridge town controlling river trade', 20.0, 60, 70),
('Ancient Ruins', 'Mysterious location with unique artifacts', 8.0, 40, 20);

-- Insert trade routes between regions
WITH region_ids AS (
    SELECT 
        r1.id as haven_id,
        r2.id as mountain_id,
        r3.id as desert_id,
        r4.id as forest_id,
        r5.id as capital_id,
        r6.id as frontier_id,
        r7.id as river_id,
        r8.id as ruins_id
    FROM regions r1, regions r2, regions r3, regions r4, 
         regions r5, regions r6, regions r7, regions r8
    WHERE r1.name = 'Haven Port'
    AND r2.name = 'Mountain Pass'
    AND r3.name = 'Desert Oasis'
    AND r4.name = 'Forest Village'
    AND r5.name = 'Capital City'
    AND r6.name = 'Frontier Town'
    AND r7.name = 'River Crossing'
    AND r8.name = 'Ancient Ruins'
)
INSERT INTO trade_routes (from_region_id, to_region_id, distance, danger_level, toll_cost) 
SELECT * FROM (
    SELECT haven_id, capital_id, 100, 10, 50.00 FROM region_ids UNION ALL
    SELECT capital_id, haven_id, 100, 10, 50.00 FROM region_ids UNION ALL
    SELECT haven_id, river_id, 80, 20, 30.00 FROM region_ids UNION ALL
    SELECT river_id, haven_id, 80, 20, 30.00 FROM region_ids UNION ALL
    SELECT capital_id, forest_id, 60, 15, 20.00 FROM region_ids UNION ALL
    SELECT forest_id, capital_id, 60, 15, 20.00 FROM region_ids UNION ALL
    SELECT forest_id, mountain_id, 120, 60, 10.00 FROM region_ids UNION ALL
    SELECT mountain_id, forest_id, 120, 60, 10.00 FROM region_ids UNION ALL
    SELECT mountain_id, desert_id, 200, 80, 5.00 FROM region_ids UNION ALL
    SELECT desert_id, mountain_id, 200, 80, 5.00 FROM region_ids UNION ALL
    SELECT desert_id, frontier_id, 150, 90, 0.00 FROM region_ids UNION ALL
    SELECT frontier_id, desert_id, 150, 90, 0.00 FROM region_ids UNION ALL
    SELECT river_id, ruins_id, 100, 70, 15.00 FROM region_ids UNION ALL
    SELECT ruins_id, river_id, 100, 70, 15.00 FROM region_ids
) AS routes;

-- Create indexes on items table
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_rarity ON items(rarity);
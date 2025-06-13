-- Create market item rarity enum (renamed to avoid conflict with existing inventory ItemRarity)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'market_item_rarity') THEN
        CREATE TYPE market_item_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
    END IF;
END$$;

-- Create items table
CREATE TABLE IF NOT EXISTS items (
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
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'market_event_type') THEN
        CREATE TYPE market_event_type AS ENUM (
            'shortage', 'surplus', 'disaster', 'festival', 
            'war', 'discovery', 'embargo', 'tax_change'
        );
    END IF;
END$$;

-- Add event_type column to market_events if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'market_events' AND column_name = 'event_type') THEN
        ALTER TABLE market_events 
        ADD COLUMN event_type market_event_type DEFAULT 'shortage';
    END IF;
END$$;

-- Insert seed items
INSERT INTO items (id, name, category, base_price, weight, perishable, rarity, description) VALUES
-- Food items
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Wheat', 'Food', 10.00, 50, true, 'common', 'Basic grain used for bread and other foods'),
('b2c3d4e5-f678-90ab-cdef-123456789012', 'Salt', 'Food', 25.00, 10, false, 'common', 'Essential preservative and seasoning'),
('c3d4e5f6-7890-abcd-ef12-345678901234', 'Spices', 'Food', 100.00, 2, false, 'uncommon', 'Exotic spices from distant lands'),
('d4e5f678-90ab-cdef-1234-567890123456', 'Wine', 'Food', 50.00, 30, false, 'common', 'Fermented grape beverage'),
('e5f67890-abcd-ef12-3456-789012345678', 'Honey', 'Food', 40.00, 15, false, 'uncommon', 'Sweet natural preservative'),

-- Raw materials
('f6789012-cdef-1234-5678-90123456789a', 'Iron Ore', 'Raw Material', 30.00, 100, false, 'common', 'Unrefined iron for smithing'),
('0789abcd-ef12-3456-7890-123456789abc', 'Copper', 'Raw Material', 45.00, 80, false, 'common', 'Versatile metal for tools and coins'),
('189abcde-f123-4567-890a-bcdef1234567', 'Silver', 'Raw Material', 200.00, 50, false, 'uncommon', 'Precious metal for coins and jewelry'),
('29abcdef-1234-5678-90ab-cdef12345678', 'Gold', 'Raw Material', 1000.00, 50, false, 'rare', 'The most valuable precious metal'),
('3abcdef1-2345-6789-0abc-def123456789', 'Timber', 'Raw Material', 20.00, 200, false, 'common', 'Wood for construction and crafts'),

-- Textiles
('4bcdef12-3456-7890-abcd-ef123456789a', 'Wool', 'Textile', 35.00, 40, false, 'common', 'Warm fabric from sheep'),
('5cdef123-4567-890a-bcde-f123456789ab', 'Linen', 'Textile', 45.00, 30, false, 'common', 'Light fabric from flax'),
('6def1234-5678-90ab-cdef-123456789abc', 'Silk', 'Textile', 300.00, 5, false, 'rare', 'Luxurious fabric from silkworms'),
('7ef12345-6789-0abc-def1-23456789abcd', 'Cotton', 'Textile', 40.00, 35, false, 'common', 'Versatile plant-based fabric'),
('8f123456-7890-abcd-ef12-3456789abcde', 'Dye', 'Textile', 80.00, 10, false, 'uncommon', 'Colors for fabrics'),

-- Luxury goods
('9123456f-890a-bcde-f123-456789abcdef', 'Jewelry', 'Luxury', 500.00, 2, false, 'rare', 'Ornamental accessories'),
('a234567f-890a-bcde-f123-456789abcde0', 'Perfume', 'Luxury', 150.00, 1, false, 'uncommon', 'Fragrant essence'),
('b345678f-890a-bcde-f123-456789abcde1', 'Art', 'Luxury', 1000.00, 20, false, 'rare', 'Paintings and sculptures'),
('c456789f-890a-bcde-f123-456789abcde2', 'Books', 'Luxury', 75.00, 5, false, 'uncommon', 'Written knowledge and stories'),
('d56789af-890a-bcde-f123-456789abcde3', 'Gems', 'Luxury', 750.00, 1, false, 'epic', 'Precious stones'),

-- Tools and weapons
('e6789abf-890a-bcde-f123-456789abcde4', 'Tools', 'Equipment', 60.00, 25, false, 'common', 'Basic crafting implements'),
('f789abcf-890a-bcde-f123-456789abcde5', 'Weapons', 'Equipment', 200.00, 50, false, 'uncommon', 'Arms for defense and hunting'),
('089abcdf-890a-bcde-f123-456789abcde6', 'Armor', 'Equipment', 300.00, 100, false, 'uncommon', 'Protective gear'),
('19abcdef-890a-bcde-f123-456789abcde7', 'Medicine', 'Equipment', 100.00, 5, true, 'uncommon', 'Healing herbs and potions'),
('2abcdef0-890a-bcde-f123-456789abcde8', 'Magic Items', 'Equipment', 2000.00, 10, false, 'legendary', 'Enchanted artifacts')
ON CONFLICT (id) DO NOTHING;

-- Insert seed regions
INSERT INTO regions (id, name, description, tax_rate, safety_level, prosperity_level) VALUES
('d4f3a1e5-6b7c-4d8e-9f0a-1b2c3d4e5f6a', 'The Hub', 'Central trading metropolis', 15.00, 9, 9),
('e5f6a7b8-c9d0-e1f2-a3b4-c5d6e7f8a9b0', 'Northern Wastes', 'Harsh frozen territories', 5.00, 3, 2),
('f6a7b8c9-d0e1-f2a3-b4c5-d6e7f8a9b0c1', 'Eastern Shores', 'Coastal trading ports', 12.00, 7, 8),
('a7b8c9d0-e1f2-a3b4-c5d6-e7f8a9b0c1d2', 'Southern Deserts', 'Arid caravan routes', 8.00, 4, 5),
('b8c9d0e1-f2a3-b4c5-d6e7-f8a9b0c1d2e3', 'Western Forests', 'Dense woodland settlements', 10.00, 6, 6),
('c9d0e1f2-a3b4-c5d6-e7f8-a9b0c1d2e3f4', 'Mountain Holds', 'Fortified mining towns', 7.00, 8, 7),
('d0e1f2a3-b4c5-d6e7-f8a9-b0c1d2e3f4a5', 'River Delta', 'Fertile agricultural region', 11.00, 7, 8),
('e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6', 'Frontier Outposts', 'Lawless border territories', 3.00, 2, 3)
ON CONFLICT (id) DO NOTHING;

-- Insert trade routes
INSERT INTO trade_routes (from_region_id, to_region_id, distance, danger_level, toll_cost) VALUES
-- From The Hub
('d4f3a1e5-6b7c-4d8e-9f0a-1b2c3d4e5f6a', 'e5f6a7b8-c9d0-e1f2-a3b4-c5d6e7f8a9b0', 500, 3, 25.00),
('d4f3a1e5-6b7c-4d8e-9f0a-1b2c3d4e5f6a', 'f6a7b8c9-d0e1-f2a3-b4c5-d6e7f8a9b0c1', 300, 2, 15.00),
('d4f3a1e5-6b7c-4d8e-9f0a-1b2c3d4e5f6a', 'a7b8c9d0-e1f2-a3b4-c5d6-e7f8a9b0c1d2', 400, 4, 20.00),
('d4f3a1e5-6b7c-4d8e-9f0a-1b2c3d4e5f6a', 'b8c9d0e1-f2a3-b4c5-d6e7-f8a9b0c1d2e3', 250, 2, 10.00),

-- From Eastern Shores
('f6a7b8c9-d0e1-f2a3-b4c5-d6e7f8a9b0c1', 'c9d0e1f2-a3b4-c5d6-e7f8-a9b0c1d2e3f4', 350, 3, 18.00),
('f6a7b8c9-d0e1-f2a3-b4c5-d6e7f8a9b0c1', 'd0e1f2a3-b4c5-d6e7-f8a9-b0c1d2e3f4a5', 200, 1, 8.00),

-- From Western Forests
('b8c9d0e1-f2a3-b4c5-d6e7-f8a9b0c1d2e3', 'c9d0e1f2-a3b4-c5d6-e7f8-a9b0c1d2e3f4', 150, 2, 7.00),
('b8c9d0e1-f2a3-b4c5-d6e7-f8a9b0c1d2e3', 'e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6', 400, 6, 5.00),

-- Dangerous routes
('a7b8c9d0-e1f2-a3b4-c5d6-e7f8a9b0c1d2', 'e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6', 600, 8, 0.00),
('e5f6a7b8-c9d0-e1f2-a3b4-c5d6e7f8a9b0', 'e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6', 800, 9, 0.00)
ON CONFLICT (from_region_id, to_region_id) DO NOTHING;

-- Add bidirectional routes (return trips)
INSERT INTO trade_routes (from_region_id, to_region_id, distance, danger_level, toll_cost)
SELECT to_region_id, from_region_id, distance, danger_level, toll_cost
FROM trade_routes
ON CONFLICT (from_region_id, to_region_id) DO NOTHING;
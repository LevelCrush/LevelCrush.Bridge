-- Seed baseline inventory for all existing characters
-- This migration assigns random starting items to characters

-- Create a temporary function to generate random inventory
CREATE OR REPLACE FUNCTION seed_character_inventory() RETURNS void AS $$
DECLARE
    char_record RECORD;
    item_record RECORD;
    rand_quantity INTEGER;
    rand_price_modifier DECIMAL(3,2);
    items_to_add INTEGER;
    item_count INTEGER;
BEGIN
    -- Loop through all living characters
    FOR char_record IN SELECT id, generation FROM characters WHERE is_alive = true LOOP
        -- Determine how many different items this character should have (3-8 items)
        items_to_add := 3 + floor(random() * 6)::INTEGER;
        item_count := 0;
        
        -- Add some basic food items (everyone needs food)
        -- Wheat (common food staple)
        rand_quantity := 5 + floor(random() * 20)::INTEGER;
        rand_price_modifier := 0.8 + (random() * 0.4); -- 80% to 120% of base price
        INSERT INTO character_inventory (character_id, item_id, quantity, acquired_price)
        VALUES (
            char_record.id,
            'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID, -- Wheat
            rand_quantity,
            10.00 * rand_price_modifier
        ) ON CONFLICT (character_id, item_id) DO NOTHING;
        item_count := item_count + 1;
        
        -- Salt (common preservative)
        IF random() > 0.3 THEN -- 70% chance
            rand_quantity := 2 + floor(random() * 10)::INTEGER;
            rand_price_modifier := 0.8 + (random() * 0.4);
            INSERT INTO character_inventory (character_id, item_id, quantity, acquired_price)
            VALUES (
                char_record.id,
                'b2c3d4e5-f678-90ab-cdef-123456789012'::UUID, -- Salt
                rand_quantity,
                25.00 * rand_price_modifier
            ) ON CONFLICT (character_id, item_id) DO NOTHING;
            item_count := item_count + 1;
        END IF;
        
        -- Add some raw materials based on generation (older generations might have accumulated more)
        IF char_record.generation <= 2 OR random() > 0.5 THEN
            -- Iron Ore
            rand_quantity := 3 + floor(random() * 15)::INTEGER;
            rand_price_modifier := 0.7 + (random() * 0.6);
            INSERT INTO character_inventory (character_id, item_id, quantity, acquired_price)
            VALUES (
                char_record.id,
                'f6789012-cdef-1234-5678-90123456789a'::UUID, -- Iron Ore
                rand_quantity,
                30.00 * rand_price_modifier
            ) ON CONFLICT (character_id, item_id) DO NOTHING;
            item_count := item_count + 1;
        END IF;
        
        -- Add textiles (everyone needs clothes)
        IF random() > 0.4 THEN -- 60% chance for wool
            rand_quantity := 2 + floor(random() * 8)::INTEGER;
            rand_price_modifier := 0.8 + (random() * 0.4);
            INSERT INTO character_inventory (character_id, item_id, quantity, acquired_price)
            VALUES (
                char_record.id,
                '4bcdef12-3456-7890-abcd-ef123456789a'::UUID, -- Wool
                rand_quantity,
                35.00 * rand_price_modifier
            ) ON CONFLICT (character_id, item_id) DO NOTHING;
            item_count := item_count + 1;
        END IF;
        
        -- Add some tools (common equipment)
        IF random() > 0.5 THEN -- 50% chance
            rand_quantity := 1 + floor(random() * 3)::INTEGER;
            rand_price_modifier := 0.9 + (random() * 0.3);
            INSERT INTO character_inventory (character_id, item_id, quantity, acquired_price)
            VALUES (
                char_record.id,
                'e6789abf-890a-bcde-f123-456789abcde4'::UUID, -- Tools
                rand_quantity,
                60.00 * rand_price_modifier
            ) ON CONFLICT (character_id, item_id) DO NOTHING;
            item_count := item_count + 1;
        END IF;
        
        -- Add some random items based on remaining slots
        WHILE item_count < items_to_add LOOP
            -- Select a random item
            SELECT id, base_price INTO item_record
            FROM items
            WHERE id NOT IN (
                SELECT item_id FROM character_inventory WHERE character_id = char_record.id
            )
            ORDER BY random()
            LIMIT 1;
            
            IF item_record.id IS NOT NULL THEN
                -- Determine quantity based on item value (expensive items = fewer quantity)
                IF item_record.base_price > 500 THEN
                    rand_quantity := 1;
                ELSIF item_record.base_price > 100 THEN
                    rand_quantity := 1 + floor(random() * 3)::INTEGER;
                ELSE
                    rand_quantity := 1 + floor(random() * 10)::INTEGER;
                END IF;
                
                rand_price_modifier := 0.7 + (random() * 0.6); -- 70% to 130% of base price
                
                INSERT INTO character_inventory (character_id, item_id, quantity, acquired_price)
                VALUES (
                    char_record.id,
                    item_record.id,
                    rand_quantity,
                    item_record.base_price * rand_price_modifier
                ) ON CONFLICT (character_id, item_id) DO NOTHING;
                
                item_count := item_count + 1;
            ELSE
                EXIT; -- No more items to add
            END IF;
        END LOOP;
        
        -- Give first generation characters a luxury item (inherited wealth)
        IF char_record.generation = 1 AND random() > 0.6 THEN
            -- Add a random luxury item
            SELECT id, base_price INTO item_record
            FROM items
            WHERE category = 'Luxury'
            AND id NOT IN (
                SELECT item_id FROM character_inventory WHERE character_id = char_record.id
            )
            ORDER BY random()
            LIMIT 1;
            
            IF item_record.id IS NOT NULL THEN
                rand_price_modifier := 0.9 + (random() * 0.4); -- 90% to 130% of base price
                INSERT INTO character_inventory (character_id, item_id, quantity, acquired_price)
                VALUES (
                    char_record.id,
                    item_record.id,
                    1, -- Luxury items are rare
                    item_record.base_price * rand_price_modifier
                ) ON CONFLICT (character_id, item_id) DO NOTHING;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT seed_character_inventory();

-- Drop the temporary function
DROP FUNCTION seed_character_inventory();

-- Add some variety in acquisition dates (make it look like items were acquired over time)
UPDATE character_inventory
SET acquired_at = CURRENT_TIMESTAMP - (random() * INTERVAL '30 days')
WHERE acquired_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute';

-- Log the results
DO $$
DECLARE
    total_chars INTEGER;
    chars_with_inv INTEGER;
    total_items INTEGER;
    total_value DECIMAL;
BEGIN
    SELECT COUNT(*) INTO total_chars FROM characters WHERE is_alive = true;
    SELECT COUNT(DISTINCT character_id) INTO chars_with_inv FROM character_inventory;
    SELECT COUNT(*) INTO total_items FROM character_inventory;
    SELECT COALESCE(SUM(quantity * acquired_price), 0) INTO total_value FROM character_inventory;
    
    RAISE NOTICE 'Inventory seeding complete:';
    RAISE NOTICE '  Living characters: %', total_chars;
    RAISE NOTICE '  Characters with inventory: %', chars_with_inv;
    RAISE NOTICE '  Total inventory entries: %', total_items;
    RAISE NOTICE '  Total inventory value: % gold', total_value;
END $$;
-- Seed initial regions for Dynasty Trader

-- Insert regions only if they don't exist
INSERT INTO regions (id, name, description, tax_rate, safety_level, prosperity_level)
SELECT * FROM (VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Capital City', 'The bustling heart of the empire, where fortunes are made and lost.', 15.0, 90, 95),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid, 'Northern Mines', 'Rich ore deposits make this a key supplier of metals and gems.', 10.0, 60, 70),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid, 'Eastern Port', 'A major trading hub connecting overseas merchants.', 12.0, 75, 85),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, 'Western Plains', 'Vast farmlands that feed the empire.', 8.0, 80, 50),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15'::uuid, 'Southern Desert', 'Harsh lands hiding valuable spices and rare artifacts.', 7.0, 40, 60),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16'::uuid, 'Mountain Pass', 'A dangerous but lucrative trade route between regions.', 5.0, 30, 40),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17'::uuid, 'Forest Village', 'Source of timber, herbs, and mystical ingredients.', 6.0, 70, 35),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18'::uuid, 'Coastal Towns', 'Fishing villages providing seafood and pearls.', 9.0, 65, 45)
) AS v(id, name, description, tax_rate, safety_level, prosperity_level)
WHERE NOT EXISTS (SELECT 1 FROM regions);
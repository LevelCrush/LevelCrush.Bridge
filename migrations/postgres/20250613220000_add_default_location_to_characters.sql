-- Add default location to characters who don't have one
UPDATE characters 
SET location_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid -- Capital City
WHERE location_id IS NULL;
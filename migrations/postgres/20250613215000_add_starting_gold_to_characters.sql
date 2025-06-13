-- Give existing characters with no gold a starting amount
UPDATE characters 
SET inheritance_received = 750.00 
WHERE inheritance_received = 0 
AND is_alive = true;

-- Give even dead characters some gold they had in life (for historical accuracy)
UPDATE characters 
SET inheritance_received = 500.00 
WHERE inheritance_received = 0 
AND is_alive = false;
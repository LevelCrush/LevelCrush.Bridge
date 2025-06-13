-- Create transaction history table
CREATE TABLE market_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_character_id UUID NOT NULL REFERENCES characters(id),
    seller_character_id UUID REFERENCES characters(id),
    listing_id UUID NOT NULL REFERENCES market_listings(id),
    region_id UUID NOT NULL REFERENCES regions(id),
    item_id UUID NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(20,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    transaction_type VARCHAR(50) NOT NULL DEFAULT 'market_purchase',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_market_transactions_buyer ON market_transactions(buyer_character_id);
CREATE INDEX idx_market_transactions_seller ON market_transactions(seller_character_id);
CREATE INDEX idx_market_transactions_region ON market_transactions(region_id);
CREATE INDEX idx_market_transactions_item ON market_transactions(item_id);
CREATE INDEX idx_market_transactions_created_at ON market_transactions(created_at DESC);

-- Create composite index for character transaction history
CREATE INDEX idx_market_transactions_character_history 
ON market_transactions(buyer_character_id, created_at DESC);

CREATE INDEX idx_market_transactions_seller_history 
ON market_transactions(seller_character_id, created_at DESC);

CREATE TABLE IF NOT EXISTS events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    variant CHAR(1) NOT NULL
        CHECK (variant IN ('a', 'b')),
    type TEXT NOT NULL
        CHECK (type IN ('impression', 'conversion')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS
    one_conversion_per_visitor
ON events (visitor_id)
WHERE type = 'conversion';

CREATE INDEX IF NOT EXISTS
    events_impressions_lookup
ON events (visitor_id, type, created_at DESC);

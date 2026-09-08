-- Add the new multi-select array column (default empty array backfills existing rows)
ALTER TABLE "Event" ADD COLUMN "eventTypes" "EventType"[] NOT NULL DEFAULT ARRAY[]::"EventType"[];

-- Preserve any existing single eventType value as a one-element array
UPDATE "Event" SET "eventTypes" = ARRAY["eventType"]::"EventType"[] WHERE "eventType" IS NOT NULL;

-- Drop the old single-value column
ALTER TABLE "Event" DROP COLUMN "eventType";

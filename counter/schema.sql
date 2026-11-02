-- The counter's one table: how many reports of each kind arrived on each day.
-- Nothing in a row tells one installation from another, and no address,
-- time of day or text is kept anywhere. See worker.js.
CREATE TABLE IF NOT EXISTS counts (
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  since TEXT NOT NULL,
  week INTEGER NOT NULL,
  first INTEGER NOT NULL,
  version TEXT NOT NULL,
  system TEXT NOT NULL,
  model TEXT NOT NULL,
  kind TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, event, since, week, first, version, system, model, kind)
);

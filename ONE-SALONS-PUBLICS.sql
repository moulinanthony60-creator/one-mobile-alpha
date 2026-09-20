-- À exécuter dans D1 COMMENTS avant le serveur v24. Réexécutable.
-- Les salons existants restent privés.
CREATE TABLE IF NOT EXISTS party_directory (
 room_id TEXT PRIMARY KEY REFERENCES party_rooms(id) ON DELETE CASCADE,
 visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','public')),
 kind TEXT NOT NULL DEFAULT 'bluff',
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS party_directory_visibility ON party_directory(visibility,updated_at);

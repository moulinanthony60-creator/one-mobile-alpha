CREATE TABLE IF NOT EXISTS party_rooms (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL UNIQUE, owner_name TEXT NOT NULL,
 name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 80), created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS party_members (
 account_id TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES party_rooms(id) ON DELETE CASCADE,
 display_name TEXT NOT NULL, joined_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS party_members_room ON party_members(room_id);
CREATE TABLE IF NOT EXISTS party_invites (
 id TEXT PRIMARY KEY,room_id TEXT NOT NULL REFERENCES party_rooms(id) ON DELETE CASCADE,
 recipient_id TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined')),
 UNIQUE(room_id,recipient_id)
);
CREATE INDEX IF NOT EXISTS party_invites_recipient ON party_invites(recipient_id,status,expires_at);
CREATE TRIGGER IF NOT EXISTS party_capacity BEFORE INSERT ON party_members
WHEN (SELECT COUNT(*) FROM party_members WHERE room_id=NEW.room_id)>=16
BEGIN SELECT RAISE(IGNORE); END;
CREATE TRIGGER IF NOT EXISTS party_owner_join AFTER INSERT ON party_rooms
BEGIN INSERT INTO party_members(account_id,room_id,display_name,joined_at)
VALUES(NEW.owner_id,NEW.id,NEW.owner_name,NEW.created_at); END;
CREATE TABLE IF NOT EXISTS party_ready (
 account_id TEXT PRIMARY KEY REFERENCES party_members(account_id) ON DELETE CASCADE,
 room_id TEXT NOT NULL REFERENCES party_rooms(id) ON DELETE CASCADE,
 ready INTEGER NOT NULL DEFAULT 0 CHECK(ready IN (0,1))
);
CREATE TABLE IF NOT EXISTS party_games (
 room_id TEXT PRIMARY KEY REFERENCES party_rooms(id) ON DELETE CASCADE,
 id TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL CHECK(status IN ('playing','finished','cancelled')),
 state TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS party_game_member_left AFTER DELETE ON party_members
BEGIN
 UPDATE party_games SET status='cancelled',revision=revision+1 WHERE room_id=OLD.room_id AND status='playing';
 DELETE FROM party_ready WHERE room_id=OLD.room_id;
END;
CREATE TRIGGER IF NOT EXISTS party_game_member_joined AFTER INSERT ON party_members
BEGIN DELETE FROM party_ready WHERE room_id=NEW.room_id; END;
CREATE TRIGGER IF NOT EXISTS party_game_join_guard BEFORE INSERT ON party_members
WHEN EXISTS(SELECT 1 FROM party_games WHERE room_id=NEW.room_id AND status='playing')
BEGIN SELECT RAISE(IGNORE); END;
CREATE TABLE IF NOT EXISTS party_avatars (
 account_id TEXT PRIMARY KEY REFERENCES party_members(account_id) ON DELETE CASCADE,
 room_id TEXT NOT NULL REFERENCES party_rooms(id) ON DELETE CASCADE,
 avatar TEXT NOT NULL CHECK(avatar IN ('croupier','renard','corbeau','chasseur'))
);
CREATE TABLE IF NOT EXISTS party_messages (
 id TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES party_rooms(id) ON DELETE CASCADE,
 author_id TEXT NOT NULL,author_name TEXT NOT NULL,body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 1000),created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS party_messages_room ON party_messages(room_id,created_at);
CREATE INDEX IF NOT EXISTS party_messages_author ON party_messages(author_id,created_at);
CREATE TABLE IF NOT EXISTS party_calls (
 id TEXT PRIMARY KEY,room_id TEXT NOT NULL REFERENCES party_rooms(id) ON DELETE CASCADE,
 account_id TEXT NOT NULL UNIQUE REFERENCES party_members(account_id) ON DELETE CASCADE,
 name TEXT NOT NULL,updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS party_signals (
 seq INTEGER PRIMARY KEY AUTOINCREMENT,
 sender TEXT NOT NULL REFERENCES party_calls(id) ON DELETE CASCADE,
 recipient TEXT NOT NULL REFERENCES party_calls(id) ON DELETE CASCADE,
 payload TEXT NOT NULL,created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS party_signals_recipient ON party_signals(recipient,seq);
CREATE TABLE IF NOT EXISTS party_directory (
 room_id TEXT PRIMARY KEY REFERENCES party_rooms(id) ON DELETE CASCADE,
 visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','public')),
 kind TEXT NOT NULL DEFAULT 'bluff',
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS party_directory_visibility ON party_directory(visibility,updated_at);
DROP TRIGGER IF EXISTS party_capacity;
CREATE TRIGGER party_capacity BEFORE INSERT ON party_members
WHEN (SELECT COUNT(*) FROM party_members WHERE room_id=NEW.room_id)>=16
BEGIN SELECT RAISE(IGNORE); END;
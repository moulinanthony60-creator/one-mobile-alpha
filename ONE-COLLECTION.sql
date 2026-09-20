-- D1 COMMENTS : exécuter avant le serveur v25. Réexécutable.
CREATE TABLE IF NOT EXISTS one_wallets (
 account_id TEXT PRIMARY KEY, balance INTEGER NOT NULL DEFAULT 0 CHECK(balance>=0)
);
CREATE TABLE IF NOT EXISTS one_collection (
 account_id TEXT NOT NULL, card_id TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>0),
 PRIMARY KEY(account_id,card_id)
);
CREATE TABLE IF NOT EXISTS one_pack_openings (
 account_id TEXT NOT NULL, request_id TEXT NOT NULL, pack_id TEXT NOT NULL,
 cost INTEGER NOT NULL CHECK(cost>0), cards TEXT NOT NULL CHECK(json_valid(cards)), created_at INTEGER NOT NULL,
 PRIMARY KEY(account_id,request_id)
);
CREATE TABLE IF NOT EXISTS one_points_ledger (
 account_id TEXT NOT NULL, reference TEXT NOT NULL, amount INTEGER NOT NULL, reason TEXT NOT NULL, created_at INTEGER NOT NULL,
 PRIMARY KEY(account_id,reference)
);
CREATE TRIGGER IF NOT EXISTS one_pack_funds BEFORE INSERT ON one_pack_openings
WHEN COALESCE((SELECT balance FROM one_wallets WHERE account_id=NEW.account_id),0)<NEW.cost
BEGIN SELECT RAISE(IGNORE); END;
CREATE TRIGGER IF NOT EXISTS one_pack_award AFTER INSERT ON one_pack_openings
BEGIN
 UPDATE one_wallets SET balance=balance-NEW.cost WHERE account_id=NEW.account_id;
 INSERT INTO one_collection(account_id,card_id,quantity)
 SELECT NEW.account_id,value,COUNT(*) FROM json_each(NEW.cards) GROUP BY value
 ON CONFLICT(account_id,card_id) DO UPDATE SET quantity=quantity+excluded.quantity;
 INSERT INTO one_points_ledger(account_id,reference,amount,reason,created_at)
 VALUES(NEW.account_id,'pack:'||NEW.request_id,-NEW.cost,NEW.pack_id,NEW.created_at);
END;

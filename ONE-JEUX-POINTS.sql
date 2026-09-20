CREATE TABLE IF NOT EXISTS one_casino(account_id TEXT NOT NULL,id TEXT NOT NULL,kind TEXT NOT NULL,stake INTEGER NOT NULL CHECK(stake IN(10,25,50,100)),state TEXT NOT NULL,settled INTEGER NOT NULL DEFAULT 0,payout INTEGER NOT NULL DEFAULT 0,version INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(account_id,id));
CREATE UNIQUE INDEX IF NOT EXISTS one_casino_active ON one_casino(account_id) WHERE settled=0;
CREATE TRIGGER IF NOT EXISTS one_casino_funds BEFORE INSERT ON one_casino WHEN COALESCE((SELECT balance FROM one_wallets WHERE account_id=NEW.account_id),0)<NEW.stake BEGIN SELECT RAISE(IGNORE); END;
CREATE TRIGGER IF NOT EXISTS one_casino_debit AFTER INSERT ON one_casino BEGIN
 UPDATE one_wallets SET balance=balance-NEW.stake+NEW.payout WHERE account_id=NEW.account_id;
 INSERT INTO one_points_ledger VALUES(NEW.account_id,'casino:'||NEW.id,-NEW.stake+NEW.payout,NEW.kind,unixepoch()*1000);
END;
CREATE TRIGGER IF NOT EXISTS one_casino_settle AFTER UPDATE ON one_casino WHEN OLD.settled=0 AND NEW.settled=1 BEGIN
 UPDATE one_wallets SET balance=balance+NEW.payout WHERE account_id=NEW.account_id;
 INSERT INTO one_points_ledger VALUES(NEW.account_id,'settle:'||NEW.id,NEW.payout,NEW.kind,unixepoch()*1000);
END;
CREATE TABLE IF NOT EXISTS one_daily(account_id TEXT NOT NULL,day TEXT NOT NULL,PRIMARY KEY(account_id,day));
CREATE TRIGGER IF NOT EXISTS one_daily_award AFTER INSERT ON one_daily BEGIN
 INSERT INTO one_wallets VALUES(NEW.account_id,100) ON CONFLICT(account_id) DO UPDATE SET balance=balance+100;
 INSERT INTO one_points_ledger VALUES(NEW.account_id,'daily:'||NEW.day,100,'daily',unixepoch()*1000);
END;

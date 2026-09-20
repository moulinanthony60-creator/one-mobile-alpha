CREATE TABLE IF NOT EXISTS one_test_credits(account_id TEXT PRIMARY KEY,amount INTEGER NOT NULL);
CREATE TRIGGER IF NOT EXISTS one_test_credit_award AFTER INSERT ON one_test_credits BEGIN
 INSERT INTO one_wallets VALUES(NEW.account_id,NEW.amount) ON CONFLICT(account_id) DO UPDATE SET balance=balance+NEW.amount;
 INSERT INTO one_points_ledger VALUES(NEW.account_id,'test-credit-2026-09',NEW.amount,'Crédit de test',unixepoch()*1000);
END;
INSERT OR IGNORE INTO one_test_credits(account_id,amount)
SELECT account_id,500000 FROM friend_profiles WHERE name='Diwaiis'
AND (SELECT COUNT(*) FROM friend_profiles WHERE name='Diwaiis')=1;
SELECT p.name,p.account_id,w.balance FROM friend_profiles p JOIN one_wallets w ON w.account_id=p.account_id WHERE p.name='Diwaiis';
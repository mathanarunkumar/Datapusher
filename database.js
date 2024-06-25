const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`CREATE TABLE Account (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        accountId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        secretToken TEXT NOT NULL,
        website TEXT
    )`);

    db.run(`CREATE TABLE Destination (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        accountId TEXT NOT NULL,
        url TEXT NOT NULL,
        method TEXT NOT NULL,
        headers TEXT NOT NULL,
        FOREIGN KEY(accountId) REFERENCES Account(accountId)
    )`);
});

module.exports = db;

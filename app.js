const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

app.post('/accounts', (req, res) => {
    const { email, name, website } = req.body;
    const accountId = 'acc_' + Math.random().toString(36).substr(2, 9);
    const secretToken = 'token_' + Math.random().toString(36).substr(2, 15);

    db.run('INSERT INTO Account (email, accountId, name, secretToken, website) VALUES (?, ?, ?, ?, ?)', 
    [email, accountId, name, secretToken, website], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, accountId, secretToken });
    });
});

app.get('/accounts/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM Account WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(row);
    });
});

app.put('/accounts/:id', (req, res) => {
    const { id } = req.params;
    const { email, name, website } = req.body;
    db.run('UPDATE Account SET email = ?, name = ?, website = ? WHERE id = ?', [email, name, website, id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ changes: this.changes });
    });
});

app.delete('/accounts/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM Account WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ changes: this.changes });
    });
});

app.post('/destinations', (req, res) => {
    const { accountId, url, method, headers } = req.body;

    db.run('INSERT INTO Destination (accountId, url, method, headers) VALUES (?, ?, ?, ?)', 
    [accountId, url, method, JSON.stringify(headers)], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
});

app.get('/destinations/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM Destination WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(row);
    });
});

app.put('/destinations/:id', (req, res) => {
    const { id } = req.params;
    const { url, method, headers } = req.body;
    db.run('UPDATE Destination SET url = ?, method = ?, headers = ? WHERE id = ?', [url, method, JSON.stringify(headers), id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ changes: this.changes });
    });
});

app.delete('/destinations/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM Destination WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ changes: this.changes });
    });
});

app.get('/accounts/:accountId/destinations', (req, res) => {
    const { accountId } = req.params;
    db.all('SELECT * FROM Destination WHERE accountId = ?', [accountId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});

app.post('/server/incoming_data', (req, res) => {
    const data = req.body;
    const token = req.headers['cl-x-token'];

    if (!token) {
        return res.status(401).json({ message: 'Un Authenticate' });
    }

    db.get('SELECT * FROM Account WHERE secretToken = ?', [token], (err, account) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!account) {
            return res.status(401).json({ message: 'Un Authenticate' });
        }

        db.all('SELECT * FROM Destination WHERE accountId = ?', [account.accountId], (err, destinations) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            destinations.forEach(destination => {
                const config = {
                    method: destination.method,
                    url: destination.url,
                    headers: JSON.parse(destination.headers)
                };

                if (destination.method.toUpperCase() === 'GET') {
                    config.params = data;
                } else {
                    config.data = data;
                }

                axios(config).then(response => {
                    console.log('Data sent successfully to', destination.url);
                }).catch(error => {
                    console.error('Error sending data to', destination.url, error.message);
                });
            });

            res.status(200).json({ message: 'Data processed successfully' });
        });
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

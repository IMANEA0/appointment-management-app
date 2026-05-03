const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const SECRET = 'ISI_SECRET';

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const db = new sqlite3.Database('./database.db');

// Table users
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  )
`);

// Table appointments
db.run(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    date TEXT,
    time TEXT,
    user_id INTEGER
  )
`);

// REGISTER
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const hashed = bcrypt.hashSync(password, 8);
  db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashed], function(err) {
    if (err) return res.status(400).json({ message: 'Email déjà utilisé' });
    res.json({ message: 'Compte créé avec succès' });
  });
});

// LOGIN
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (!user) return res.status(401).json({ message: 'Email incorrect' });
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Mot de passe incorrect' });
    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});

// ADD appointment
app.post('/appointments', (req, res) => {
  const { title, description, date, time, user_id } = req.body;
  db.run(
    `INSERT INTO appointments (title, description, date, time, user_id) VALUES (?, ?, ?, ?, ?)`,
    [title, description, date, time, user_id],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur lors de l’ajout' });
      }
      res.json({ id: this.lastID });
    }
  );
});

// GET all appointments
app.get('/appointments', (req, res) => {
  db.all('SELECT * FROM appointments', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erreur serveur' });
    res.json(rows);
  });
});

// DELETE appointment
app.delete('/appointments/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM appointments WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ message: 'Erreur lors de la suppression' });
    if (this.changes === 0) return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    res.json({ message: 'Rendez-vous supprimé avec succès' });
  });
});

// UPDATE appointment
app.put('/appointments/:id', (req, res) => {
  const id = req.params.id;
  const { title, description, date, time, user_id } = req.body;

  // debug log
  console.log('PUT ID:', id, 'BODY:', req.body);

  db.run(
    `UPDATE appointments SET title=?, description=?, date=?, time=?, user_id=? WHERE id=?`,
    [title, description, date, time, user_id, id],
    function(err) {
      if (err) {
        console.error('SQLite ERROR:', err);
        return res.status(500).json({ message: 'Erreur lors de la mise à jour' });
      }
      if (this.changes === 0) return res.status(404).json({ message: 'Rendez-vous non trouvé' });
      res.json({ message: 'Rendez-vous mis à jour avec succès' });
    }
  );
});

app.listen(3000, () => {
  console.log('Backend lancé sur http://localhost:3000');
});

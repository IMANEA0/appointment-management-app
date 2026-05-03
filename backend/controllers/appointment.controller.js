const db = require('../db');

exports.getAll = (req, res) => {
  db.all(`SELECT * FROM appointments`, [], (err, rows) => {
    res.json(rows);
  });
};

exports.create = (req, res) => {
  const { title, description, date, time, user_id } = req.body;

  const sql = `
    INSERT INTO appointments (title, description, date, time, user_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(sql, [title, description, date, time, user_id], function () {
    res.json({ message: 'Rendez-vous ajouté' });
  });
};

exports.update = (req, res) => {
  const { title, description, date, time } = req.body;

  const sql = `
    UPDATE appointments
    SET title=?, description=?, date=?, time=?
    WHERE id=?
  `;

  db.run(sql, [title, description, date, time, req.params.id], function () {
    res.json({ message: 'Rendez-vous modifié' });
  });
};

exports.delete = (req, res) => {
  db.run(`DELETE FROM appointments WHERE id=?`, [req.params.id], function () {
    res.json({ message: 'Rendez-vous supprimé' });
  });
};

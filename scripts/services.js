// backend/routes/admin/services.js
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const db = require('../../config/db');
const multer = require('multer');
const path = require('path');
const upload = multer({
  dest: path.join(__dirname, '../../uploads/services/'),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// list
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM services ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// create (with optional image)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    let image_url = null;
    if (req.file) {
      // adjust URL path as your frontend serves /uploads
      image_url = `/uploads/services/${req.file.filename}`;
    }
    const [result] = await db.promise().query('INSERT INTO services (title, description, image_url) VALUES (?, ?, ?)', [title, description, image_url]);
    const [rows] = await db.promise().query('SELECT * FROM services WHERE id = ?', [result.insertId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// read single
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM services WHERE id = ?', [req.params.id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// update
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    let image_url = null;
    if (req.file) image_url = `/uploads/services/${req.file.filename}`;
    const query = image_url
      ? 'UPDATE services SET title = ?, description = ?, image_url = ? WHERE id = ?'
      : 'UPDATE services SET title = ?, description = ? WHERE id = ?';
    const params = image_url ? [title, description, image_url, req.params.id] : [title, description, req.params.id];
    await db.promise().query(query, params);
    const [rows] = await db.promise().query('SELECT * FROM services WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// delete
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.promise().query('DELETE FROM services WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

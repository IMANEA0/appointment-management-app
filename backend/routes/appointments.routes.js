const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');

router.get('/', appointmentController.getAll);
router.post('/', appointmentController.create);
router.put('/:id', appointmentController.update);
router.delete('/:id', appointmentController.delete);

module.exports = router;

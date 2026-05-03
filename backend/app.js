const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const userRoutes = require('./routes/users.routes');
const appointmentRoutes = require('./routes/appointments.routes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/users', userRoutes);
app.use('/appointments', appointmentRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});

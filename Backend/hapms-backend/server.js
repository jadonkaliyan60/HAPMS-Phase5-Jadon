const bcrypt = require('bcrypt');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '!dEfFfT5',
  database: 'hapms_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error(err.stack);
    return;
  }
  console.log('Successfully connected to the MySQL hapms_db database!');
  connection.release();
});

app.get('/api/status', (req, res) => {
  res.json({ message: 'HAPMS Backend API is running and connected!' });
});


app.get('/api/doctors', (req, res) => {
  const query = `
    SELECT d.DoctorID as id, d.FirstName as firstName, d.LastName as lastName, 
           d.Specialization as specialization, dept.DepartmentName as department 
    FROM DoctorTable d 
    JOIN DepartmentTable dept ON d.DepartmentID = dept.DepartmentID
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    const formattedDoctors = results.map(doc => {
      const last = doc.lastName.trim() === '-' || !doc.lastName.trim() ? '' : ` ${doc.lastName}`;
      return {
        id: doc.id,
        name: `Dr. ${doc.firstName}${last}`,
        department: doc.department,
        specialty: doc.specialization
      };
    });
    res.json(formattedDoctors);
  });
});

app.get('/api/appointments/availability', async (req, res) => {
  const { doctorId, month } = req.query;
  try {
    const [bookings] = await db.promise().query(
      `SELECT CAST(AppointmentDate AS CHAR) AS ApptDate, AppointmentTime 
       FROM AppointmentTable 
       WHERE DoctorID = ? AND AppointmentDate LIKE ? AND Status != 'Cancelled'`,
      [doctorId, `${month}%`]
    );
    const bookedSlots = bookings.map(b => `${b.ApptDate}T${b.AppointmentTime}`);
    const days = [];
    const [year, monthNum] = month.split('-');
    const daysInMonth = new Date(year, parseInt(monthNum), 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${monthNum}-${String(i).padStart(2, '0')}`;
      const dayOfWeek = new Date(dateStr).getDay();
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const slots = [];
        ['09:00:00', '09:30:00', '10:00:00', '11:00:00', '14:00:00'].forEach(time => {
          const slotDateTime = `${dateStr}T${time}`;
          const isBooked = bookedSlots.includes(slotDateTime);
          slots.push({
            startsAt: slotDateTime,
            state: isBooked ? 'booked' : 'available'
          });
        });
        days.push({ date: dateStr, slots });
      }
    }
    res.json(days);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load availability' });
  }
});

app.post('/api/appointments', async (req, res) => {
  const { department, doctorId, startsAt, reason, patientId } = req.body;
  const [date, time] = startsAt.split('T');
  const appointmentId = 'APT-' + Date.now().toString().slice(-8);
  try {
    await db.promise().query(
      `INSERT INTO AppointmentTable (AppointmentID, PatientID, DoctorID, AppointmentDate, AppointmentTime, ReasonForVisit, Status) 
       VALUES (?, ?, ?, ?, ?, ?, 'Scheduled')`,
      [appointmentId, patientId, doctorId, date, time, reason]
    );
    res.json({
      id: appointmentId,
      patientId,
      doctorId,
      department,
      startsAt,
      reason,
      status: 'scheduled'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

app.get('/api/appointments/patient/:patientId', async (req, res) => {
  try {
    const [appointments] = await db.promise().query(
      `SELECT 
         a.AppointmentID, a.PatientID, a.DoctorID, CAST(a.AppointmentDate AS CHAR) AS ApptDate, 
         a.AppointmentTime, a.ReasonForVisit, a.Status,
         d.FirstName, d.LastName, d.Specialization, dept.DepartmentName
       FROM AppointmentTable a
       JOIN DoctorTable d ON a.DoctorID = d.DoctorID
       JOIN DepartmentTable dept ON d.DepartmentID = dept.DepartmentID
       WHERE a.PatientID = ? 
       ORDER BY a.AppointmentDate DESC, a.AppointmentTime DESC`,
      [req.params.patientId]
    );
    const formattedAppointments = appointments.map(appt => {
        const timeString = appt.AppointmentTime.length === 5 ? `${appt.AppointmentTime}:00` : appt.AppointmentTime;
        return {
            id: appt.AppointmentID,
            patientId: appt.PatientID,
            doctorId: appt.DoctorID,
            startsAt: `${appt.ApptDate}T${timeString}`,
            reason: appt.ReasonForVisit,
            status: appt.Status.toLowerCase(),
            doctor: {
                id: appt.DoctorID,
                fullName: `Dr. ${appt.FirstName} ${appt.LastName}`,
                specialty: appt.Specialization,
                department: appt.DepartmentName,
                room: '204'
            }
        };
    });
    res.json(formattedAppointments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

const cancelAppointment = async (req, res) => {
  try {
    await db.promise().query(
      `UPDATE AppointmentTable SET Status = 'Cancelled' WHERE AppointmentID = ?`,
      [req.params.id]
    );
    const [updated] = await db.promise().query(
      `SELECT 
         a.AppointmentID, a.PatientID, a.DoctorID, CAST(a.AppointmentDate AS CHAR) AS ApptDate, 
         a.AppointmentTime, a.ReasonForVisit, a.Status,
         d.FirstName, d.LastName, d.Specialization
       FROM AppointmentTable a
       JOIN DoctorTable d ON a.DoctorID = d.DoctorID
       WHERE a.AppointmentID = ?`,
      [req.params.id]
    );
    if (updated.length === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
    }
    const appt = updated[0];
    const timeString = appt.AppointmentTime.length === 5 ? `${appt.AppointmentTime}:00` : appt.AppointmentTime;
    res.json({
        id: appt.AppointmentID,
        patientId: appt.PatientID,
        doctorId: appt.DoctorID,
        startsAt: `${appt.ApptDate}T${timeString}`,
        reason: appt.ReasonForVisit,
        status: 'cancelled',
        doctorName: `Dr. ${appt.FirstName} ${appt.LastName}`,
        speciality: appt.Specialization,
        consultationType: 'Consultation',
        room: '204'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

app.patch('/api/appointments/:id', cancelAppointment);
app.delete('/api/appointments/:id', cancelAppointment);

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.promise().query(
      'SELECT UserID, Username, PasswordHash, Role, Email FROM UserTable WHERE Email = ? AND IsActive = 1',
      [email]
    );
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
    res.status(200).json({
      id: user.UserID,
      fullName: user.Username,
      email: user.Email,
      role: user.Role.toLowerCase() === 'administrator' ? 'admin' : user.Role.toLowerCase(),
      patientNumber: user.Role === 'Patient' ? user.UserID : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while authenticating.' });
  }
});

app.patch('/api/users/:id/restore', async (req, res) => {
  try {
    await db.promise().query('UPDATE UserTable SET IsActive = 1 WHERE UserID = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore user' });
  }
});

app.delete('/api/users/:id/permanent', async (req, res) => {
  try {
    const [user] = await db.promise().query('SELECT Role FROM UserTable WHERE UserID = ?', [req.params.id]);
    if (user.length > 0) {
        if (user[0].Role === 'Doctor') {
            await db.promise().query('DELETE FROM DoctorTable WHERE UserID = ?', [req.params.id]);
        } else if (user[0].Role === 'Patient') {
            await db.promise().query('DELETE FROM PatientTable WHERE UserID = ?', [req.params.id]);
        }
    }
    await db.promise().query('DELETE FROM UserTable WHERE UserID = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to permanently delete user' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    const [existing] = await db.promise().query('SELECT Email FROM UserTable WHERE Email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const unifiedID = 'PAT-' + Math.floor(Math.random() * 1000000);
    
    const names = fullName.split(' ');
    const firstName = names[0];
    const lastName = names.length > 1 ? names.slice(1).join(' ') : '';
    
    await db.promise().query(
      'INSERT INTO UserTable (UserID, Username, PasswordHash, Role, Email, IsActive, CreatedAt) VALUES (?, ?, ?, ?, ?, 1, NOW())',
      [unifiedID, fullName, hashedPassword, 'Patient', email]
    );
    await db.promise().query(
      'INSERT INTO PatientTable (PatientID, UserID, FirstName, LastName) VALUES (?, ?, ?, ?)',
      [unifiedID, unifiedID, firstName, lastName]
    );
    
    res.status(201).json({
      id: unifiedID,
      fullName: fullName,
      email: email,
      role: 'patient',
      patientNumber: unifiedID
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while registering.' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const [users] = await db.promise().query(
      'SELECT UserID as id, Username as name, Email as email, Role as role, IsActive as status FROM UserTable ORDER BY CreatedAt DESC'
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users/staff', async (req, res) => {
  const { fullName, email, password, role } = req.body;
  try {
    const [existing] = await db.promise().query('SELECT Email FROM UserTable WHERE Email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    
    let prefix = 'STF-';
    if (role === 'Doctor') prefix = 'DOC-';
    else if (role === 'Nurse') prefix = 'NUR-';
    else if (role === 'Administrator') prefix = 'ADM-';
    
    const unifiedID = prefix + Math.floor(Math.random() * 1000000);
    
    await db.promise().query(
      'INSERT INTO UserTable (UserID, Username, PasswordHash, Role, Email, IsActive, CreatedAt) VALUES (?, ?, ?, ?, ?, 1, NOW())',
      [unifiedID, fullName, hashedPassword, role, email]
    );
    
    if (role === 'Doctor') {
      const names = fullName.trim().split(' ');
      const fName = names[0];
      const lName = names.length > 1 ? names.slice(1).join(' ') : '-'; 
      
      
      const licenseNumber = 'LIC-' + Date.now();
      
      await db.promise().query(
        'INSERT INTO DoctorTable (DoctorID, UserID, DepartmentID, FirstName, LastName, LicenseNumber, AvailabilityStatus) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [unifiedID, unifiedID, 'DEPT-01', fName, lName, licenseNumber, 'Available']
      );
    }
    res.status(201).json({ id: unifiedID, name: fullName, email, role, status: 1 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create staff' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await db.promise().query('UPDATE UserTable SET IsActive = 0 WHERE UserID = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.get('/api/nurse/appointments', async (req, res) => {
  try {
    const [appointments] = await db.promise().query(
      `SELECT 
         a.AppointmentID as id, a.PatientID as patientId, a.DoctorID as doctorId, 
         CAST(a.AppointmentDate AS CHAR) AS date, a.AppointmentTime as time, 
         a.ReasonForVisit as reason, a.Status as status,
         p.FirstName as pFirst, p.LastName as pLast,
         d.FirstName as dFirst, d.LastName as dLast
       FROM AppointmentTable a
       JOIN PatientTable p ON a.PatientID = p.PatientID
       JOIN DoctorTable d ON a.DoctorID = d.DoctorID
       ORDER BY a.AppointmentDate ASC, a.AppointmentTime ASC`
    );
    const formatted = appointments.map(a => ({
      id: a.id,
      patientName: `${a.pFirst} ${a.pLast}`,
      doctorName: `Dr. ${a.dFirst} ${a.dLast}`,
      datetime: `${a.date} at ${a.time.substring(0,5)}`,
      reason: a.reason,
      status: a.status
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

app.patch('/api/nurse/appointments/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await db.promise().query(
      'UPDATE AppointmentTable SET Status = ? WHERE AppointmentID = ?',
      [status, req.params.id]
    );
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.get('/api/doctor/appointments', async (req, res) => {
  const doctorId = req.query.doctorId;
  const date = req.query.date;
  try {
    const [appointments] = await db.promise().query(
      `SELECT 
         a.AppointmentID as id, a.PatientID as patientId, 
         a.AppointmentTime as time, a.ReasonForVisit as reason, a.Status as status,
         p.FirstName as pFirst, p.LastName as pLast
       FROM AppointmentTable a
       JOIN PatientTable p ON a.PatientID = p.PatientID
       WHERE a.DoctorID = ? AND a.AppointmentDate = ?
       ORDER BY a.AppointmentTime ASC`,
      [doctorId, date]
    );
    const formatted = appointments.map(a => ({
      id: a.id,
      patientName: `${a.pFirst} ${a.pLast}`,
      time: a.time.substring(0, 5),
      reason: a.reason,
      status: a.status
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load schedule' });
  }
});

app.get('/api/doctor/appointments/upcoming', async (req, res) => {
  const doctorId = req.query.doctorId;
  try {
    const [appointments] = await db.promise().query(
      `SELECT 
         a.AppointmentID as id, a.PatientID as patientId, 
         CAST(a.AppointmentDate AS CHAR) as date,
         a.AppointmentTime as time, a.ReasonForVisit as reason, a.Status as status,
         p.FirstName as pFirst, p.LastName as pLast
       FROM AppointmentTable a
       JOIN PatientTable p ON a.PatientID = p.PatientID
       WHERE a.DoctorID = ? AND a.AppointmentDate >= CURDATE()
       ORDER BY a.AppointmentDate ASC, a.AppointmentTime ASC`,
      [doctorId]
    );
    const formatted = appointments.map(a => ({
      id: a.id,
      patientName: `${a.pFirst} ${a.pLast}`,
      time: `${a.date} | ${a.time.substring(0, 5)}`,
      reason: a.reason,
      status: a.status
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load upcoming schedule' });
  }
});

app.patch('/api/doctor/appointments/:id/complete', async (req, res) => {
  try {
    await db.promise().query(
      "UPDATE AppointmentTable SET Status = 'Completed' WHERE AppointmentID = ?",
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete appointment' });
  }
});

app.get('/api/auth/seed', async (req, res) => {
  try {
    await db.promise().query(`DELETE FROM UserTable WHERE Email IN ('patient@hapms.demo', 'doctor@hapms.demo', 'nurse@hapms.demo', 'admin@hapms.demo')`);
    
    const testPassword = await bcrypt.hash('password123', 10);
    await db.promise().query(`INSERT IGNORE INTO DepartmentTable (DepartmentID, DepartmentName, Location) 
                    VALUES ('DEPT-01', 'General Medicine', 'Room 204')`);
    
    await db.promise().query(`INSERT IGNORE INTO UserTable (UserID, Username, PasswordHash, Role, Email, IsActive, CreatedAt) VALUES
      ('PAT-00128', 'Emma Bennett', ?, 'Patient', 'patient@hapms.demo', 1, NOW()),
      ('DOC-001', 'Olivia Chen', ?, 'Doctor', 'doctor@hapms.demo', 1, NOW()),
      ('NUR-001', 'Sarah Mitchell', ?, 'Nurse', 'nurse@hapms.demo', 1, NOW()),
      ('ADM-001', 'Alex Morgan', ?, 'Administrator', 'admin@hapms.demo', 1, NOW())`,
      [testPassword, testPassword, testPassword, testPassword]
    );
    
    await db.promise().query(`INSERT IGNORE INTO PatientTable (PatientID, UserID, FirstName, LastName) 
                    VALUES ('PAT-00128', 'PAT-00128', 'Emma', 'Bennett')`);
    await db.promise().query(`INSERT IGNORE INTO DoctorTable (DoctorID, UserID, DepartmentID, FirstName, LastName, AvailabilityStatus) 
                    VALUES ('DOC-001', 'DOC-001', 'DEPT-01', 'Olivia', 'Chen', 'Available')`);
                    
    res.send(`
      <h2>Database</h2>
      <p>Test accounts</p>
      <ul>
        <li><b>Patient:</b> patient@hapms.demo</li>
        <li><b>Doctor:</b> doctor@hapms.demo</li>
        <li><b>Nurse:</b> nurse@hapms.demo</li>
        <li><b>Admin:</b> admin@hapms.demo</li>
      </ul>
      <p><b>Password:</b> password123</p>
    `);
  } catch (error) {
    res.status(500).send('Error seeding database. Check your terminal for details.');
  }
});

app.listen(3000, () => {
  console.log('Backend API server running on http://localhost:3000');
});
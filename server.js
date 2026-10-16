const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const port = process.env.PORT || 3090;
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/students';

const app = express();
// Serve only public assets if you add them; avoid exposing the entire repo
app.use(express.static(path.join(__dirname)));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Mongoose configuration and connection with better handling
mongoose.set('strictQuery', false);

async function connectDB() {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB successfully connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Exit the process if we can't connect to the DB — optional
    // process.exit(1);
  }
}
connectDB();

const userschema = new mongoose.Schema({
  regno: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  year: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  branch: { type: String, required: true, trim: true },
  projectTitle: { type: String, required: true, trim: true },
  selectionNumber: { type: Number, required: true, min: 1 },
  projectDescription: { type: String, required: true, trim: true }
}, { timestamps: true });

// Model name 'Student' and explicitly use the 'students' collection
const Student = mongoose.model('Student', userschema, 'students');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/submit', async (req, res) => {
  try {
    // Convert selectionNumber to a number (form fields are strings)
    const payload = {
      ...req.body,
      selectionNumber: req.body.selectionNumber ? Number(req.body.selectionNumber) : undefined
    };

    const { regno, name, email, password, year, branch, projectTitle, selectionNumber, projectDescription } = payload;

    if (!regno || !name || !email || !password || !year || !branch || !projectTitle || !selectionNumber || !projectDescription) {
      return res.sendFile(path.join(__dirname, 'failure.html'));
    }

    // Create a new Student document
    const student = new Student({ regno, name, email, password, year, branch, projectTitle, selectionNumber, projectDescription });
    await student.save();
    console.log('Saved:', student);

    return res.sendFile(path.join(__dirname, 'success.html'));
  } catch (err) {
    console.error('Error saving student:', err);
    return res.status(500).send('Error submitting form');
  }
});

// List all student submissions in a simple HTML table
app.get('/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ selectionNumber: 1, name: 1 }).lean();
    let html = `<!doctype html><html><head><meta charset="utf-8"><title>Students</title><style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f4f4f4}</style></head><body><h1>All Student Submissions</h1><table><thead><tr><th>USN</th><th>Name</th><th>Email</th><th>Year</th><th>Branch</th><th>Project Title</th><th>Selection Number</th><th>Project Description</th></tr></thead><tbody>`;
    for (const s of students) {
      html += `<tr><td>${s.regno}</td><td>${s.name}</td><td>${s.email}</td><td>${s.year}</td><td>${s.branch}</td><td>${s.projectTitle}</td><td>${s.selectionNumber}</td><td>${(s.projectDescription || '')}</td></tr>`;
    }
    html += `</tbody></table></body></html>`;
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching students');
  }
});

// Aggregate unique projects and show students working on each
app.get('/unique-projects', async (req, res) => {
  try {
    const list = await Student.aggregate([
      { $group: { _id: '$projectTitle', count: { $sum: 1 }, students: { $push: { regno: '$regno', name: '$name', selectionNumber: '$selectionNumber', projectDescription: '$projectDescription' } } } },
      { $sort: { count: -1, _id: 1 } }
    ]);

    let html = `<!doctype html><html><head><meta charset="utf-8"><title>Unique Projects</title><style>h2{margin-top:24px}ul{margin:0 0 20px 20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}</style></head><body><h1>Unique Projects</h1>`;
    for (const p of list) {
      html += `<section><h2>${p._id} <small>(${p.count} student${p.count > 1 ? 's' : ''})</small></h2>`;
      html += `<table><thead><tr><th>USN</th><th>Name</th><th>Selection Number</th><th>Project Description</th></tr></thead><tbody>`;
      for (const st of p.students) {
        html += `<tr><td>${st.regno}</td><td>${st.name}</td><td>${st.selectionNumber}</td><td>${st.projectDescription || ''}</td></tr>`;
      }
      html += `</tbody></table></section>`;
    }
    html += `</body></html>`;
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching unique projects');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received: closing mongoose connection');
  await mongoose.disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

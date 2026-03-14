const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();  

const port = process.env.PORT || 3090;
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/students';

const app = express();
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));


mongoose.connect(mongoUri)
  .then(() => console.log("MongoDB successfully connected"))
  .catch(err => console.error("MongoDB connection error:", err));

const userschema = new mongoose.Schema({
  regno: String,
  name: String,
  email: String,
  year: String,
  password: String,
  branch: String
});

const usermodel = mongoose.model("data", userschema);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

app.post('/submit', async (req, res) => {
  try {
    const { regno, name, email, password, year, branch } = req.body;
    const data = new usermodel({ regno, name, email, password, year, branch });
    await data.save();
    console.log(data);
    res.send("FORM SUCCESSFULLY SUBMITTED");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error submitting form");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
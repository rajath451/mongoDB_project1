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
  regno: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  year: { type: String, required: true },
  password: { type: String, required: true },
  branch: { type: String, required: true }
});

const usermodel = mongoose.model("data", userschema);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

app.post('/submit', async (req, res) => {
  try {
    const { regno, name, email, password, year, branch } = req.body;

    
   if (!regno || !name || !email || !password || !year || !branch) {
      return res.sendFile(path.join(__dirname, 'failure.html'));
    }


    //MongoDB
    const data = new usermodel({ regno, name, email, password, year, branch });
    await data.save();
    console.log("Saved:", data);

     res.sendFile(path.join(__dirname, 'success.html'));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error submitting form");
  }
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

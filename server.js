const express = require('express');
const mongoose = require('mongoose');  
const path = require('path');

const port = 3090;
const app = express();
app.use(express.static(__dirname))
app.use(express.urlencoded({extended:true}))
mongoose.connect('mongodb://127.0.0.1:27017/students')
const db = mongoose.connection
db.once('open', () => {
    console.log("Mongodb is sucessfully connected");
})

const userschema = new mongoose.Schema({
    regno:String,
    name:String,
    email:String,
    year:String,
    branch:String
})
const usermodel = mongoose.model("data", userschema)

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'))
})

app.post('/submit',async (req,res)=>{
    const {regno,name,email,year,branch} = req.body
    const data = new usermodel({
        regno,name,email,year,branch
    })
    await data.save()
    console.log(data)
    res.send("FORM SUUCESSFULLY SUBMITTED")
})

app.listen(port, () => {
    console.log("server is running on port", port)
})
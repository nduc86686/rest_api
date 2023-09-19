const express = require('express')
const bodyParser = require('body-parser')
const feedRoutes = require('./routes/feed')
const authRoutes = require('./routes/auth')
const mongoose = require('mongoose')
const app = express()
const path = require('path')
const {v4: uuidv4} = require('uuid');
const multer = require('multer');
const cors=require("cors");
app.use(bodyParser.json()) // application/json

app.use(cors());
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images');
    },
    filename: function (req, file, cb) {
        cb(null, uuidv4())
    }
});

app.use((req, res, next) => {
    // res.setHeader('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE'); // Bao gồm POST và PUT
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});


app.use(multer({storage: storage, fileFilter: fileFilter}).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/feed', feedRoutes)
app.use('/auth', authRoutes)



// Use this after the variable declaration

app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    const data=error.data;
    res.status(status).json({message: message,data:data});
});

mongoose.connect('mongodb+srv://nduc99911:nduc99911@cluster0.rwpau.mongodb.net/messages?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(result => {

    const server=app.listen(8080)
    const io = require('./socket.io').init(server);
    io.on('connection', socket => {
        console.log('Client connected');
    });
}).catch(err => console.log(err))

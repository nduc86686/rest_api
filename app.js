const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs');

const mongoose = require('mongoose')
const app = express()
const path = require('path')
const {v4: uuidv4} = require('uuid');
const multer = require('multer');
const cors = require("cors");

const { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./graphql/schema')
const graphqlResolver = require('./graphql/resolvers')
const auth = require('./middleware/auth')

const {clearImage} = require('./utils/file')

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
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200); // OPTIONS request không cần phải xử lý gì nữa
    }
    next();
});

app.use(auth);


app.use(multer({storage: storage, fileFilter: fileFilter}).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(auth)
app.put('/post-image', (req, res, next) => {
    if(!req.isAuth){
        throw new Error('Not authenticated!');
    }
   if(!req.files){
       res.status(200).json({message: 'No file provided!'});
   }
   console.log('req.file.path', req.body)
   if(req.body.oldPath){
       clearImage(req.body.oldPath);
   }

   res.status(201).json({message: 'File stored', filePath: req.file.path});

});
// Use this after the variable declaration
app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    // graphiql: true,
    formatError(err) {
        ///Đầu tiên, nó kiểm tra xem err.originalError có tồn tại hay không. Nếu không có, điều này có nghĩa là lỗi không phải
        // là một lỗi tùy chỉnh mà đã được sinh ra bởi GraphQL. Trong trường hợp này, bạn trả về lỗi gốc mà không thay đổi.
        if (!err.originalError) {
            return err;
        }
        //Nếu err.originalError tồn tại, đó là lỗi tùy chỉnh bạn đã tạo ra. Bạn trích xuất thông tin từ err.originalError, bao gồm data, message, và code (hoặc sử dụng giá trị mặc định nếu chúng không tồn tại).
        // Sau đó, bạn trả về một đối tượng mới chứa thông tin này.
        const data = err.originalError.data;
        const message = err.message || 'An error occurred.';
        const code = err.originalError.code || 500;
        return {message: message, status: code, data: data};
    }
}));
app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message: message, data: data});
});

mongoose.connect('mongodb+srv://nduc99911:nduc99911@cluster0.rwpau.mongodb.net/post?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(result => {
    app.listen(8080)

}).catch(err => console.log(err))


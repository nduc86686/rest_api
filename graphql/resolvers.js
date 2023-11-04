const userModel = require('../models/user')
const postModel = require('../models/post')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {clearImage} = require('../utils/file')

module.exports = {
    createUser: async function ({userInput}, req) {
        const errors = [];
        if (!validator.isEmail(userInput.email)) {
            errors.push({message: 'E-Mail is invalid.'})
        }
        if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, {min: 5})) {
            errors.push({message: 'Password too short!'})
        }
        if (errors.length > 0) {
            const error = new Error('Invalid input.');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        const email = userInput.email;
        const name = userInput.name;
        const password = userInput.password;
        const existingUser = await userModel.findOne({email: email})
        if (existingUser) {
            throw new Error('User exists already!');
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new userModel({
            email: email,
            name: name,
            password: hashedPassword
        })
        const createdUser = await user.save();
        return {...createdUser._doc, _id: createdUser._id.toString()}
    },

    login: async function ({email, password}) {
        console.log('user', email, password)
        const user = await userModel.findOne({email: email})

        if (!user) {
            const error = new Error('User not found.')
            error.code = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password)
        console.log('user', isEqual)
        if (!isEqual) {
            const error = new Error('Password is incorrect.')
            error.code = 401;
            throw error;
        }
        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        }, 'someSuperSecretSecret', {
            expiresIn: '1h'
        });
        return {token: token, userId: user._id.toString()}
    },

    createPost: async function ({postInput}, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated.')
            error.code = 401;
            throw error;
        }
        const errors = [];
        if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, {min: 5})) {
            errors.push({message: 'Title is invalid.'})
        }
        if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, {min: 5})) {
            errors.push({message: 'Content is invalid.'})
        }
        if (errors.length > 0) {
            const error = new Error('Invalid input.');
            error.data = errors;
            error.code = 422;
            throw error;
        }
        const user = await userModel.findById(req.userId)
        if (!user) {
            const error = new Error('Invalid user.');
            error.code = 401;
            throw error;
        }
        const post = new postModel({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl,
            creator: {
                name: user.name,
                _id: user._id
            }
        })
        const createdPost = await post.save();
        user.posts.push(createdPost)
        await user.save()

        return {
            ...createdPost._doc,
            _id: createdPost._id.toString(),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()
        }
    },

    posts: async function ({page}, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated.')
            error.code = 401;
            throw error;
        }
        if(!page){
            page=1;
        }
        const perPage=2;
        const totalPosts=await postModel.find().countDocuments();
        const posts = await postModel.find().sort({createdAt: -1})
            .skip((page-1)*perPage)
            .limit(perPage)
            .populate('creator')
        return {
            posts: posts.map(p => {
                return {
                    ...p._doc,
                    _id: p._id.toString(),
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString()
                }
            }),
            totalPosts: totalPosts
            }
        // if (!page) {
        //     page = 1;
        // }
        // const perPage = 2;
        // const totalPosts = await postModel.find().countDocuments()
        // const posts = await postModel.find().sort({createdAt: -1}).skip((page - 1) * perPage).limit(perPage).populate('creator')
        // return {
        //     posts: posts.map(p => {
        //         return {
        //             ...p._doc,
        //             _id: p._id.toString(),
        //             createdAt: p.createdAt.toISOString(),
        //             updatedAt: p.updatedAt.toISOString()
        //         }
        //     }),
        //     totalPosts: totalPosts
        // }
    },

    post: async function ({id}, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated.')
            error.code = 401;
            throw error;
        }
        const post = await postModel.findById(id).populate('creator')
        if (!post) {
            const error = new Error('No post found!')
            error.code = 404;
            throw error;
        }
        return {
            ...post._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()
        }
    },
    updatePost: async function ({id, postInput}, req) {
        if(!req.isAuth){
            const error = new Error('Not authenticated.')
            error.code = 401;
            throw error;
        }
        const post = await postModel.findById(id).populate('creator')
        if (!post) {
            const error = new Error('No post found!')
            error.code = 404;
            throw error;
        }
        if(post.creator._id.toString()!==req.userId.toString()){
            const error = new Error('Not authorized!')
            error.code = 403;
            throw error;
        }
        const errors = [];
        if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, {min: 5})) {
            errors.push({message: 'Title is invalid.'})
        }
        if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, {min: 5})) {
            errors.push({message: 'Content is invalid.'})
        }
        if (errors.length > 0) {
            const error = new Error('Invalid input.');
            error.data = errors;
            error.code = 422;
            throw error;
        }
        post.title=postInput.title;
        post.content=postInput.content;
        if(postInput.imageUrl!== 'undefined'){
            post.imageUrl=postInput.imageUrl;
        }
        const updatedPost=await post.save();
        return {
            ...updatedPost._doc,
            _id: updatedPost._id.toString(),
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString()
        }
    },
    deletePost: async function ({id}, req) {
        if(!req.isAuth){
            const error = new Error('Not authenticated.')
            error.code = 401;
            throw error;
        }
        const post = await postModel.findById(id)
        if (!post) {
            const error = new Error('No post found!')
            error.code = 404;
            throw error;
        }
        if(post.creator.toString()!==req.userId.toString()){
            const error = new Error('Not authorized!')
            error.code = 403;
            throw error;
        }
        clearImage(post.imageUrl)
        await postModel.findByIdAndRemove(id);
        const user=await userModel.findById(req.userId);
        user.posts.pull(id);
        await user.save();
        return true;
    },
    user: async function (args, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated.')
            error.code = 401;
            throw error;
        }
        const user = await userModel.findById(req.userId)
        if (!user) {
            const error = new Error('No user found!')
            error.code = 404;
            throw error;
        }
        return {
            ...user._doc,
            _id: user._id.toString()
        }
    },
    updateStatus: async function ({status}, req) {
        if(!req.isAuth){
            const error = new Error('Not authenticated.')
            error.code = 401;
            throw error;
        }
        const user = await userModel.findById(req.userId)
        if (!user) {
            const error = new Error('No user found!')
            error.code = 404;
            throw error;
        }
        user.status=status;
        await user.save();
        return {
            ...user._doc,
            _id: user._id.toString()
        }
    }


}
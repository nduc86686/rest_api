const express = require('express');
const {body} = require('express-validator');
const router = express.Router();
const isAuth = require('../middleware/is-auth');

const feedController = require('../controllers/feed');

router.get('/posts', isAuth, feedController.getPosts);

router.post('/posts',isAuth, [
    body('title').trim().isLength({max: 5}),
    body('content').trim().isLength({min: 5})

], feedController.createPost);

router.get('/posts/:postId', isAuth, feedController.getPostsById);

router.put('/posts/:postId', isAuth, [
    body('title').trim().isLength({max: 5}),
    body('content').trim().isLength({min: 5})
], feedController.updatePost);

router.delete('/posts/:postId', isAuth, feedController.deletePost);
module.exports = router;
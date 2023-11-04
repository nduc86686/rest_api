const jsonwebtoken = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if(!authHeader){
        req.isAuth = false;
        return next();
        // const error = new Error('Not authenticated');
        // error.statusCode = 401;
        // throw error;
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    if (!authHeader) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error;
    }
    try {
        decodedToken = jsonwebtoken.verify(token, 'someSuperSecretSecret');

    } catch (e) {
        req.isAuth = false;
        return next();
    }
    if (!decodedToken) {
        req.isAuth = false;
        return next();
    }
    req.userId = decodedToken.userId;
    console.log('req.userId', req.userId)
    req.isAuth = true;
    next();
}
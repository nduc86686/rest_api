const jsonwebtoken = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if(!authHeader){
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error;
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    if (!authHeader) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error;
    }
    try {
        decodedToken = jsonwebtoken.verify(token, 'somesupersecretsecret');

    } catch (e) {
        e.statusCode = 500;
        throw e;
    }
    if (!decodedToken) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error;
    }
    req.userId = decodedToken.userId;
    next();
}
const cors = require('cors');

const corsOptions = {
    origin: function (origin, callback) {
        // En desarrollo, permitir localhost y sin origen (postman)
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        // En producción, permitir solo dominios específicos
        const allowedOrigins = [
            'https://tubrethersbarbershop.com',
            'https://www.tubrethersbarbershop.com'
        ];
        
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);
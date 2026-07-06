import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(), // Log to console
        new winston.transports.File({ filename: 'error.log', level: 'error' }) // Log errors to a file
    ],
});

// clear logs after 7 days
// setInterval(() => {
//     logger.clear()
// }, 1000 * 60 * 60 * 24 * 7);

export default logger;
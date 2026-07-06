import logger from "../config/logger.js";

const globalErrorHandler = (err, req, res, next) => {
    // Log the error details
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
    });

    if (err.name === "MulterError") {
        return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`,
            field: err.field,
        });
    }

    const statusCode = err.statusCode || 500; // Default to 500 if no status code is set
    const message = err.message || 'Something went wrong. Please try again later.';

    return res.status(statusCode).json({
        success: false,
        message
    });
};

export { globalErrorHandler };
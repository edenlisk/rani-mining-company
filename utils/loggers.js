const { createLogger, transports, format } = require('winston');
const myFormat = format.printf(({level, message, timestamp}) => {
    return `${timestamp} - ${level}: ${message}`;
})
const logger = createLogger(
    {
        transports: [
            new transports.Console(),
            new transports.File({
                level: "info",
                filename: "loggings.log"
            }),
        ],
        format: format.combine(
            format.json(),
            format.timestamp(),
            myFormat
        )
    }
)

const requestLogger = createLogger(
    {
        transports: [
            new transports.File({
                level: "warn",
                filename: "requestLoggings.log"
            }),
        ],
        format: format.combine(
            format.json(),
            format.timestamp(),
            format.prettyPrint(),
            format.metadata()
        )
    }
)

module.exports = {
    logger,
    requestLogger
};
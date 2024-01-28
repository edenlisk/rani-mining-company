const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require('express-session');
const hpp = require('hpp');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const expressWinston = require('express-winston');
const { requestLogger, logger: appLogger } = require('./utils/loggers');
const { deleteOverDueLogs } = require('./utils/cron');


// const entriesRouter = require('./routes/entriesRouter');
// const riskAssessmentRouter = require('./routes/riskAssessmentRouter');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/usersRouter');
const entryRouter = require('./routes/entryRouter');
const buyersRouter = require('./routes/buyersRouter');
const contractsRouter = require('./routes/contractsRouter');
const shipmentsRouter = require('./routes/shipmentsRouter');
const dueDiligenceRouter = require('./routes/dueDiligenceRouter');
const paymentsRouter = require('./routes/paymentsRouter');
const suppliersRouter = require('./routes/suppliersRouter');
// const cassiteriteRouter = require('./routes/cassiteriteRouter');
// const coltanRouter = require('./routes/coltanRouter');
// const wolframiteRouter = require('./routes/wolframiteRouter');
// const lithiumRouter = require('./routes/lithiumRouter');
// const berylliumRouter = require('./routes/berylliumRouter');
// const mixedRouter = require('./routes/mixedRouter');
const advancePaymentRouter = require('./routes/advancePaymentsRouter');
const statisticsRouter = require('./routes/statisticsRouter');
const settingsRouter = require('./routes/settingsRouter');
const fileStructureRouter = require('./routes/fileStructureRouter');
const invoiceRouter = require('./routes/invoiceRouter');
const editPermissionRouter = require('./routes/editPermissionRouter');
const messageRouter = require('./routes/messageRouter');
const chatRouter = require('./routes/chatRouter');
const activityLogsRouter = require('./routes/activityLogsRouter');
const tagsRouter = require('./routes/tagsRouter');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json({limit: "50mb"}));
app.use(mongoSanitize());
app.use(xss());
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.set('trust proxy', 1);
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
}))
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
const corsOptions ={
    origin:'*',
    credentials: true,
    optionSuccessStatus:200,
}
app.use(cors(corsOptions));
deleteOverDueLogs();


const limiter = rateLimit(
    {
      max: 5000,
      windowMs: 60 * 60 * 1000,
      message: "Too many requests from this IP, please try again in an hour"
    }
)

app.use(hpp());
app.use(helmet());
app.use('/api', limiter);
app.use(expressWinston.logger({
    winstonInstance: requestLogger,
    statusLevels: true,
}))

app.use('/api/v1/', indexRouter);
// app.use('/api/v1/entries', entriesRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/buyers', buyersRouter);
app.use('/api/v1/entry', entryRouter);
app.use('/api/v1/contracts', contractsRouter);
app.use('/api/v1/shipments', shipmentsRouter);
app.use('/api/v1/payments', paymentsRouter)
app.use('/api/v1/suppliers', suppliersRouter);
app.use('/api/v1/duediligence', dueDiligenceRouter);
// app.use('/api/v1/coltan', coltanRouter);
// app.use('/api/v1/cassiterite', cassiteriteRouter);
// app.use('/api/v1/wolframite', wolframiteRouter);
// app.use('/api/v1/lithium', lithiumRouter);
// app.use('/api/v1/beryllium', berylliumRouter);
// app.use('/api/v1/mixed', mixedRouter);
app.use('/api/v1/stock', statisticsRouter);
app.use('/api/v1/advance-payment', advancePaymentRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/file-structure', fileStructureRouter);
app.use('/api/v1/invoice', invoiceRouter);
app.use('/api/v1/edit-request', editPermissionRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/message', messageRouter);
app.use('/api/v1/logs', activityLogsRouter);
app.use('/api/v1/tags', tagsRouter);
// app.use('/api/v1/risk-assessment', riskAssessmentRouter);
app.use(expressWinston.logger({
    winstonInstance: appLogger,
    statusLevels: true,
}))
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 400));
})
app.use(globalErrorHandler);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

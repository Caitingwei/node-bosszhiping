import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
// import router from './routes/index';
const cors = require('cors');
const app = express();
import offer from './routes/offer';

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true)
  },
  credentials: true,
};
app.options('*', cors(corsOptions)) // include before other routes
app.use(cors(corsOptions));

app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization,Origin,Accept,X-Requested-With');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('X-Powered-By', ' 3.2.1');
  res.header('Content-Type', 'application/json;charset=utf-8');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});


app.use('/api',offer);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});




import { pool } from './database/mysql';
import Database from './models/initialize';
import TaskControllers from './controllers/task'; // 定时任务
import CityControllers from './controllers/city';
import MenuControllers from './controllers/menu';
import ProxyController from './controllers/proxy';

pool.getConnection(async (err, connection) => {
  if (err) {
    console.error('error connecting');
    return;
  }
  console.log('mysql connecting');
  await Database.initializeDatabase(); // 初始化数据库
  await ProxyController.initTable(); // 初始化可用代理ip
  await CityControllers.initTable(); // 初始化地区表
  await MenuControllers.initTable(); // 初始化职位菜单
  // TaskControllers.reptileScheduled(); // 启动任务
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

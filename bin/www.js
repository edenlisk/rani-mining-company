#!/usr/bin/env node

/**
 * Module dependencies.
 */
const mongoose = require('mongoose');
const { Server } = require('socket.io');
require('dotenv').config();
const app = require('../app');
const debug = require('debug')('mining-company-management-system-backend:server');
const http = require('http');

// process.env.NODE_ENV=== 'development' ? process.env.MONGO_URL_DEV : process.env.MONGO_URL
mongoose.connect(process.env.MONGO_URL, {dbName: "rani-mining-company-management-system"})
    .then(() => console.log("database connection successful"))
    .catch(err => console.log(err.message))

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);
// Create a Socket.io server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
let inactiveUsers = [];
let activeUsers = [];
io.on('connection', (socket) => {

  socket.on('new-user-add', (userData) => {
    if (!activeUsers.some(user => user.userId === userData._id)) {
      activeUsers.push(
          {
            userId: userData._id,
            socketId: socket.id,
            username: userData.username,
            permissions: userData.permissions
          }
      )
    }
    io.emit('get-users', activeUsers);
  })

  socket.on('send-message', data => {
    const { receiverId } = data;
    const activeUser = activeUsers.find(user => user.userId === receiverId);
    // const inactiveUser = inactiveUsers.find(user => user.userId === receiverId);
    if (activeUser) {
      io.to(activeUser.socketId).emit('receive-message', data);
    }
  })

  socket.on('current-typing', data => {
    const { receiverId } = data;
    const activeUser = activeUsers.find(user => user.userId === receiverId);
    if (activeUser) {
      io.to(activeUser.socketId).emit('typing', data);
    }
  })

  socket.on("new-edit-request", data => {
    const admins = activeUsers.filter(user => {
      if (user.permissions.editRequests) {
        if (user.permissions.editRequests.authorize === true) {
            return true;
        }
      }
    });
    if (admins) {
      admins.forEach(admin => {
        io.to(admin.socketId).emit('new-edit-request', data);
      })
    }
  })

  socket.on("request-decision", ({decision, userName}) => {
    const user = activeUsers.find(user => user.username === userName);
    if (user) {
      io.to(user.socketId).emit(decision === true ? "request-authorized" : "request-rejected");
    }
  })


  // socket.on('register-conversation', newUserId => {
  //   if (!activeUsers.some(user => user.userId === newUserId) && !inactiveUsers.some(user => user.userId === newUserId)) {
  //     inactiveUsers.push(
  //         {
  //           userId: newUserId,
  //           socketId: socket.id
  //         }
  //     )
  //   }
  // })

  // Handle specific events here and emit data to clients as needed
  // For example, when a new operation is recorded:
  // socket.on('newOperation', (data) => {
  //   io.emit('operationUpdate', data);
  // });

  socket.on('disconnect', () => {
    activeUsers  = activeUsers.filter(user => user.socketId !== socket.id);
    io.emit('get-users', activeUsers);
  });
});
/**
 * Listen on provided port, on all network interfaces.
 */



server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const questions = require('./questions');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

let rooms = {}; // Store rooms and users

app.use(express.static('public'));

// Serve the homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('createRoom', (username) => {
    let roomId = `room-${Math.random().toString(36).substr(2, 9)}`;
    rooms[roomId] = {
      users: [{ id: socket.id, username }],
      gameStarted: false,
      questions: [],
      responses: {},
      scores: {}
    };
    socket.join(roomId);
    socket.emit('roomCreated', roomId);
    io.emit('updateLobby', rooms);
  });

  socket.on('joinRoom', (roomId, username) => {
    if (rooms[roomId] && rooms[roomId].users.length < 2) {
      rooms[roomId].users.push({ id: socket.id, username });
      socket.join(roomId);
      io.to(roomId).emit('roomJoined', roomId);
      io.emit('updateLobby', rooms);

      if (rooms[roomId].users.length === 2) {
        startGame(roomId);
      }
    }
  });

  socket.on('submitAnswer', (roomId, questionIndex, answer) => {
    if (rooms[roomId] && rooms[roomId].gameStarted) {
      if (!rooms[roomId].responses[socket.id]) {
        rooms[roomId].responses[socket.id] = [];
      }
      rooms[roomId].responses[socket.id][questionIndex] = answer;
      checkGameStatus(roomId);
    }
  });

  socket.on('disconnect', () => {
    for (let roomId in rooms) {
      if (rooms[roomId].users.some(user => user.id === socket.id)) {
        rooms[roomId].users = rooms[roomId].users.filter(user => user.id !== socket.id);
        io.to(roomId).emit('userDisconnected');
        delete rooms[roomId];
        io.emit('updateLobby', rooms);
      }
    }
    console.log('A user disconnected:', socket.id);
  });
});

function startGame(roomId) {
  rooms[roomId].gameStarted = true;
  rooms[roomId].questions = getRandomQuestions(5);
  rooms[roomId].responses = {
    [rooms[roomId].users[0].id]: [],
    [rooms[roomId].users[1].id]: []
  };
  rooms[roomId].scores = {
    [rooms[roomId].users[0].id]: 0,
    [rooms[roomId].users[1].id]: 0
  };
  io.to(roomId).emit('gameStarted', rooms[roomId].questions);
  setTimeout(() => endGame(roomId), 50000); // End game after 50 seconds
}

function checkGameStatus(roomId) {
  const users = rooms[roomId].users.map(user => user.id);
  const userResponses = rooms[roomId].responses;

  if (userResponses[users[0]].length === 5 && userResponses[users[1]].length === 5) {
    endGame(roomId);
  }
}

function endGame(roomId) {
  const users = rooms[roomId].users;
  const questions = rooms[roomId].questions;

  users.forEach(user => {
    for (let i = 0; i < questions.length; i++) {
      if (rooms[roomId].responses[user.id][i] === questions[i].answer) {
        rooms[roomId].scores[user.id] += 10;
      }
    }
  });

  const scoresWithUsernames = users.map(user => ({
    username: user.username,
    score: rooms[roomId].scores[user.id]
  }));
  

  io.to(roomId).emit('gameEnded', scoresWithUsernames[0]);
  delete rooms[roomId];
  io.emit('updateLobby', rooms);
}

function getRandomQuestions(num) {
  let shuffled = questions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

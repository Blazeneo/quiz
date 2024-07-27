const socket = io();
let username = '';

document.getElementById('setUsername').addEventListener('click', () => {
  username = document.getElementById('username').value;
  if (username) {
    document.getElementById('usernameInput').style.display = 'none';
    document.getElementById('lobby').style.display = 'block';
  }
});

document.getElementById('createRoom').addEventListener('click', () => {
  socket.emit('createRoom', username);
});

socket.on('roomCreated', (roomId) => {
  joinRoom(roomId);
});

socket.on('updateLobby', (rooms) => {
  const roomsList = document.getElementById('roomsList');
  roomsList.innerHTML = '';
  for (let roomId in rooms) {
    if (rooms[roomId].users.length < 2) {
      let li = document.createElement('li');
      li.innerText = `Room: ${roomId} (Players: ${rooms[roomId].users.length}/2)`;
      let joinButton = document.createElement('button');
      joinButton.innerText = 'Join Room';
      joinButton.onclick = () => joinRoom(roomId);
      li.appendChild(joinButton);
      roomsList.appendChild(li);
    }
  }
});

function joinRoom(roomId) {
  socket.emit('joinRoom', roomId, username);
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'block';
}

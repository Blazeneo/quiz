let currentRoomId;
let questions = [];
let questionIndex = 0;

socket.on('roomJoined', (roomId) => {
  currentRoomId = roomId;
  console.log(`Joined room: ${roomId}`);
});

socket.on('gameStarted', (receivedQuestions) => {
  questions = receivedQuestions;
  questionIndex = 0;
  displayQuestion(questions, questionIndex);
});

document.getElementById('submitAnswer').addEventListener('click', () => {
  if (currentRoomId && questions.length > 0) {
    const answer = document.getElementById('answer').value;
    socket.emit('submitAnswer', currentRoomId, questionIndex, answer);
    questionIndex++;
    if (questionIndex < questions.length) {
      displayQuestion(questions, questionIndex);
    } else {
      document.getElementById('question').innerText = 'Waiting for other player...';
    }
  }
});

function displayQuestion(questions, index) {
  document.getElementById('question').innerText = questions[index].question;
  document.getElementById('answer').value = '';
}

socket.on('gameEnded', (scores) => {
  let scoreText = 'Game over! Scores:\n';
  
    scoreText += `${scores.username} ${scores.score} points\n`;
  
  
  alert(scoreText);
  document.getElementById('game').style.display = 'none';
  document.getElementById('lobby').style.display = 'block';
  questionIndex = 0; // Reset question index for new game
});

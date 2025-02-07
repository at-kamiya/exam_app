// 改行コードを<br>タグに変換する関数
function nl2br(str) {
  return str.replace(/\n/g, '<br>');
}
let timerInterval;
let time = 0;
let isPaused = false;

function startExam() {
  if (isPaused) {
    resumeExam();
  } else {
    time = 0;
    document.getElementById('timer').textContent = formatTime(time);
    timerInterval = setInterval(() => {
      time++;
      document.getElementById('timer').textContent = formatTime(time);
    }, 1000);
  }
}

function pauseExam() {
  if (!isPaused) {
    clearInterval(timerInterval);
    isPaused = true;
    document.getElementById('pause-screen').style.display = 'block';
    document.getElementById('resume-button').style.display = 'block';
  }
}

function resumeExam() {
  if (isPaused) {
    isPaused = false;
    document.getElementById('pause-screen').style.display = 'none';
    document.getElementById('resume-button').style.display = 'none';
    timerInterval = setInterval(() => {
      time++;
      document.getElementById('timer').textContent = formatTime(time);
    }, 1000);
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

document.addEventListener('DOMContentLoaded', () => {
  fetch('https://exam-app-m9xj.onrender.com/questions')
    .then(response => response.json())
    .then(questions => {
      const examDiv = document.getElementById('exam');
      questions.forEach(question => {
        const questionDiv = document.createElement('div');
        questionDiv.innerHTML = `
          <p>${nl2br(question.question)}</p>
          ${JSON.parse(question.options).map((option, index) => `
            <label class="option">
              <input type="${question.type === 'single' ? 'radio' : 'checkbox'}" name="question${question.id}" value="${option}">
              ${option}
            </label>
          `).join('')}
        `;
        examDiv.appendChild(questionDiv);
      });
    });
});

function submitExam() {
  const examDiv = document.getElementById('exam');
  const resultDiv = document.getElementById('result');
  const answers = Array.from(examDiv.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked')).map(input => ({
    questionId: parseInt(input.name.replace('question', '')),
    answer: input.value
  }));

  fetch('https://exam-app-m9xj.onrender.com/questions')
    .then(response => response.json())
    .then(questions => {
      let score = 0;
      let resultHtml = '';

      const groupedAnswers = answers.reduce((acc, answer) => {
        if (!acc[answer.questionId]) acc[answer.questionId] = [];
        acc[answer.questionId].push(answer.answer);
        return acc;
      }, {});

      Object.keys(groupedAnswers).forEach(questionId => {
        const question = questions.find(q => q.id === parseInt(questionId));
        if (question) {
          const correctAnswers = JSON.parse(question.answer);
          let isCorrect = false;

          if (question.type === 'single') {
            // singleタイプの設問の評価
            isCorrect = groupedAnswers[questionId][0] === correctAnswers;
          } else if (question.type === 'multiple') {
            // multipleタイプの設問の評価
            isCorrect = JSON.stringify(groupedAnswers[questionId]) === JSON.stringify(correctAnswers);
          }

          if (isCorrect) {
            score++;
          }

          resultHtml += `
            <p>
              <strong>Question:</strong> ${nl2br(question.question)}<br>
              <strong>Your Answer:</strong> ${groupedAnswers[questionId].join(', ')}<br>
              <strong>Correct Answer:</strong> ${Array.isArray(correctAnswers) ? correctAnswers.join('<br>') : correctAnswers}<br>
              <strong>Result:</strong> ${isCorrect ? 'Correct' : 'Incorrect'}
            </p>
          `;
        }
      });

      resultHtml += `<p>Your score: ${score} / ${questions.length}</p>`;
      resultDiv.innerHTML = resultHtml;
    });
}

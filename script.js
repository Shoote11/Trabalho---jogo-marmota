// Configura as regras de cada nivel de dificuldade do jogo.
const difficultySettings = {
  easy: {
    label: "Facil",
    totalTime: 40,
    moleTime: 1200,
    targetScore: 8,
    maxAttempts: 18
  },
  medium: {
    label: "Medio",
    totalTime: 30,
    moleTime: 850,
    targetScore: 10,
    maxAttempts: 16
  },
  hard: {
    label: "Dificil",
    totalTime: 25,
    moleTime: 600,
    targetScore: 12,
    maxAttempts: 15
  }
};

// Busca no HTML os elementos que o JavaScript precisa atualizar durante a partida.
const holes = document.querySelectorAll(".hole");
const scoreElement = document.getElementById("score");
const attemptsElement = document.getElementById("attempts");
const timerElement = document.getElementById("timer");
const targetScoreElement = document.getElementById("target-score");
const messageElement = document.getElementById("message");
const difficultyElement = document.getElementById("difficulty");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

// Guarda todas as informacoes que mudam enquanto o jogo esta acontecendo.
const gameState = {
  score: 0,
  attempts: 0,
  timeLeft: 30,
  activeHoleIndex: null,
  lastHoleIndex: null,
  isRunning: false,
  wasHitThisRound: false,
  countdownId: null,
  moleTimeoutId: null
};

function getCurrentSettings() {
  return difficultySettings[difficultyElement.value];
}

// Atualiza os numeros exibidos na tela: pontos, tentativas, tempo e meta.
function updateScoreboard() {
  const settings = getCurrentSettings();

  scoreElement.textContent = gameState.score;
  attemptsElement.textContent = `${gameState.attempts}/${settings.maxAttempts}`;
  timerElement.textContent = gameState.timeLeft;
  targetScoreElement.textContent = settings.targetScore;
}

// Mostra mensagens para o jogador e aplica uma classe visual quando necessario.
function updateMessage(text, statusClass = "") {
  messageElement.textContent = text;
  messageElement.className = "message-box";

  if (statusClass) {
    messageElement.classList.add(statusClass);
  }
}

// Remove a marmota atual do tabuleiro e limpa os efeitos visuais dos buracos.
function clearActiveMole() {
  if (gameState.activeHoleIndex !== null) {
    gameState.lastHoleIndex = gameState.activeHoleIndex;
  }

  holes.forEach((hole) => {
    hole.classList.remove("active", "hit");
  });

  gameState.activeHoleIndex = null;
}

// Sorteia um buraco para a marmota aparecer, evitando repetir o mesmo buraco seguido.
function getRandomHoleIndex() {
  let randomIndex = Math.floor(Math.random() * holes.length);

  while (randomIndex === gameState.lastHoleIndex && holes.length > 1) {
    randomIndex = Math.floor(Math.random() * holes.length);
  }

  return randomIndex;
}

// Exibe a marmota, espera o tempo do nivel atual e passa para a proxima rodada.
function showMole() {
  if (!gameState.isRunning) {
    return;
  }

  const settings = getCurrentSettings();

  clearActiveMole();
  gameState.wasHitThisRound = false;
  gameState.activeHoleIndex = getRandomHoleIndex();
  holes[gameState.activeHoleIndex].classList.add("active");

  gameState.moleTimeoutId = setTimeout(() => {
    // Se o jogador nao clicou na marmota a tempo, conta como tentativa perdida.
    if (!gameState.wasHitThisRound) {
      registerAttempt();
    }

    checkGameResult();

    if (gameState.isRunning) {
      showMole();
    }
  }, settings.moleTime);
}

// Registra uma tentativa, seja acertando ou deixando a marmota escapar.
function registerAttempt() {
  gameState.attempts += 1;
  updateScoreboard();
}

// Trata o clique em um buraco e pontua apenas quando a marmota esta naquele local.
function handleHoleClick(event) {
  if (!gameState.isRunning) {
    return;
  }

  const clickedHole = event.currentTarget;
  const clickedIndex = Number(clickedHole.dataset.index);

  if (clickedIndex !== gameState.activeHoleIndex || gameState.wasHitThisRound) {
    return;
  }

  gameState.score += 1;
  gameState.wasHitThisRound = true;
  clickedHole.classList.add("hit");
  registerAttempt();
  updateMessage("Boa! Voce acertou a marmota.");
  checkGameResult();
}

// Verifica se o jogador venceu, perdeu por tempo ou acabou as tentativas.
function checkGameResult() {
  const settings = getCurrentSettings();

  if (gameState.score >= settings.targetScore) {
    finishGame(true);
    return;
  }

  if (gameState.timeLeft <= 0 || gameState.attempts >= settings.maxAttempts) {
    finishGame(false);
  }
}

// Encerra a partida, trava o tabuleiro e mostra a mensagem final.
function finishGame(playerWon) {
  const settings = getCurrentSettings();

  gameState.isRunning = false;
  clearInterval(gameState.countdownId);
  clearTimeout(gameState.moleTimeoutId);
  clearActiveMole();
  setBoardEnabled(false);
  startButton.disabled = false;
  difficultyElement.disabled = false;

  if (playerWon) {
    updateMessage(`Vitoria! Voce fez ${gameState.score} pontos no modo ${settings.label}.`, "win");
  } else {
    updateMessage(`Fim de jogo! Pontuacao final: ${gameState.score}. Tente novamente.`, "lose");
  }
}

// Inicia o contador regressivo da partida.
function startCountdown() {
  gameState.countdownId = setInterval(() => {
    gameState.timeLeft -= 1;
    updateScoreboard();
    checkGameResult();
  }, 1000);
}

// Ativa ou desativa os buracos para impedir cliques fora da partida.
function setBoardEnabled(isEnabled) {
  holes.forEach((hole) => {
    hole.disabled = !isEnabled;
  });
}

// Volta o jogo ao estado inicial de acordo com a dificuldade escolhida.
function resetGame() {
  const settings = getCurrentSettings();

  clearInterval(gameState.countdownId);
  clearTimeout(gameState.moleTimeoutId);

  gameState.score = 0;
  gameState.attempts = 0;
  gameState.timeLeft = settings.totalTime;
  gameState.activeHoleIndex = null;
  gameState.lastHoleIndex = null;
  gameState.isRunning = false;
  gameState.wasHitThisRound = false;

  clearActiveMole();
  updateScoreboard();
  updateMessage(`Modo ${settings.label}: alcance ${settings.targetScore} pontos antes do tempo acabar.`);
  setBoardEnabled(false);
  startButton.disabled = false;
  difficultyElement.disabled = false;
}

// Prepara uma nova partida: zera tudo, libera o tabuleiro e inicia os timers.
function startGame() {
  resetGame();
  gameState.isRunning = true;
  setBoardEnabled(true);
  startButton.disabled = true;
  difficultyElement.disabled = true;
  updateMessage("A marmota apareceu! Clique rapido.");
  startCountdown();
  showMole();
}

// Numera os buracos e conecta cada um deles ao evento de clique.
function prepareHoles() {
  holes.forEach((hole, index) => {
    hole.dataset.index = index;
    hole.addEventListener("click", handleHoleClick);
  });
}

// Liga os botoes e o seletor de dificuldade as funcoes principais do jogo.
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", resetGame);
difficultyElement.addEventListener("change", resetGame);

// Deixa o jogo pronto assim que a pagina termina de carregar.
prepareHoles();
resetGame();

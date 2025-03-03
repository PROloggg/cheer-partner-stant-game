document.addEventListener('DOMContentLoaded', () => {
    const floorPixel = 10;
    const gameContainer = document.getElementById('gameContainer');
    const foot = document.getElementById('foot');
    const hand = document.getElementById('hand');
    const scoreElement = document.getElementById('score');
    const messageElement = document.getElementById('message');
    const flyer = document.getElementById('flyer');
    const base = document.getElementById('base');
    const toggleMusicBtn = document.getElementById('toggleMusic');
    const restartButton = document.getElementById('restartButton');
    const screem = new Audio('screem.mp3');
    const bgMusic = new Audio('track.mp3');
    bgMusic.loop = true;

    // Инициализация состояния игры
    let isMusicPlaying = JSON.parse(localStorage.getItem('musicEnabled')) ?? true;
    let score = 0;
    let isGameRunning = true;
    let isProcessing = false;
    let footDirection = 1;
    let footSpeed = 20;

    // Таблица лидеров (локальное хранение)
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

    // Генерация скорости движения ног
    function generateFootSpeed() {
        const baseSpeed = Math.floor(Math.random() * 10) + Math.floor(Math.random() + 15);
        const speedIncrease = Math.floor(score / 5);
        footSpeed = Math.min(baseSpeed + speedIncrease, 50); // Максимальная скорость 50
    }

    // Успешный бросок
    function successCatch() {
        score++;
        if (score % 10 === 0) {
            generateRandomBg();
        }
        scoreElement.textContent = score;
        setTimeout(resetThrow, 500);
    }

    // Сброс положения после броска
    function resetThrow() {
        base.style.backgroundImage = 'url("img/base1.png")';
        flyer.style.bottom = `${floorPixel}px`;
        generateFootSpeed();
    }

    // Падение (конец игры)
    function fall() {
        if (isMusicPlaying) screem.play();
        flyer.style.bottom = `${floorPixel}px`;
        const fallDeg = Math.floor(Math.random() * 361);
        flyer.style.transform = `translateX(-50%) rotate(${fallDeg}deg)`;
        isGameRunning = false;
        messageElement.textContent = 'Игра окончена!';
        gameOver();
    }

    // Анимация броска
    function throwCheerleader(success) {
        base.style.backgroundImage = 'url("img/base2.png")';
        flyer.style.bottom = `${base.clientHeight - base.clientHeight / 4.7}px`;
        base.style.animation = 'lift 0.5s linear';
        setTimeout(() => {
            base.style.animation = '';
            success ? successCatch() : fall();
            isProcessing = false;
            moveFoot();
        }, 500);
    }

    // Движение ног
    function moveFoot() {
        if (!isGameRunning || isProcessing) return;
        const footRect = foot.getBoundingClientRect();
        const containerRect = gameContainer.getBoundingClientRect();
        let newLeft = foot.offsetLeft + footDirection * footSpeed;

        if (newLeft <= 0 || newLeft + footRect.width >= containerRect.width) {
            footDirection *= -1;
        }

        foot.style.left = `${newLeft}px`;
        hand.style.right = `${newLeft}px`;
        requestAnimationFrame(moveFoot);
    }

    // Проверка клика для броска
    function checkClick(event) {
        if (!isGameRunning || isProcessing) return;
        if (isMusicPlaying && !bgMusic.paused) bgMusic.play().catch(() => {});
        if (event.target === toggleMusicBtn || event.target === restartButton) return;

        isProcessing = true;
        const footRect = foot.getBoundingClientRect();
        const handRect = hand.getBoundingClientRect();
        const footLeft = footRect.left;
        const footRight = footRect.right;
        const handLeft = handRect.left;
        const handRight = handRect.right;

        const hasIntersection = footLeft < handRight && footRight > handLeft;
        if (!hasIntersection) {
            throwCheerleader(false);
            return;
        }

        const overlapX = Math.max(0, Math.min(footRight, handRight) - Math.max(footLeft, handLeft));
        const minOverlapFoot = footRect.width / 4;
        const minOverlapHand = handRect.width / 3;
        const isSignificantOverlap = overlapX >= minOverlapFoot && overlapX >= minOverlapHand;

        throwCheerleader(isSignificantOverlap);
    }

    // Инициализация игры
    function initGame() {
        generateRandomBg();
        score = 0;
        isGameRunning = true;
        isProcessing = false;
        scoreElement.textContent = score;
        messageElement.textContent = '';
        flyer.style.transform = 'translateX(-50%) rotate(0deg)';
        resetThrow();
        gameContainer.style.backgroundColor = 'transparent';
        restartButton.style.display = 'none';
        generateFootSpeed();
        moveFoot();
        updateMusicButton();
    }

    // Случайный фон
    function generateRandomBg() {
        const randBg = Math.floor(Math.random() * 6) + 1;
        gameContainer.style.backgroundImage = `url("img/bg${randBg}.png")`;
    }

    // Обновление кнопки музыки
    function updateMusicButton() {
        toggleMusicBtn.textContent = isMusicPlaying ? '🔊' : '🔇';
    }

    // Переключение музыки
    toggleMusicBtn.addEventListener('click', () => {
        isMusicPlaying = !isMusicPlaying;
        localStorage.setItem('musicEnabled', JSON.stringify(isMusicPlaying));
        if (isMusicPlaying) {
            bgMusic.play().catch(error => console.error('Ошибка воспроизведения:', error));
        } else {
            bgMusic.pause();
        }
        updateMusicButton();
    });

    // Перезапуск игры
    restartButton.addEventListener('click', initGame);

    // Обработка кликов
    gameContainer.addEventListener('click', checkClick);

    // Обновление таблицы лидеров
    function updateLeaderboard(score) {
        const user = Telegram.WebApp.initDataUnsafe?.user?.username || 'Аноним';
        leaderboard.push({ user, score });
        leaderboard.sort((a, b) => b.score - a.score); // Сортировка по убыванию
        leaderboard = leaderboard.slice(0, 10); // Топ-10
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    }

    // Формирование текста таблицы лидеров
    function getLeaderboardText() {
        if (leaderboard.length === 0) return 'Таблица лидеров пуста.';
        return '🏆 Таблица лидеров:\n' + leaderboard
            .map((entry, index) => `${index + 1}. ${entry.user}: ${entry.score} очков`)
            .join('\n');
    }

    // Отображение таблицы лидеров в интерфейсе
    function displayLeaderboard() {
        messageElement.textContent = `Игра окончена! Ваш счёт: ${score}\n${getLeaderboardText()}`;
    }

    // Завершение игры
    function gameOver() {
        Telegram.WebApp.ready();

        // Отправляем данные серверу через Web App для обработки на PHP
        Telegram.WebApp.sendData(JSON.stringify({ score: score }));

        // Обновляем локальную таблицу лидеров и показываем в интерфейсе
        updateLeaderboard(score);
        displayLeaderboard();

        gameContainer.style.backgroundColor = 'rgba(0, 0, 255, 0.7)';
        restartButton.style.display = 'block';
    }

    // Старт игры
    initGame();
});
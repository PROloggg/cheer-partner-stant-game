document.addEventListener('DOMContentLoaded', () => {
    const floorPixel = 10;
    const gameContainer = document.getElementById('gameContainer');
    const foot = document.getElementById('foot');
    const hand = document.getElementById('hand');
    const scoreElement = document.getElementById('score');
    const messageElement = document.getElementById('message');
    const flyer = document.getElementById('flyer');
    const base = document.getElementById('base');
    const toggleMusicBtn = document.getElementById("toggleMusic");
    const restartButton = document.getElementById("restartButton");
    const screem = new Audio("screem.mp3");
    const bgMusic = new Audio("track.mp3");
    bgMusic.loop = true;

    let isMusicPlaying = JSON.parse(localStorage.getItem("musicEnabled")) ?? true;
    let score = 0;
    let isGameRunning = true;
    let isProcessing = false;
    let footDirection = 1;
    let footSpeed = 20;

    // Таблица лидеров (временное хранение в памяти)
    let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

    function generateFootSpeed() {
        let baseSpeed = Math.floor(Math.random() * 10) + Math.floor(Math.random() + 15);
        let speedIncrease = Math.floor(score / 5);
        footSpeed = baseSpeed + speedIncrease;
        footSpeed = Math.min(footSpeed, 50);
    }

    function successCatch() {
        score++;
        if (score % 10 === 0) {
            generateRandomBg();
        }
        scoreElement.textContent = score;
        setTimeout(resetThrow, 500);
    }

    function resetThrow() {
        base.style.backgroundImage = 'url("img/base1.png")';
        flyer.style.bottom = `${floorPixel}px`;
        generateFootSpeed();
    }

    function fall() {
        if (isMusicPlaying) screem.play();
        flyer.style.bottom = `${floorPixel}px`;
        let fallDeg = Math.floor(Math.random() * 361);
        flyer.style.transform = `translateX(-50%) rotate(${fallDeg}deg)`;
        isGameRunning = false;
        messageElement.textContent = 'Игра окончена!';
        gameOver();
    }

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

    function checkClick(event) {
        if (!isGameRunning || isProcessing) return;
        if (isMusicPlaying && !bgMusic.onplaying) bgMusic.play();
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
        if (isSignificantOverlap) {
            throwCheerleader(true);
        } else {
            throwCheerleader(false);
        }
    }

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

    function generateRandomBg() {
        const randBg = Math.floor(Math.random() * 6) + 1;
        gameContainer.style.backgroundImage = `url(img/bg${randBg}.png)`;
    }

    function updateMusicButton() {
        toggleMusicBtn.textContent = isMusicPlaying ? "🔊" : "🔇";
    }

    toggleMusicBtn.addEventListener("click", () => {
        isMusicPlaying = !isMusicPlaying;
        localStorage.setItem("musicEnabled", JSON.stringify(isMusicPlaying));
        if (isMusicPlaying) {
            bgMusic.play().catch(error => console.error("Ошибка воспроизведения:", error));
        } else {
            bgMusic.pause();
        }
        updateMusicButton();
    });

    restartButton.addEventListener('click', () => {
        initGame();
    });

    gameContainer.addEventListener('click', checkClick);
    initGame();

    // Функция отправки сообщения в чат через Telegram Bot API
    async function sendScoreToChat(score) {
        const botToken = 'ВАШ_ТОКЕН_БОТА'; // Замените на токен вашего бота
        const chatId = Telegram.WebApp.initDataUnsafe?.chat?.id; // ID чата из Web App

        if (!chatId) {
            console.error("Не удалось получить chat_id из Telegram Web App");
            return;
        }

        const message = `Игра окончена! Набрано очков: ${score}`;
        const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            if (!data.ok) {
                console.error("Ошибка отправки сообщения:", data);
            }
        } catch (error) {
            console.error("Ошибка при запросе к Telegram API:", error);
        }
    }

    // Обновление таблицы лидеров
    function updateLeaderboard(score) {
        const user = Telegram.WebApp.initDataUnsafe?.user?.username || "Аноним";
        leaderboard.push({ user, score });
        leaderboard.sort((a, b) => b.score - a.score); // Сортировка по убыванию очков
        leaderboard = leaderboard.slice(0, 10); // Ограничение до 10 лидеров
        localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
    }

    // Формирование текста таблицы лидеров
    function getLeaderboardText() {
        if (leaderboard.length === 0) return "Таблица лидеров пуста.";
        return "🏆 Таблица лидеров:\n" + leaderboard
            .map((entry, index) => `${index + 1}. ${entry.user}: ${entry.score} очков`)
            .join("\n");
    }

    // Отправка таблицы лидеров в чат
    async function sendLeaderboardToChat() {
        const botToken = '7892110041:AAEGzeTqeB0Gtl5fKmwkOCo9aCnVA_Hm9QQ'; // Замените на токен вашего бота
        const chatId = Telegram.WebApp.initDataUnsafe?.chat?.id;

        if (!chatId) {
            console.error("Не удалось получить chat_id из Telegram Web App");
            return;
        }

        const message = getLeaderboardText();
        const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            if (!data.ok) {
                console.error("Ошибка отправки таблицы лидеров:", data);
            }
        } catch (error) {
            console.error("Ошибка при запросе к Telegram API:", error);
        }
    }

    // Вывод таблицы лидеров в интерфейсе (опционально)
    function displayLeaderboard() {
        messageElement.textContent = `Игра окончена! Ваш счёт: ${score}\n${getLeaderboardText()}`;
    }

    function gameOver() {
        Telegram.WebApp.ready();

        // Отправляем данные в Web App (если нужно для бэкенда)
        Telegram.WebApp.sendData(JSON.stringify({ score: score }));

        // Обновляем таблицу лидеров
        updateLeaderboard(score);

        // Отправляем очки в чат
        sendScoreToChat(score);

        // Отправляем таблицу лидеров в чат
        sendLeaderboardToChat();

        // Показываем таблицу лидеров в интерфейсе (опционально)
        displayLeaderboard();

        gameContainer.style.backgroundColor = 'rgba(0, 0, 255, 0.7)';
        restartButton.style.display = 'block';
    }
});
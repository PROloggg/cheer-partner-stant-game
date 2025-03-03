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

    let isMusicPlaying = JSON.parse(localStorage.getItem('musicEnabled')) ?? true;
    let score = 0;
    let isGameRunning = true;
    let isProcessing = false;
    let footDirection = 1;
    let footSpeed = 20;
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

    function generateFootSpeed() {
        const baseSpeed = Math.floor(Math.random() * 10) + Math.floor(Math.random() + 15);
        const speedIncrease = Math.floor(score / 5);
        footSpeed = Math.min(baseSpeed + speedIncrease, 50);
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
        const fallDeg = Math.floor(Math.random() * 361);
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
        gameContainer.style.backgroundImage = `url("img/bg${randBg}.png")`;
    }

    function updateMusicButton() {
        toggleMusicBtn.textContent = isMusicPlaying ? '🔊' : '🔇';
    }

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

    restartButton.addEventListener('click', initGame);
    gameContainer.addEventListener('click', checkClick);

    function updateLeaderboard(score) {
        const userData = Telegram.WebApp?.initDataUnsafe?.user;
        const user = userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username || 'Аноним' : 'Аноним';
        leaderboard.push({ user, score });
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10);
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    }

    function getLeaderboardText() {
        if (leaderboard.length === 0) return 'Top Players\nПока нет лидеров.';
        return 'Top Players\n' + leaderboard
            .map((entry, index) => `${index + 1}. ${entry.user} – ${entry.score}`)
            .join('\n');
    }

    function displayLeaderboard() {
        messageElement.textContent = `Игра окончена! Ваш счёт: ${score}\n${getLeaderboardText()}`;
    }

    async function gameOver() {
        const userData = Telegram.WebApp?.initDataUnsafe?.user;
        const user = userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username || 'Аноним' : 'Аноним';
        const chatId = Telegram.WebApp?.initDataUnsafe?.chat?.id;

        console.log('Данные Telegram:', { userData, chatId }); // Отладка

        if (typeof Telegram !== 'undefined' && Telegram.WebApp && chatId) {
            const data = { score: score, user: user, chatId: chatId };
            console.log('Отправляем данные:', data);

            // Отправка через Google Apps Script (замените URL)
            try {
                const response = await fetch('https://script.google.com/macros/s/ВАШ_ID/exec', {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' }
                });
                console.log('Результат отправки:', await response.text());
            } catch (error) {
                console.error('Ошибка отправки:', error);
            }

            Telegram.WebApp.close(); // Закрываем Web App
        } else {
            console.warn('Telegram Web App или chatId не доступен.');
        }

        updateLeaderboard(score);
        displayLeaderboard();
        gameContainer.style.backgroundColor = 'rgba(0, 0, 255, 0.7)';
        restartButton.style.display = 'block';
    }

    initGame();
});
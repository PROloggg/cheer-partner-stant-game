document.addEventListener('DOMContentLoaded', () => {
    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');
    const chatId = urlParams.get('chat_id');
    const inlineMessageId = urlParams.get('inline_message_id'); // Получаем inline_message_id
    const messageId = urlParams.get('message_id'); // Получаем message_id (если используется)

    // Отладка: выводим данные
    console.log('User ID:', userId);
    console.log('Chat ID:', chatId);
    console.log('Inline Message ID:', inlineMessageId);
    console.log('Message ID:', messageId);

    // Остальная логика игры
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

    const botToken = '7892110041:AAEGzeTqeB0Gtl5fKmwkOCo9aCnVA_Hm9QQ'; // Ваш токен бота

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
            bgMusic.play().catch(error => alert('Ошибка воспроизведения:', error));
        } else {
            bgMusic.pause();
        }
        updateMusicButton();
    });

    restartButton.addEventListener('click', initGame);
    gameContainer.addEventListener('click', checkClick);

    async function sendScoreToChat(score) {

        const message = `Пользователь набрал ${score} очков в игре!`;

        try {
            let url;
            let body;

            if (inlineMessageId) {
                // Используем inline_message_id для inline-режима
                url = `https://api.telegram.org/bot${botToken}/editMessageText`;
                body = {
                    inline_message_id: inlineMessageId,
                    text: message,
                };
            } else {
                // Используем chat_id для обычного режима
                url = `https://api.telegram.org/bot${botToken}/sendMessage`;
                body = {
                    chat_id: chatId,
                    text: message,
                };
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result = await response.json();
            console.log('Результат отправки:', result);

            if (!result.ok) {
                console.error('Ошибка отправки:', result.description);
                alert('Ошибка отправки: ' + result.description);
            }
        } catch (error) {
            console.error('Ошибка отправки:', error);
            alert('Ошибка отправки: ' + error.message);
        }
    }

    async function updateLeaderboard(score) {
        try {
            // Проверяем, что хотя бы один из идентификаторов передан
            if (!inlineMessageId && (!chatId || !messageId)) {
                alert('Ошибка: не указан inline_message_id или chat_id + message_id.');
                return;
            }

            const response = await fetch(`https://api.telegram.org/bot${botToken}/setGameScore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId, // Идентификатор пользователя
                    score: score, // Новый счет
                    force: true, // Разрешить уменьшение счета
                    inline_message_id: inlineMessageId, // Идентификатор inline-сообщения (если используется)
                    chat_id: chatId, // Идентификатор чата (если используется)
                    message_id: messageId, // Идентификатор сообщения (если используется)
                }),
            });
            const result = await response.json();
            console.log('Результат обновления счета:', result);

            if (!result.ok) {
                console.error('Ошибка обновления счета:', result.description);
                alert('Ошибка обновления счета: ' + result.description);
            }
        } catch (error) {
            console.error('Ошибка обновления счета:', error);
            alert('Ошибка обновления счета: ' + error.message);
        }
    }

    async function gameOver() {
        await sendScoreToChat(score);
        await updateLeaderboard(score);

        messageElement.textContent = `Игра окончена! Ваш счёт: ${score}`;
        gameContainer.style.backgroundColor = 'rgba(0, 0, 255, 0.7)';
        restartButton.style.display = 'block';
    }

    initGame();
});
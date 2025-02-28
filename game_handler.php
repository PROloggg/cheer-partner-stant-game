<?php

//https://api.telegram.org/bot7892110041:AAEGzeTqeB0Gtl5fKmwkOCo9aCnVA_Hm9QQ/setWebhook?url=https://bot.cheer-ural.ru/game_handler.php
//https://api.telegram.org/bot7892110041:AAEGzeTqeB0Gtl5fKmwkOCo9aCnVA_Hm9QQ/setWebhook?url=https://stalker-online.mt200.mt-pc.ru/game_handler.php
$token = '7892110041:AAEGzeTqeB0Gtl5fKmwkOCo9aCnVA_Hm9QQ';
$gameUrl = 'https://prologgg.github.io/cheer-partner-stant-game/';
$gameShortName = 'cheer_partner_stant';

// Получаем входные данные от Telegram
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Проверяем, есть ли callback_query
if (isset($data['callback_query'])) {
    $callbackQuery = $data['callback_query'];
    $callbackId = $callbackQuery['id'];
    $chatId = $callbackQuery['from']['id'];
    $gameShortName = $callbackQuery['game_short_name'];

    // Отвечаем на callback_query с URL игры
    file_get_contents(
        "https://api.telegram.org/bot$token/answerCallbackQuery?callback_query_id=$callbackId&url=$gameUrl"
    );
}

// Проверяем, есть ли команда /start
if (isset($data['message']['text'])) {
    $messageText = $data['message']['text'];
    $chatId = $data['message']['chat']['id'];

    if ($messageText === '/start') {
        // Отправляем игру
        file_get_contents(
            "https://api.telegram.org/bot$token/sendGame?chat_id=$chatId&game_short_name=$gameShortName"
        );
    }
}
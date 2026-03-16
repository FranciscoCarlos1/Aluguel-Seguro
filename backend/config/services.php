<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'olx' => [
        'client_id' => env('OLX_CLIENT_ID'),
        'client_secret' => env('OLX_CLIENT_SECRET'),
        'auth_base_url' => env('OLX_AUTH_BASE_URL', 'https://auth.olx.com.br'),
        'apps_base_url' => env('OLX_APPS_BASE_URL', 'https://apps.olx.com.br'),
    ],

    'google_search' => [
        'api_key' => env('GOOGLE_SEARCH_API_KEY'),
        'engine_id' => env('GOOGLE_SEARCH_ENGINE_ID'),
        'base_url' => env('GOOGLE_SEARCH_BASE_URL', 'https://www.googleapis.com/customsearch/v1'),
        'site_query' => env('GOOGLE_SEARCH_SITE_QUERY', 'site:olx.com.br OR site:vivareal.com.br OR site:zapimoveis.com.br'),
    ],

];

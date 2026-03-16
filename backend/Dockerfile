FROM php:8.4-cli

RUN apt-get update \
    && apt-get install -y git unzip libsqlite3-dev \
    && docker-php-ext-install pdo_sqlite \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

ENV DB_DATABASE=/var/data/database.sqlite

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction
RUN cp .env.example .env && php artisan key:generate --force

CMD ["sh", "-c", "DATABASE_PATH=${DB_DATABASE:-/var/data/database.sqlite}; mkdir -p \"$(dirname \"$DATABASE_PATH\")\" && touch \"$DATABASE_PATH\" && php artisan config:clear && php artisan migrate --force && php -S 0.0.0.0:${PORT:-10000} -t public"]

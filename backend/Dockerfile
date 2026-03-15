FROM php:8.2-cli

WORKDIR /app

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    zip \
    curl \
    && docker-php-ext-install zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock* ./
RUN composer install --no-dev --optimize-autoloader || composer install

COPY . .

EXPOSE 10000

CMD ["php", "-S", "0.0.0.0:10000", "-t", "public"]
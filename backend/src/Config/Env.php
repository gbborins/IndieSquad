<?php

namespace App\Config;

use Dotenv\Dotenv;

class Env
{
    public static function load(string $basePath): void
    {
        $dotenv = Dotenv::createUnsafeImmutable($basePath);
        $dotenv->safeLoad();
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        return $_ENV[$key]
            ?? $_SERVER[$key]
            ?? getenv($key)
            ?? $default;
    }
}

<?php

namespace App\Services;

use GuzzleHttp\Client;

class ImageGenerationService
{
    private Client $client;

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 120, // Image generation can take a while
        ]);
    }

    /**
     * Generate an image using Pollinations AI (free, no API key needed).
     * Returns the raw image binary data.
     */
    public function generate(string $prompt, int $width = 512, int $height = 512): string
    {
        $url = 'https://image.pollinations.ai/prompt/'
            . urlencode($prompt)
            . '?width=' . $width
            . '&height=' . $height
            . '&nologo=true';

        $response = $this->client->get($url);

        if ($response->getStatusCode() !== 200) {
            throw new \Exception('Pollinations API returned status ' . $response->getStatusCode());
        }

        $body = $response->getBody()->getContents();

        if (strlen($body) < 1000) {
            throw new \Exception('Image generation returned invalid data');
        }

        return $body;
    }
}

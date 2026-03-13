<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$data = [
    "mensagem" => "Olá do PHP",
    "status" => "ok"
];

echo json_encode($data);

?>
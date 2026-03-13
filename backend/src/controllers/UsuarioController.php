<?php

require_once __DIR__ . '/../models/Usuario.php';

class UsuarioController
{
    public function index()
    {
        $usuarioModel = new Usuario();

        if (isset($_GET['id'])) {
            $usuario = $usuarioModel->buscarPorId($_GET['id']);

            if ($usuario) {
                echo json_encode($usuario);
            } else {
                http_response_code(404);
                echo json_encode(["erro" => "Usuário não encontrado"]);
            }

            return;
        }

        $usuarios = $usuarioModel->listar();
        echo json_encode($usuarios);
    }

    public function store()
    {
        $dados = json_decode(file_get_contents("php://input"), true);

        if (!$dados || !isset($dados['nome']) || !isset($dados['email'])) {
            http_response_code(400);
            echo json_encode(["erro" => "Dados inválidos"]);
            return;
        }

        $usuarioModel = new Usuario();
        $novoUsuario = $usuarioModel->criar($dados['nome'], $dados['email']);

        http_response_code(201);
        echo json_encode($novoUsuario);
    }
}

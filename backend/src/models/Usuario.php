<?php

class Usuario
{
    private $usuarios = [
        ["id" => 1, "nome" => "Gabriel", "email" => "gabriel@email.com"],
        ["id" => 2, "nome" => "Maria", "email" => "maria@email.com"]
    ];

    public function listar()
    {
        return $this->usuarios;
    }

    public function buscarPorId($id)
    {
        foreach ($this->usuarios as $usuario) {
            if ($usuario['id'] == $id) {
                return $usuario;
            }
        }

        return null;
    }

    public function criar($nome, $email)
    {
        return [
            "id" => rand(100, 999),
            "nome" => $nome,
            "email" => $email
        ];
    }
}

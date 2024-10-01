const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000; // Porta do servidor Node.js

app.use(cors()); // Permitir CORS
app.use(express.json()); // Para parsear JSON no corpo das requisições

app.post('/cadastrar', async (req, res) => {
    try {
        const { ip, morador_nome, foto } = req.body;

        // Enviar dados para o servidor Python
        const response = await axios.post('http://localhost:8080/cadastrar', {
            ip,
            morador_nome,
            foto
        });

        // Retornar a resposta do servidor Python para o front-end
        res.status(response.status).send(response.data);
    } catch (error) {
        console.error("Erro ao enviar para o servidor Python:", error.message);
        if (error.response) {
            res.status(error.response.status).send(error.response.data);
        } else {
            res.status(500).send("Erro no servidor");
        }
    }
});

app.listen(PORT, () => {
    console.log(`Servidor Node.js rodando na porta ${PORT}`);
});

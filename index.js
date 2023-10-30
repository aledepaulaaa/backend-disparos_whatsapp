const express = require('express');
const EnviarIndividual = require('./enviarmensagens/EnviarIndividual');
const EnviarParaTodos = require('./enviarmensagens/EnviarParaTodos');
const { initializeWhatsApp } = require("./whatsappweb/whatsappweb");

const app = express();
const port = 8000;

const enviarIndividual = new EnviarIndividual();
const enviarParaTodos = new EnviarParaTodos();

initializeWhatsApp(app);

app.get('/', (req, res) => {
    res.send('Servidor está rodando!');
});

app.post('/enviarindividual', async (req, res) => {
    const { contato, mensagem } = req.body;
    try {
        const resultado = await enviarIndividual.enviarMensagem(contato, mensagem);
        res.send(resultado);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post('/enviarparatodos', async (req, res) => {
    const { mensagem } = req.body;
    try {
        const resultado = await enviarParaTodos.enviarMensagemParaTodos(mensagem);
        res.send(resultado);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(port, () => {
    console.log(`Servidor está rodando em http://localhost:${port}`);
});

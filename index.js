const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode-terminal');

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());
const client = new Client({
    authStrategy: new LocalAuth(),
});

class ServerEventEmitter extends require('events') {}

const serverEventEmitter = new ServerEventEmitter();

let isClientReady = false;

client.once('authenticated', () => {
    console.log('Autenticado com sucesso!');
    isClientReady = true;
    serverEventEmitter.emit('clientReady');
})

app.get('/', (req, res) => {
    res.send('Servidor está rodando!');
});

app.get('/listadecontatos', async (req, res) => {
    try {

        await new Promise((resolve) => {
            if (isClientReady) {
                resolve();
            } else {
                const listener = () => {
                    client.removeListener('ready', listener);
                    resolve();
                }
                client.on('ready', listener);
            }
        });

        const contatos = await client.getChats();
        res.send(contatos);
    } catch (error) {
        console.error('Erro ao obter lista de contatos:', error);
        res.status(500).send(error.message);
    }
});

app.post('/enviarparatodos', async (req, res) => {
    const { contatos, mensagem } = req.body;
    console.log("Mensagem recebida para enviar:", req.body);
    try {
        // Aguarde até que o cliente esteja pronto
        await new Promise((resolve) => {
            if (isClientReady) {
                resolve();
            } else {
                const listener = () => {
                    serverEventEmitter.removeListener('clientReady', listener);
                    resolve();
                }
                serverEventEmitter.on('clientReady', listener);
            }
        });

        for (const contatoId of contatos) {
            // Verifique se o contatoId é uma string
            if (typeof contatoId === 'string') {
                console.log(`Enviando mensagem para ${contatoId}...`);
                if (mensagem.trim() !== '') {
                    try {
                        await client.sendMessage(`${contatoId}@c.us`, mensagem);
                        console.log(`Mensagem enviada para ${contatoId}`);
                    } catch (sendMessageError) {
                        console.error(`Erro ao enviar mensagem para ${contatoId}:`, sendMessageError.message);
                    }
                } else {
                    console.error('Mensagem vazia. Nenhuma mensagem enviada.');
                }
            } else {
                console.error('Formato de contato inválido:', contatoId);
            }
        }

        // Se você deseja enviar uma resposta de sucesso para o cliente
        res.status(200).send("Mensagens enviadas com sucesso");
    } catch (error) {
        console.error("Erro ao enviar para todos:", error);
        res.status(500).send(error.message);
    }
});

client.on('qr', (qrCode) => {
    // Gerar QR code no terminal
    qrcode.generate(qrCode, { small: true });
});

client.on('ready', () => {
    console.log('Instância do WhatsApp Web Rodando!');
    serverEventEmitter.emit('clientReady');
});

client.on('message', (msg) => {
    console.log('Mensagem Recebida:', msg.body);

    if (msg.body === '!ping') {
        msg.reply('pong');
    }
});

client.initialize();

app.listen(port, () => {
    console.log(`Servidor está rodando em http://localhost:${port}`);
});

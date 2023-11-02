const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const sharp = require('sharp');

const app = express();
const port = 8000;
const corsOptions = {
    origin: [
    'https://smartsendfrontend.vercel.app',
    'https://smartsendfrontend.vercel.app/listadecontatos',
    'https://smartsendfrontend.vercel.app/enviarparatodos',
    '*',
],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}

app.use(cors(corsOptions));

app.use(express.json());
const client = new Client({
    authStrategy: new LocalAuth(),
});

class ServerEventEmitter extends require('events') { }
const serverEventEmitter = new ServerEventEmitter();

let isClientReady = false;

client.once('authenticated', () => {
    console.log('Autenticado com sucesso!');
    isClientReady = true;
    serverEventEmitter.emit('clientReady');
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

        res.status(200).send("Mensagens enviadas com sucesso");
    } catch (error) {
        console.error("Erro ao enviar para todos:", error);
        res.status(500).send(error.message);
    }
});

// Variável para armazenar o QR Code
let qrCodeData

app.get('/', async (req, res) => {
    try {
        await new Promise((resolve) => {
            if (isClientReady) {
                resolve();
            } else {
                const listener = () => {
                    serverEventEmitter.removeListener('clientReady', listener);
                    resolve();
                };
                serverEventEmitter.on('clientReady', listener);
            }
        });

        if (!qrCodeData) {
            throw new Error('Nenhum QR Code disponível no momento.');
        }

        const qrCodeImage = await qrcode.toBuffer(qrCodeData);

        // Processar a imagem usando o Sharp (por exemplo, redimensionar para 400x400 pixels)
        const processedImage = await sharp(qrCodeImage).resize(200, 200).toBuffer();

        // Enviar como JSON
        res.json({ qrCode: processedImage.toString('base64') });
    } catch (error) {
        console.error('Erro ao obter QR Code:', error);
        res.status(500).send(error.message);
    }
});

client.on('qr', (qrCode) => {
    qrCodeData = qrCode;

    // Gerar QR code no terminal
    console.log(qrCode);
    serverEventEmitter.emit('clientReady');
    console.log('QR Code gerado com sucesso!');
    // Enviar QR code para o cliente
    console.log('QR Code enviado para o cliente!');
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
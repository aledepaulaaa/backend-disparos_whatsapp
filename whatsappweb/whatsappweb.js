const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const initializeWhatsApp = (app, clientId) => {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId }),
    });

    client.on('qr', (qrCode) => {
        // Gerar QR code no terminal
        qrcode.generate(qrCode, { small: true });

        // Expor QR code como imagem para o frontend
        app.get('/', (req, res) => {
            res.send(`<img src="${client.qrCode}" alt="QR Code" />`);
        });
    });

    client.on('ready', () => {
        console.log(`Instância do WhatsApp Web Rodando para o cliente ${clientId}!!`);
    });

    client.on('message', (msg) => {
        console.log('Received message:', msg.body);
    });

    client.initialize();
};

module.exports = { initializeWhatsApp, Client };
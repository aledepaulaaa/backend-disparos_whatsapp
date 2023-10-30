const { Client } = require('../whatsappweb/whatsappweb');

class EnviarIndividual {
  constructor() {
    this.client = new Client();
    this.client.initialize();
  }

  async enviarMensagem(contato, mensagem) {
    try {
      const chat = await this.client.getChatById(`${contato}@c.us`);
      await chat.sendSeen();
      await this.client.sendMessage(chat.id._serialized, mensagem);
      return 'Mensagem individual enviada com sucesso!';
    } catch (error) {
      console.error('Erro ao enviar mensagem individual:', error);
      throw new Error('Erro ao enviar mensagem individual.');
    }
  }
}

module.exports = EnviarIndividual;

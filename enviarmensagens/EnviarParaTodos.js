const { Client } = require('../whatsappweb/whatsappweb');

class EnviarParaTodos {
  constructor() {
    this.client = new Client();
    this.client.initialize();
  }

  async enviarMensagemParaTodos(mensagem) {
    try {
      const chats = await this.client.getChats();
      for (const chat of chats) {
        await chat.sendSeen();
        await this.client.sendMessage(chat.id._serialized, mensagem);
      }
      return 'Mensagem para todos enviada com sucesso!';
    } catch (error) {
      console.error('Erro ao enviar mensagem para todos:', error);
      throw new Error('Erro ao enviar mensagem para todos.');
    }
  }
}

module.exports = EnviarParaTodos;

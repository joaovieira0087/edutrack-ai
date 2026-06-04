const agentService = require('../services/agentService');

const agentController = {
  chat: async (req, res) => {
    try {
      const userId = req.user.id;
      const { message, history } = req.body;

      if (!message) {
        return res.status(400).json({ message: 'A mensagem é obrigatória.' });
      }

      const result = await agentService.processAgentMessage(userId, message, history);

      return res.status(200).json(result);
    } catch (error) {
      console.error('[AgentController] Erro no processamento do chat:', error);
      return res.status(500).json({ message: 'Erro ao processar mensagem do agente', error: error.message });
    }
  }
};

module.exports = agentController;

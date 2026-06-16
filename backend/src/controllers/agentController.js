const agentService = require('../services/agentService');

const agentController = {
  chat: async (req, res) => {
    try {
      const userId = req.user.id;
      const { message, history, userDateTime } = req.body;

      if (!message) {
        return res.status(400).json({ message: 'A mensagem é obrigatória.' });
      }

      // Sanitize history to prevent malformed data from crashing the model
      const safeHistory = Array.isArray(history)
        ? history.filter(
            (h) =>
              h &&
              typeof h === 'object' &&
              typeof h.role === 'string' &&
              Array.isArray(h.parts) &&
              h.parts.length > 0
          )
        : [];

      const result = await agentService.processAgentMessage(
        userId,
        message,
        safeHistory,
        userDateTime
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error('[AgentController] Erro no processamento do chat:', error);

      // Provide a graceful fallback response instead of a raw 500
      return res.status(200).json({
        response:
          'Desculpe, tive uma dificuldade momentânea para processar sua mensagem. Pode tentar novamente?',
        executedActions: [],
        error: true,
      });
    }
  },
};

module.exports = agentController;

# Especificação de Negócio: EduTrack AI

**Versão:** 2.0  
**Data:** Maio de 2026  
**Projeto:** EduTrack AI - Assistente Educacional Personalizado  
**Público-Alvo:** Estudantes de cursos técnicos/superiores que precisam gerenciar múltiplas disciplinas, tarefas e progresso acadêmico.  
**Objetivo Geral:** Desenvolver uma aplicação web responsiva (com foco mobile-first) que ajude estudantes a rastrear disciplinas, registrar tarefas/estudos, visualizar progresso e receber insights inteligentes gerados por processamento de dados (via Node.js, Python e IA guiada por OpenSpec).

## 1. Visão Geral do Projeto

O EduTrack AI é uma aplicação web nativa baseada na stack MERN (React, Node.js, Express, MongoDB) com processamento inteligente em Python customizado via OpenSpec, projetada para resolver o problema comum de estudantes perderem o controle do progresso em múltiplas disciplinas simultâneas.

### O que você vai construir?

Ao final do curso, você terá entregue um ecossistema completo:

- **Uma Aplicação Web Responsiva:** Onde o aluno interage com seus dados via interface React de alta performance e densidade de informação.  
- **Um Backend Inteligente:** Que não apenas guarda dados, mas os expõe via APIs RESTful em Node.js/Express e os processa para relatórios utilizando Python.  
- **Uma Documentação Viva:** Todo o histórico de como o app foi construído usando especificações (OpenSpec).

O foco pedagógico do curso é usar **Spec-Driven Development (OpenSpec)** para guiar IAs na implementação de features complexas, especialmente lógica em Python e rotas/schemas no backend MERN (Node.js/Express/MongoDB via Mongoose).

**Nota de nomenclatura (implementação):** ao longo das atividades, os nomes canônicos no backend seguem `snake_case`, por exemplo:

- Disciplinas: `subjects`  
- Tarefas acadêmicas: `academic_tasks`  
- Usuários: `users`

## 2. Problema Resolvido

- Estudantes frequentemente se sentem sobrecarregados com múltiplas disciplinas.  
- Falta de visibilidade sobre progresso real (ex.: % de conclusão por disciplina).  
- Dificuldade em priorizar estudos sem dados objetivos.  
- Solução atual (planilhas ou apps genéricos) não oferece insights personalizados.

## 3. Requisitos Funcionais (Priorizados)

### MVP (Mínimo Viável - Features Básicas)

1. **Autenticação de Usuário**  
     
   - Cadastro/login com email/senha (via JWT e bcryptjs).  
   - Recuperação de senha (envio de token temporário de redefinição).

   

2. **Gerenciamento de Disciplinas**  
     
   - Criar, editar, excluir disciplinas (campos: nome, professor, carga horária, descrição, data início/fim).  
   - Relacionar disciplinas ao usuário logado (Isolamento Multilocatário / Tenant Isolation).

   

3. **Gerenciamento de Tarefas**  
     
   - Criar tarefas vinculadas a uma disciplina (campos: título, descrição, data prevista, prioridade e status).  
   - Controle de tempo estimado e tempo real por tarefa.
   - **Evolução futura:** Adição de dependências e bloqueios entre tarefas acadêmicas.

   

4. **Dashboard Básico**  
     
   - Lista de disciplinas com % de progresso ponderado (calculado a partir do status e peso das tarefas).  
   - Gráficos integrados (pizza e barra) de distribuição de tempo gasto e progresso por disciplina.

### Features Intermediárias (Foco em OpenSpec + Python)

5. **Cálculo Avançado de Progresso**  
     
   - Lógica de negócio inteligente (via StatusEngine) para progresso ponderado por carga horária/pesos e cálculo de desvio temporal.

   

6. **Busca e Filtros Avançados**  
     
   - Busca por tarefas/disciplinas com filtros baseados em data, status e tags.

### Features Avançadas (Projeto Final)

7. **Insights com IA**  
     
   - Recomendações personalizadas e acionáveis baseadas no desvio entre **Tempo Estimado** vs. **Tempo Real** utilizando IA (Gemini Pro) integrada de forma nativa com fallback local inteligente.  
   - Geração de relatórios de performance acadêmica abrangentes (PDF via motor analítico em Python).

   

8. **Notificações**  
     
   - Alertas visuais e painéis dedicados a prazos próximos de expiração.

## 4. Requisitos Não-Funcionais

- **Segurança:** Autenticação via JSON Web Tokens (JWT), criptografia bcryptjs para senhas e Tenant Isolation rigoroso no banco de dados.  
- **Performance:** Respostas de endpoints de API <= 2 segundos; suporte a 1000+ usuários simultâneos através de queries otimizadas e indexadas.  
- **Usabilidade:** Interface web totalmente responsiva, moderna e dinâmica com suporte nativo a temas claro e escuro (Tailwind CSS).  
- **Tecnologias:**  
  - Frontend: React.js (Vite) + Tailwind CSS + Recharts + @dnd-kit (Kanban).  
  - Backend: Node.js + Express.js + Mongoose (MongoDB).  
  - Lógica Custom: Python (analytics_engine.py) + OpenSpec para guiar IA.  
  - **IA Principal:** Gemini 2.5 Pro (via Google AI Studio).  
  - Versionamento: Git/GitHub.  
- **Acessibilidade:** Suporte a temas de alto contraste, elementos semânticos de HTML5 e navegação intuitiva.

## 5. User Stories (Exemplos)

- Como estudante, quero cadastrar minhas disciplinas para organizá-las em um só lugar.  
- Como estudante, quero registrar tarefas diárias para rastrear o que foi feito.  
- Como estudante, quero ver um dashboard de progresso para motivar meus estudos.  
- Como estudante, quero receber recomendações inteligentes para priorizar disciplinas atrasadas.  
- Como aluno do curso, quero usar OpenSpec para criar proposals que guiem a IA na implementação de features em Python e no backend MERN.

## 6. Critérios de Aceitação (Exemplos por Feature)

- **Adicionar Disciplina:**  
    
  - Coleção `subjects` (Disciplinas) no MongoDB com campos corretos e relacionamento via Mongoose.  
  - API CRUD funcional e protegida.  
  - Tela no React para criação e edição (CRUD).  
  - Testes: Usuário só vê e manipula suas próprias disciplinas.


- **Insights IA:**  
    
  - Script Python gera gráficos analíticos e formata o PDF final com base no payload JSON do Node.js.  
  - Conformidade com as diretrizes do `proposal.md` da orquestração OpenSpec.  
  - Exibição correta dos insights gerados pelo Gemini no dashboard React.

## 7. Jornada do Usuário (Fluxo Simplificado)

1. **Acesso:** O estudante faz login seguro e visualiza a página do Dashboard principal.  
2. **Visão Geral:** O Dashboard exibe métricas globais e o progresso analítico de cada disciplina (com gráficos dinâmicos).  
3. **Ação:** O estudante cria tarefas associadas a uma disciplina, define pesos, tempos previstos e arrasta os cards no painel Kanban.  
4. **Conclusão:** Ao finalizar a execução de uma tarefa, o status muda para `concluida` e seu tempo de execução real é computado.  
5. **Evolução:** O estudante visualiza seus insights de produtividade gerados por IA e baixa o relatório em formato PDF para análise externa.

## 8. Papéis no Desenvolvimento (OpenSpec)

Para este projeto, você não é apenas um "digitador de código", mas um **Arquiteto de Soluções**:

- **Você (O Aluno):** Define a intenção de negócio, detalha especificações técnicas e valida a aderência da aplicação.  
- **A IA (O Agente):** Lê sua especificação OpenSpec e implementa o código técnico nativo (React, Node.js, Python) seguindo rigorosamente os milestones.  
- **O OpenSpec:** Garante que a governança do desenvolvimento seja clara, estruturada e rastreável.

## 9. Escopo Progressivo para o Curso

- **Semanas 1-3:** Setup básico (auth robusto, CRUD de disciplinas e tarefas acadêmicas) - estrutura e endpoints MERN.  
- **Semanas 4-6:** Features intermediárias - introdução da governança OpenSpec, painéis dinâmicos no React (Kanban, Calendário) e esquemas de dados complexos.  
- **Semanas 7-8:** Features avançadas - motor analítico em Python para relatórios automatizados, integração direta com Gemini e refinamento de segurança.

## 10. Referências

- Templates Inspiradores:  
  - Figma: "Students' Progress Tracking App" (Figma Community).  
  - Repositório: "To-Do List Template" (MongoDB/Express).  
- Documentação: OpenSpec GitHub, React Docs, MongoDB e Node.js Docs.

**Fim da Especificação**

# Proposta Técnica: Autenticação de Usuário e Gerenciamento de Disciplinas (MVP)

## 1. Contexto e Objetivos

Esta proposta técnica detalha o plano de ação para atingir 100% de conformidade com o **MVP 1 (Autenticação)** e **MVP 2 (Gerenciamento de Disciplinas)** especificados no Documento de Negócio do EduTrack AI.

Diferente do escopo inicial planejado na migração tecnológica, **grande parte da infraestrutura já foi desenvolvida.** Portanto, este documento foca em mapear o Estado Atual da aplicação e definir tarefas assertivas para suprir as lacunas funcionais restantes.

## 2. Estado Atual do Projeto

Uma auditoria da base de código confirma que a infraestrutura MERN (Node.js, Express, MongoDB, React) suportada por TailwindCSS já está sólida, implementando as seguintes features:

### 2.1 Backend (Já Implementado)
*   **Modelos de Banco (Mongoose):** `User`, `Subject` e `AcademicTask` estruturados corretamente com relacionamentos via ObjectId (`user_id`).
*   **Autenticação JWT:** Funcional via `authController` (`/signup`, `/login`, `/me`) com hash de senha utilizando `bcryptjs` e proteção de rotas (`authMiddleware`).
*   **CRUD de Disciplinas:** Funcional via `subjectController` e `subjectRoutes`, garantindo o isolamento multilocatário (tenant isolation) em que o usuário só manipula suas próprias disciplinas.

### 2.2 Frontend (Já Implementado)
*   **Gestão de Fluxo de Acesso:** Telas funcionais base (`LoginView.jsx`) com formulário em abas para Cadastro e Entrada. Contexto global (`AuthContext.js`) provendo hidratação do JWT via Axios.
*   **Gestão de Disciplinas:** Fluxo robusto englobando Telas de Listagem (`SubjectsView.jsx`), Criação (`CreateSubjectView.jsx`) e Detalhes (`SubjectDetailView.jsx`).
*   **Painel Principal:** A tela `Dashboard.jsx` lidera a entrega do MVP, suportando visualizações avançadas.

---

## 3. Escopo Restante (Lacunas da Especificação de Negócio)

Comparando o Código Atual com a "Especificação de Negócio EduTrack AI.md", identificamos a seguinte pendência crítica no **MVP 1**:

*   **[Pendente] Recuperação de Senha:** A especificação exige uma via de recuperação. O endpoint backend e o fluxo de frontend (Solicitação de e-mail e redefinição de token) **não existem atualmente.**

Para o **MVP 2 (Gerenciamento de Disciplinas)**, o escopo de lógica de negócios está 100% atendido. O foco em Disciplinas será apenas assegurar a estabilidade e polimento caso bugs sejam notados durante a homologação.

---

## 4. Tarefas de Implementação Faltantes (Milestones)

As tarefas a seguir visam completar exclusivamente o escopo do MVP e prepará-lo para testes finais, evitando retrabalho no que já existe.

### Milestone 1: Fluxo de Recuperação de Senha via OTP 4 Dígitos (Backend) — ✅ Concluído
- [x] **Configuração de E-mail:** Integrado ambiente Node.js com `nodemailer` com suporte completo a SMTP e fallback robusto via `console.log` para desenvolvimento local.
- [x] **Lógica do Código OTP:** Adicionado campos `reset_code` e `reset_code_expires` no Mongoose `User` para códigos numéricos de 4 dígitos efêmeros (10 minutos).
- [x] **Endpoint de Solicitação:** Criado endpoint `POST /api/auth/forgot-password` que gera o OTP, persiste no banco e dispara o e-mail de recuperação em template HTML altamente estilizado.
- [x] **Endpoint de Verificação:** Criado endpoint `POST /api/auth/verify-code` para validação prévia do código de 4 dígitos.
- [x] **Endpoint de Redefinição:** Criado endpoint `POST /api/auth/reset-password` que revalida o OTP e atualiza a senha no banco usando hash bcrypt.

### Milestone 2: UI de Recuperação de Senha (Frontend) — ✅ Concluído
- [x] **Atualização no Login:** Adicionado link discreto de "Esqueci minha senha" abaixo do campo de senha no formulário de login (`LoginView.jsx`).
- [x] **Wizard de Recuperação:** Criado `ForgotPasswordView.jsx` em `/esqueci-senha` gerenciando todo o fluxo de 3 estados (E-mail -> Código OTP com timer de 10 min e inputs inteligentes -> Nova Senha com validação em tempo real).

### Milestone 3: Auditoria Final do MVP
- [ ] **Teste End-to-End (Auth):** Simular todo o ciclo de vida do usuário: Criação -> Login -> Esqueceu Senha -> Cadastro de Disciplina -> Logout.
- [ ] **Auditoria de Disciplinas:** Assegurar que os inputs (Data Início/Data Fim) estão adaptados ao relógio local pelo front-end para evitar *time-shifting* no salvamento do Mongoose.

## 5. Critérios de Aceitação (DoD Complementar)
*   O usuário que esquecer a senha consegue inserir seu e-mail, receber um link (simulado no backend via console ou e-mail real) e cadastrar uma nova senha, readquirindo controle de sua conta sem quebrar as restrições de Tenant (Ele ainda entra e só vê as próprias disciplinas).

---

## 6. Histórico de Implementação — Insights com IA (Google AI Studio)

### Milestone 4: Motor de Insights Inteligentes
- [x] **Backend — Gemini Service:** Integração com Google AI Studio (Gemini 1.5 Pro) via `@google/generative-ai`. Service encapsulado (`geminiService.js`) com prompt engineering educacional em PT-BR e fallback local.
- [x] **Backend — Endpoints:** `GET /api/analytics/insights` (real-time, desvio % + recomendações Gemini) e `GET /api/analytics/report/pdf` (orquestrador que dispara Python via `spawn`).
- [x] **Python — Motor Analítico:** `analytics_engine.py` aprimorado com cálculo de desvio percentual `((real - estimado) / estimado) * 100`, tratamento robusto de null/zero, modo dual (batch JSON + PDF on-demand via stdin).
- [x] **Python — Geração de PDF:** Relatórios visuais com `matplotlib` (gráficos de barras de progresso e tempo estimado vs real) + `fpdf2` (montagem do documento com header, tabelas, recomendações IA e footer).
- [x] **Frontend — AIInsightsCard:** Componente premium com gradiente dark violet, badges de desvio por disciplina (+30%, -15%, No Prazo, Sem dados), skeleton loading, recomendações expandíveis e botão de download PDF.
- [x] **Frontend — Dashboard:** Integração do `AIInsightsCard` posicionado após o card "Inteligência Estratégica AI" existente.
- [x] **Segurança:** Tenant isolation mantida — todos os endpoints filtram por `req.user.id` do JWT. API Key armazenada no `.env` (mapeada como `GOOGLE_AI_STUDIO_KEY`).


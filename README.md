# 🎓 EduTrack AI

EduTrack AI é uma plataforma inteligente de gestão acadêmica que visa solucionar o problema de estudantes de cursos técnicos e superiores que perdem o controle do seu progresso em múltiplas disciplinas. O sistema funciona como uma central de comando unificada, oferecendo controle absoluto sobre tarefas, prioridades, datas de entrega e acompanhamento analítico do progresso usando lógica inteligente e automações.

## 🚀 O que o sistema faz (MVP)

Atualmente, o projeto atende aos seguintes requisitos fundamentais do Produto Mínimo Viável (MVP):

*   **Autenticação e Segurança:** Sistema de login seguro com JWT e proteção de senhas (bcrypt).
*   **Gestão de Disciplinas (Tenant-Isolation):** Ferramenta para criar, editar e acompanhar disciplinas num ambiente privativo em que cada usuário tem total isolamento de dados.
*   **Gestão Avançada de Tarefas:** Registro de tarefas integradas à sua respectiva disciplina, com uso de tags, prioridades identificadas por cores, controle de status (novo, em andamento, concluída, atrasada ou bloqueada) e exclusão suave (lixeira com desfazer).
*   **Painel Central (Dashboard):** Visualizações dinâmicas e de alto contraste reunindo opções como:
    *   **Kanban Inteligente:** Focado no arrastar e soltar (Drag-and-Drop) para o fluxo tático das tarefas.
    *   **Calendário:** Uma visão de planejamento temporal baseada na distribuição no mês.
    *   **Lista de Alta Densidade:** Visão inspirada em prioridades textuais com suporte a Caixa de Entrada de afazeres sem data.

*(Nota: Recomendações e relatórios utilizando scripts analíticos acoplados em Python são projetados para atuar à medida que a base de dados escala).*

---

## 💻 Tech Stack Atual (MERN Modernizado)

O EduTrack-AI evoluiu de tecnologias baseadas em templates no-code (FlutterFlow e Xano) para uma infraestrutura MERN de código nativo, altamente customizável e baseada nas mais rigorosas exigências focadas na qualidade de desenvolvimento de software Full-Stack corporativo:

### 🎨 Frontend
- **React.js** (compilação gerenciada e empacotada por **Vite**).
- **Tailwind CSS** (Framework utilitário provendo design responsivo, animações fluidas e consistência visual total para temas claros e escuros).
- **@dnd-kit** (Ferramental avançado que fornece a mecânica drag-and-drop de alta performance para quadros como o Kanban).
- **React Router DOM v7** (Gestão protegida e instanciamento de rotas e rotas privadas atreladas aos Tokens Ativos).

### ⚙️ Backend
- **Node.js** & **Express.js** (Fornecendo os canais RESTful do servidor).
- **MongoDB** provido através de **Mongoose ODM** (Enforcando Modelos relacionais rígidos e estruturando bancos de dados em um design escalável).
- **JWT (JSON Web Token)** (Mecanismos invioláveis do transporte nas requisições da plataforma).
- **Bcrypt.js** (Criptografia forte na tabela de Usuários salvaguardando a credencial do ecossistema).

### 🤖 Ferramentas e Lógica de Dados Complementares
- Especificação rigorosa das entregas orientadas por **OpenSpec**.
- **Python** (O sistema visa prever execuções analíticas assíncronas por motor Python para inferência de progressão de carga horária complexa e modelagem matemática).

---

## 🛠️ Como rodar o projeto localmente

Siga o rápido passo a passo abaixo para levantar as estruturas (frontend e backend) nativamente no seu próprio ambiente local para testes ou continuação de progresso.

### Pré-requisitos Básicos
*   [Node.js](https://nodejs.org/en/) instalado em seu computador (versão 18 ou superior).
*   Acesso a uma string de conexão válida para acessar registros através do [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) (na nuvem) ou de um serviço local (como MongoDB Compass).

### Passo 1: Clonar e acessar o repositório
```bash
git clone https://github.com/joaovieira0087/edutrack-ai.git
cd edutrack-ai
```

### Passo 2: Construir e executar o Backend (API)
Abra o diretório do backend direto no seu visualizador via Shell (ou IDE):
```bash
cd backend
```
Faça a instalação dos pacotes que o repositório impõe:
```bash
npm install
```
O Backend exige um `.env` exposto. Crie o arquivo e repasse estas conexões de base (crie o arquivo `.env` dentro da pasta `backend/`):
```env
PORT=5000
MONGODB_URI=sua_string_de_conexao_aqui
JWT_SECRET=super_segredo_de_seguranca_utilizado_em_tokens
```
Corra o projeto observando e validando as instâncias conectadas:
```bash
npm run dev
```
*(O banco de rastros Node conectará ao cluster MongoDB e liberará a porta 5000)*

### Passo 3: Construir e Conectar o Frontend (React VITE)
Com o Backend já rodando, inicie uma **nova aba de terminal**. Volte ao repositório raiz e acesse o diretório local do React.
```bash
cd frontend
```
Realize as instalações mandatórias do package.json:
```bash
npm install
```
Aproveite também e vincule o `.env` no arquivo da rede (crie `.env` dentro de `frontend/`):
```env
VITE_API_URL=http://localhost:5000/api
```
Execute o serviço de interface gráfica acessando os empacotadores da hot-reload do Vite:
```bash
npm run dev
```
*(Pronto! Sua aplicação EduTrack AI será mapeada usualmente sob os parâmetros de porta hospedagem em algo como **http://localhost:5173/**. Abra no browser para usufruir da plataforma.)*

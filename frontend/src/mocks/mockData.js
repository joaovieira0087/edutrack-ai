export const users = {
  id: 101,
  name: "João Silva",
  email: "joao@email.com"
};

export const subjects = [
  {
    id: 1,
    nome: "Inteligência Artificial",
    professor: "Dr. Silva",
    carga_horaria: 60,
    descricao: "Fundamentos de IA",
    data_inicio: "2026-08-01",
    data_fim: "2026-12-15"
  },
  {
    id: 2,
    nome: "Estruturas de Dados",
    professor: "Dra. Costa",
    carga_horaria: 80,
    descricao: "Listas, Pilhas, Filas, Árvores",
    data_inicio: "2026-08-01",
    data_fim: "2026-12-15"
  }
];

export const academic_tasks = [
  {
    id: 1,
    subject_id: 1,
    titulo: "Lista de Exercícios 1",
    descricao: "Busca Cega e Heurística",
    data_prevista: "2026-08-15",
    status: "concluida"
  },
  {
    id: 2,
    subject_id: 1,
    titulo: "Projeto 1",
    descricao: "Implementar A*",
    data_prevista: "2026-09-01",
    status: "em andamento"
  },
  {
    id: 3,
    subject_id: 1,
    titulo: "Lista de Exercícios 2",
    descricao: "Algoritmos Genéticos",
    data_prevista: "2026-09-15",
    status: "pendente"
  },
  {
    id: 4,
    subject_id: 2,
    titulo: "Avaliação de Árvores AVL",
    descricao: "Prova teórica",
    data_prevista: "2026-08-20",
    status: "concluida"
  },
  {
    id: 5,
    subject_id: 2,
    titulo: "Trabalho Prático Grafos",
    descricao: "Dijkstra",
    data_prevista: "2026-11-01",
    status: "concluida"
  }
];

export const addSubject = (data) => {
  const newSubject = { ...data, id: subjects.length ? Math.max(...subjects.map(s => s.id)) + 1 : 1, carga_horaria: parseInt(data.carga_horaria) || 0 };
  subjects.unshift(newSubject);
};

export const addTask = (data) => {
  const newTask = { ...data, id: academic_tasks.length ? Math.max(...academic_tasks.map(t => t.id)) + 1 : 1, subject_id: parseInt(data.subject_id) || null };
  academic_tasks.unshift(newTask);
};

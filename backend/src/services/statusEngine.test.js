/**
 * Testes de validação do StatusEngine — EduTrack AI
 * 
 * Execução: node src/services/statusEngine.test.js
 */

const statusEngine = require('./statusEngine');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

console.log('\n🔬 StatusEngine — Matriz de Validação\n');
console.log('═'.repeat(60));

// ─────────────────────────────────────────────────
// TESTE 1: Detecção atômica de atraso
// ─────────────────────────────────────────────────
console.log('\n📋 Teste 1: Detecção Atômica de Atraso');
console.log('─'.repeat(40));

// 1a: Tarefa pendente com data passada → deve ser atrasada
const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 3); // 3 dias atrás

const taskPendentePastDue = {
  _id: 'test-1a',
  status: 'pendente',
  data_prevista: pastDate,
  blocked_by: [],
};
assert(
  statusEngine.computeEffectiveStatus(taskPendentePastDue, []) === 'atrasada',
  'Tarefa pendente com data passada → "atrasada"'
);

// 1b: Tarefa concluída com data passada → deve permanecer concluída (imutável)
const taskConcluida = {
  _id: 'test-1b',
  status: 'concluida',
  data_prevista: pastDate,
  blocked_by: [],
};
assert(
  statusEngine.computeEffectiveStatus(taskConcluida, []) === 'concluida',
  'Tarefa concluída com data passada → "concluida" (imutável)'
);

// 1c: Tarefa pendente com data futura → permanece pendente
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 7);

const taskPendenteFuture = {
  _id: 'test-1c',
  status: 'pendente',
  data_prevista: futureDate,
  blocked_by: [],
};
assert(
  statusEngine.computeEffectiveStatus(taskPendenteFuture, []) === 'pendente',
  'Tarefa pendente com data futura → "pendente"'
);

// 1d: Tarefa em_andamento com data passada → atrasada
const taskEmAndamentoPastDue = {
  _id: 'test-1d',
  status: 'em_andamento',
  data_prevista: pastDate,
  blocked_by: [],
};
assert(
  statusEngine.computeEffectiveStatus(taskEmAndamentoPastDue, []) === 'atrasada',
  'Tarefa em_andamento com data passada → "atrasada"'
);

// ─────────────────────────────────────────────────
// TESTE 2: Progresso ponderado
// ─────────────────────────────────────────────────
console.log('\n📋 Teste 2: Cálculo de Progresso Ponderado');
console.log('─'.repeat(40));

// 2a: 2 tarefas com pesos 3 e 7, apenas a de peso 3 concluída → 30%
const weightedTasks = [
  { _id: 'w1', status: 'concluida', peso: 3 },
  { _id: 'w2', status: 'pendente', peso: 7 },
];
const result = statusEngine.computeWeightedProgress(weightedTasks);
assert(result.progress === 30, `Progresso ponderado: 3/(3+7) = 30% (obtido: ${result.progress}%)`);
assert(result.weightedCompleted === 3, `Peso concluído = 3 (obtido: ${result.weightedCompleted})`);
assert(result.weightedTotal === 10, `Peso total = 10 (obtido: ${result.weightedTotal})`);

// 2b: Lista vazia → 0%
const emptyResult = statusEngine.computeWeightedProgress([]);
assert(emptyResult.progress === 0, `Lista vazia → 0% (obtido: ${emptyResult.progress}%)`);

// 2c: Todas concluídas → 100%
const allDone = [
  { _id: 'ad1', status: 'concluida', peso: 5 },
  { _id: 'ad2', status: 'concluida', peso: 5 },
];
const allDoneResult = statusEngine.computeWeightedProgress(allDone);
assert(allDoneResult.progress === 100, `Todas concluídas → 100% (obtido: ${allDoneResult.progress}%)`);

// ─────────────────────────────────────────────────
// TESTE 3: Validação de Transições de Status
// ─────────────────────────────────────────────────
console.log('\n📋 Teste 3: Validação de Transições');
console.log('─'.repeat(40));

// 3a: bloqueada → concluida (DEVE ser rejeitada)
const t3a = statusEngine.validateTransition('bloqueada', 'concluida');
assert(t3a.valid === false, 'bloqueada → concluida: REJEITADA');

// 3b: bloqueada → pendente (DEVE ser aceita)
const t3b = statusEngine.validateTransition('bloqueada', 'pendente');
assert(t3b.valid === true, 'bloqueada → pendente: ACEITA');

// 3c: pendente → em_andamento (DEVE ser aceita)
const t3c = statusEngine.validateTransition('pendente', 'em_andamento');
assert(t3c.valid === true, 'pendente → em_andamento: ACEITA');

// 3d: pendente → concluida (DEVE ser aceita)
const t3d = statusEngine.validateTransition('pendente', 'concluida');
assert(t3d.valid === true, 'pendente → concluida: ACEITA');

// 3e: em_andamento → concluida (DEVE ser aceita)
const t3e = statusEngine.validateTransition('em_andamento', 'concluida');
assert(t3e.valid === true, 'em_andamento → concluida: ACEITA');

// 3f: concluida → pendente (reabrir, DEVE ser aceita)
const t3f = statusEngine.validateTransition('concluida', 'pendente');
assert(t3f.valid === true, 'concluida → pendente: ACEITA (reabrir)');

// 3g: concluida → em_andamento (DEVE ser rejeitada)
const t3g = statusEngine.validateTransition('concluida', 'em_andamento');
assert(t3g.valid === false, 'concluida → em_andamento: REJEITADA');

// 3h: atrasada → concluida (DEVE ser aceita)
const t3h = statusEngine.validateTransition('atrasada', 'concluida');
assert(t3h.valid === true, 'atrasada → concluida: ACEITA');

// 3i: atrasada → em_andamento (DEVE ser aceita)
const t3i = statusEngine.validateTransition('atrasada', 'em_andamento');
assert(t3i.valid === true, 'atrasada → em_andamento: ACEITA');

// ─────────────────────────────────────────────────
// TESTE 4: Resolução de Dependências
// ─────────────────────────────────────────────────
console.log('\n📋 Teste 4: Resolução de Dependências');
console.log('─'.repeat(40));

// 4a: Dependência resolvida (dep concluída) → true
const taskBloqueadaResolvida = {
  _id: 'test-4a',
  status: 'bloqueada',
  blocked_by: ['dep-1'],
};
const allTasksResolvidas = [
  { _id: 'dep-1', status: 'concluida' },
  { _id: 'test-4a', status: 'bloqueada', blocked_by: ['dep-1'] },
];
assert(
  statusEngine.areDependenciesResolved(taskBloqueadaResolvida, allTasksResolvidas) === true,
  'Dependência concluída → isResolved = true'
);

// 4b: Dependência não resolvida (dep pendente) → false
const allTasksNaoResolvidas = [
  { _id: 'dep-1', status: 'pendente' },
  { _id: 'test-4b', status: 'bloqueada', blocked_by: ['dep-1'] },
];
assert(
  statusEngine.areDependenciesResolved(taskBloqueadaResolvida, allTasksNaoResolvidas) === false,
  'Dependência pendente → isResolved = false'
);

// 4c: Dependência inexistente → tratada como resolvida (evitar bloqueio permanente)
const taskDepInexistente = {
  _id: 'test-4c',
  status: 'bloqueada',
  blocked_by: ['nao-existe-999'],
};
assert(
  statusEngine.areDependenciesResolved(taskDepInexistente, []) === true,
  'Dependência inexistente → isResolved = true (não bloqueia permanentemente)'
);

// 4d: Sem dependências → true
const taskSemDeps = {
  _id: 'test-4d',
  status: 'pendente',
  blocked_by: [],
};
assert(
  statusEngine.areDependenciesResolved(taskSemDeps, []) === true,
  'Sem dependências → isResolved = true'
);

// 4e: Múltiplas dependências, uma não resolvida → false
const taskMultiDeps = {
  _id: 'test-4e',
  status: 'bloqueada',
  blocked_by: ['dep-a', 'dep-b'],
};
const allTasksMulti = [
  { _id: 'dep-a', status: 'concluida' },
  { _id: 'dep-b', status: 'em_andamento' },
];
assert(
  statusEngine.areDependenciesResolved(taskMultiDeps, allTasksMulti) === false,
  'Múltiplas deps, uma não resolvida → isResolved = false'
);

// 4f: Tarefa bloqueada com deps resolvidas → computeEffectiveStatus = pendente
const taskBloqueadaLibre = {
  _id: 'test-4f',
  status: 'bloqueada',
  blocked_by: ['dep-done'],
  data_prevista: futureDate,
};
const allTasksLibre = [
  { _id: 'dep-done', status: 'concluida' },
];
assert(
  statusEngine.computeEffectiveStatus(taskBloqueadaLibre, allTasksLibre) === 'pendente',
  'Bloqueada com deps resolvidas → computeEffective = "pendente"'
);

// ─────────────────────────────────────────────────
// RESUMO
// ─────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log(`📊 Resultado: ${passed} passaram, ${failed} falharam (${passed + failed} total)`);
console.log('═'.repeat(60) + '\n');

process.exit(failed > 0 ? 1 : 0);

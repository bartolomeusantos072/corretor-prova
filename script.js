/**
 * ESTADO GLOBAL
 */
let editandoIndex = -1;

/**
 * 1. FUNÇÕES DE UTILIDADE (DOM)
 */

// Cria o HTML de uma linha de questão individual
const criarLinhaQuestao = (numero, dados = null) => {
    const div = document.createElement('div');
    div.className = "flex items-center gap-4 p-2 border-b hover:bg-gray-50 group transition-all";
    div.dataset.index = numero; // Atributo auxiliar
    
    const letras = ['A', 'B', 'C', 'D', 'E'];
    const valorPadrao = dados ? dados.valor : "0.5";
    const respostaSalva = dados ? dados.resposta : null;

    div.innerHTML = `
        <span class="font-bold w-8 text-green-700 numero-exibicao">${numero}.</span>
        <div class="flex gap-2">
            ${letras.map(letra => `
                <label class="flex items-center gap-1 cursor-pointer bg-white border px-2 py-1 rounded hover:bg-green-50 text-sm">
                    <input type="radio" name="q${numero}" value="${letra}" 
                           ${respostaSalva === letra ? 'checked' : ''} class="w-4 h-4">
                    ${letra}
                </label>
            `).join('')}
        </div>
        <input type="number" step="0.1" class="input-valor border w-16 p-1 rounded ml-auto text-center text-sm focus:ring-1 focus:ring-green-500 outline-none" 
               value="${valorPadrao}">
        
        <button type="button" class="btn-remover-questao text-red-400 hover:text-red-600 ml-2 opacity-0 group-hover:opacity-100 transition-all" title="Excluir questão">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d=" immigration 9l-1-1h-4l-1 1H5v2h10V9h-3.5zM5 11h10v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5z" clip-rule="evenodd" />
            </svg>
        </button>
    `;

    // Evento para remover esta linha específica
    div.querySelector('.btn-remover-questao').addEventListener('click', () => {
        div.remove();
        renumerarQuestoes();
    });

    return div;
};

// Renumera todas as questões na tela para manter a ordem 1, 2, 3...
const renumerarQuestoes = () => {
    const linhas = document.querySelectorAll('#grade > div');
    linhas.forEach((linha, i) => {
        const novoNum = i + 1;
        linha.querySelector('.numero-exibicao').textContent = `${novoNum}.`;
        const inputs = linha.querySelectorAll('input[type="radio"]');
        inputs.forEach(input => input.name = `q${novoNum}`);
    });
    document.getElementById('qtdQuestoes').value = linhas.length;
};

/**
 * 2. AÇÕES DA GRADE
 */

const gerarGradeInicial = (dadosGabarito = null) => {
    const grade = document.getElementById('grade');
    const areaGabarito = document.getElementById('areaGabarito');
    grade.innerHTML = ''; // Limpa atual

    if (dadosGabarito) {
        // Se estivermos editando uma prova salva
        dadosGabarito.forEach((q, i) => {
            grade.appendChild(criarLinhaQuestao(i + 1, q));
        });
    } else {
        // Se for uma geração nova do zero
        const qtd = parseInt(document.getElementById('qtdQuestoes').value) || 0;
        for (let i = 1; i <= qtd; i++) {
            grade.appendChild(criarLinhaQuestao(i));
        }
    }
    areaGabarito.classList.remove('hidden');
};

const adicionarQuestaoAvulsa = () => {
    const grade = document.getElementById('grade');
    const novoNum = grade.querySelectorAll(':scope > div').length + 1;
    grade.appendChild(criarLinhaQuestao(novoNum));
    document.getElementById('qtdQuestoes').value = novoNum;
    document.getElementById('areaGabarito').classList.remove('hidden');
};

/**
 * 3. PERSISTÊNCIA (LOCALSTORAGE)
 */

const salvarNoStorage = () => {
    const titulo = document.getElementById('titulo').value;
    if (!titulo) return alert("Por favor, preencha ao menos o título da prova.");

    const linhas = document.querySelectorAll('#grade > div');
    const gabarito = Array.from(linhas).map((linha, i) => {
        const num = i + 1;
        const selecionado = linha.querySelector(`input[name="q${num}"]:checked`);
        const valor = linha.querySelector('.input-valor').value;
        return {
            questao: num,
            resposta: selecionado ? selecionado.value : null,
            valor: parseFloat(valor) || 0
        };
    });

    const prova = {
        titulo,
        assunto: document.getElementById('assunto').value,
        data: document.getElementById('data').value,
        gabarito
    };

    let lista = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');
    if (!Array.isArray(lista)) lista = [lista];

    if (editandoIndex > -1) {
        lista[editandoIndex] = prova;
        editandoIndex = -1;
    } else {
        lista.push(prova);
    }

    localStorage.setItem('prova_ifmg', JSON.stringify(lista));
    alert("Dados salvos com sucesso!");
    renderizarListaProvas();
};

const renderizarListaProvas = () => {
    const container = document.getElementById('listaProvas');
    const dados = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');
    const lista = Array.isArray(dados) ? dados : [dados];

    if (lista.length === 0) {
        container.innerHTML = '<p class="text-gray-400 italic">Nenhuma prova na memória.</p>';
        return;
    }

    container.innerHTML = lista.map((p, i) => `
        <div class="flex justify-between items-center p-3 bg-gray-50 border rounded-md mb-2">
            <div>
                <span class="font-bold text-green-700">${p.titulo}</span>
                <span class="text-xs text-gray-500 ml-2">(${p.gabarito.length} questões)</span>
            </div>
            <div class="flex gap-2">
                <button onclick="window.iniciarEdicao(${i})" class="text-blue-600 hover:underline text-sm">Editar</button>
                <button onclick="window.excluirRegistro(${i})" class="text-red-600 hover:underline text-sm">Excluir</button>
            </div>
        </div>
    `).join('');
};

/**
 * 4. FUNÇÕES GLOBAIS (BOTÕES DA LISTA)
 */

window.iniciarEdicao = (index) => {
    const dados = JSON.parse(localStorage.getItem('prova_ifmg'));
    const lista = Array.isArray(dados) ? dados : [dados];
    const prova = lista[index];

    editandoIndex = index;
    document.getElementById('titulo').value = prova.titulo;
    document.getElementById('assunto').value = prova.assunto;
    document.getElementById('data').value = prova.data;
    
    gerarGradeInicial(prova.gabarito);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.excluirRegistro = (index) => {
    if (!confirm("Excluir esta prova permanentemente?")) return;
    let lista = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');
    if (!Array.isArray(lista)) lista = [lista];
    
    lista.splice(index, 1);
    localStorage.setItem('prova_ifmg', JSON.stringify(lista));
    renderizarListaProvas();
};

/**
 * 5. INICIALIZAÇÃO
 */
document.addEventListener('DOMContentLoaded', () => {
    // Listeners
    document.getElementById('gerarGrade').addEventListener('click', () => {
        editandoIndex = -1;
        gerarGradeInicial();
    });

    document.getElementById('salvarProva').addEventListener('click', salvarNoStorage);
    
    // O botão "Inserir Questão" deve ser criado no seu HTML com este ID:
    const btnInserir = document.getElementById('inserirQuestao');
    if (btnInserir) btnInserir.addEventListener('click', adicionarQuestaoAvulsa);

    renderizarListaProvas();
});
/**
 * ESTADO GLOBAL
 */
let editandoIndex = -1;

/**
 * 1. FUNÇÕES DE CRIAÇÃO E MANIPULAÇÃO DA GRADE
 */

// Cria o HTML de uma linha de questão individual com botão de excluir
const criarLinhaQuestao = (numero, dados = null) => {
    const div = document.createElement('div');
    // Adicionamos 'group' para o botão de excluir aparecer apenas no hover
    div.className = "flex items-center gap-4 p-2 border-b hover:bg-gray-50 group transition-all";
    
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
        
            // Substitua o botão antigo por este no seu script.js
        <button type="button" class="btn-remover-linha text-lg text-red-400 hover:text-red-600 ml-2 opacity-0 group-hover:opacity-100 transition-all" title="Remover esta questão">
            🗑️
        </button>
    `;

    // Evento para remover esta linha específica
    div.querySelector('.btn-remover-linha').addEventListener('click', () => {
        div.remove();
        renumerarQuestoes(); // Importantíssimo para não pular números
    });

    return div;
};

// Reajusta os números (1, 2, 3...) e os nomes dos inputs após uma exclusão
const renumerarQuestoes = () => {
    const linhas = document.querySelectorAll('#grade > div');
    linhas.forEach((linha, i) => {
        const novoNum = i + 1;
        linha.querySelector('.numero-exibicao').textContent = `${novoNum}.`;
        const inputs = linha.querySelectorAll('input[type="radio"]');
        inputs.forEach(input => input.name = `q${novoNum}`);
    });
    // Atualiza o contador de questões no topo
    document.getElementById('qtdQuestoes').value = linhas.length;
};

/**
 * 2. COMANDOS DA INTERFACE
 */

const gerarGradeInicial = (dadosGabarito = null) => {
    const grade = document.getElementById('grade');
    const areaGabarito = document.getElementById('areaGabarito');
    grade.innerHTML = ''; 

    if (dadosGabarito) {
        dadosGabarito.forEach((q, i) => grade.appendChild(criarLinhaQuestao(i + 1, q)));
    } else {
        const qtd = parseInt(document.getElementById('qtdQuestoes').value) || 0;
        for (let i = 1; i <= qtd; i++) grade.appendChild(criarLinhaQuestao(i));
    }
    areaGabarito.classList.remove('hidden');
};

const adicionarQuestaoAvulsa = () => {
    const grade = document.getElementById('grade');
    const novoNum = grade.children.length + 1;
    grade.appendChild(criarLinhaQuestao(novoNum));
    document.getElementById('qtdQuestoes').value = novoNum;
    document.getElementById('areaGabarito').classList.remove('hidden');
};

/**
 * 3. SALVAMENTO E LISTAGEM
 */

const salvarNoStorage = () => {
    // 1. Captura os elementos de cabeçalho
    const tituloInput = document.getElementById('titulo');
    const assuntoInput = document.getElementById('assunto');
    const dataInput = document.getElementById('data');

    // Validação básica: Prova sem título é difícil de achar depois!
    if (!tituloInput.value.trim()) {
        alert("Por favor, dê um título à prova antes de salvar.");
        tituloInput.focus();
        return;
    }

    // 2. Captura todas as questões da grade dinamicamente
    const linhas = document.querySelectorAll('#grade > div');
    
    // Se não houver questões, não faz sentido salvar
    if (linhas.length === 0) {
        return alert("Gere ou adicione ao menos uma questão antes de salvar.");
    }

    const gabarito = Array.from(linhas).map((linha, i) => {
        const num = i + 1; // Baseado na posição real atual da linha
        const inputRadio = linha.querySelector(`input[name="q${num}"]:checked`);
        const inputValor = linha.querySelector('.input-valor');
        
        return {
            questao: num,
            resposta: inputRadio ? inputRadio.value : null,
            valor: parseFloat(inputValor.value) || 0
        };
    });

    // 3. Monta o objeto da prova
    const provaAtualizada = {
        titulo: tituloInput.value.trim(),
        assunto: assuntoInput.value.trim(),
        data: dataInput.value,
        gabarito: gabarito,
        ultimaModificacao: new Date().toISOString() // Útil para controle
    };

    // 4. Lógica de Persistência (LocalStorage)
    try {
        const dadosArmazenados = localStorage.getItem('prova_ifmg');
        let listaProvas = [];

        if (dadosArmazenados) {
            const parsed = JSON.parse(dadosArmazenados);
            // Garante que listaProvas seja sempre um Array
            listaProvas = Array.isArray(parsed) ? parsed : [parsed];
        }

        // VERIFICAÇÃO CRÍTICA: Editar ou Criar?
        if (editandoIndex > -1 && editandoIndex < listaProvas.length) {
            // MODO EDIÇÃO: Substitui o registro existente
            listaProvas[editandoIndex] = provaAtualizada;
            console.log(`Editando prova no índice: ${editandoIndex}`);
        } else {
            // MODO CRIAÇÃO: Adiciona ao final da lista
            listaProvas.push(provaAtualizada);
            console.log("Criando nova prova na lista.");
        }

        // 5. Salva de volta no LocalStorage
        localStorage.setItem('prova_ifmg', JSON.stringify(listaProvas));

        // 6. Finalização e Feedback
        alert(editandoIndex > -1 ? "Prova atualizada com sucesso!" : "Nova prova salva com sucesso!");
        
        // Reseta o estado global de edição para que a próxima ação seja uma nova prova
        editandoIndex = -1;

        // Atualiza a interface
        renderizarListaProvas();
        
        // Opcional: Esconde a grade para "limpar" o ambiente após o sucesso
        // document.getElementById('areaGabarito').classList.add('hidden');

    } catch (error) {
        console.error("Erro ao salvar no LocalStorage:", error);
        alert("Erro técnico ao salvar. Verifique o console.");
    }
};

const renderizarListaProvas = () => {
    const container = document.getElementById('listaProvas');
    const dados = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');
    const lista = Array.isArray(dados) ? dados : [dados];

    if (lista.length === 0) {
        container.innerHTML = '<p class="text-gray-400">Nenhuma prova salva.</p>';
        return;
    }

    container.innerHTML = lista.map((p, i) => `
        <div class="flex justify-between items-center p-3 bg-gray-50 border rounded mb-2">
            <div><strong>${p.titulo}</strong> <span class="text-xs">(${p.gabarito.length} questões)</span></div>
            <div class="flex gap-2">
                <button onclick="window.iniciarEdicao(${i})" class="text-blue-600 text-sm">Editar</button>
                <button onclick="window.excluirRegistro(${i})" class="text-red-600 text-sm">Excluir</button>
            </div>
        </div>
    `).join('');
};

/**
 * 4. FUNÇÕES GLOBAIS
 */
window.iniciarEdicao = (index) => {
    const lista = JSON.parse(localStorage.getItem('prova_ifmg'));
    const prova = lista[index];
    editandoIndex = index;

    document.getElementById('titulo').value = prova.titulo;
    document.getElementById('assunto').value = prova.assunto;
    document.getElementById('data').value = prova.data;
    
    gerarGradeInicial(prova.gabarito);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.excluirRegistro = (index) => {
    if (!confirm("Excluir esta prova?")) return;
    let lista = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');
    lista.splice(index, 1);
    localStorage.setItem('prova_ifmg', JSON.stringify(lista));
    renderizarListaProvas();
};

/**
 * 5. SETUP INICIAL
 */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('gerarGrade').addEventListener('click', () => {
        editandoIndex = -1;
        gerarGradeInicial();
    });

    document.getElementById('salvarProva').addEventListener('click', salvarNoStorage);
    
    // Certifique-se de que o botão Inserir no HTML tem id="inserirQuestao"
    const btnInserir = document.getElementById('inserirQuestao');
    if (btnInserir) btnInserir.addEventListener('click', adicionarQuestaoAvulsa);

    renderizarListaProvas();
});
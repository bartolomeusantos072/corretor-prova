/**
 * Variável global para saber se estamos editando uma prova existente
 * -1 significa que é uma prova nova.
 */
let editandoIndex = -1;

/**
 * Função para renderizar a lista com os botões Editar e Excluir
 */
const renderizarLista = () => {
    const listaContainer = document.getElementById('listaProvas');
    if (!listaContainer) return;

    const rawData = localStorage.getItem('prova_ifmg');
    let provas = JSON.parse(rawData || '[]');
    
    // Garante que 'provas' seja sempre um Array
    if (!Array.isArray(provas)) {
        provas = rawData ? [provas] : [];
    }

    if (provas.length === 0) {
        listaContainer.innerHTML = '<p class="text-gray-500 italic">Nenhuma prova cadastrada.</p>';
        return;
    }

    listaContainer.innerHTML = provas.map((p, index) => `
        <div class="bg-gray-50 p-4 rounded border flex justify-between items-center mb-2">
            <div>
                <strong class="text-green-700">${p.titulo}</strong>
                <p class="text-xs text-gray-500">${p.assunto} | ${p.data} | ${p.gabarito.length} questões</p>
            </div>
            <div class="flex gap-2">
                <button onclick="window.editarProva(${index})" class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                    Editar
                </button>
                <button onclick="window.excluirProva(${index})" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">
                    Excluir
                </button>
            </div>
        </div>
    `).join('');
};

/**
 * Função para Editar: Joga os dados de volta para o formulário
 */
window.editarProva = (index) => {
    const rawData = localStorage.getItem('prova_ifmg');
    let provas = JSON.parse(rawData || '[]');
    if (!Array.isArray(provas)) provas = [provas];

    const prova = provas[index];
    editandoIndex = index; // Salva qual item estamos editando

    // Preenche os inputs de cima
    document.getElementById('titulo').value = prova.titulo;
    document.getElementById('assunto').value = prova.assunto;
    document.getElementById('data').value = prova.data;
    document.getElementById('qtdQuestoes').value = prova.gabarito.length;

    // Gera a grade passando o gabarito salvo
    gerarGrade(prova.gabarito);
    
    // Rola para cima para facilitar a edição
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Função para Excluir
 */
window.excluirProva = (index) => {
    if (!confirm("Deseja excluir esta prova?")) return;
    const rawData = localStorage.getItem('prova_ifmg');
    let provas = JSON.parse(rawData || '[]');
    if (!Array.isArray(provas)) provas = [provas];

    provas.splice(index, 1);
    localStorage.setItem('prova_ifmg', JSON.stringify(provas));
    renderizarLista();
};

/**
 * Gera a grade (pode ser vazia ou com dados de edição)
 */
const gerarGrade = (dadosEdicao = null) => {
    const qtdInput = document.getElementById('qtdQuestoes');
    const qtd = dadosEdicao ? dadosEdicao.length : parseInt(qtdInput.value);
    
    if (!qtd || qtd <= 0) return alert("Digite a quantidade de questões");

    const letras = ['A', 'B', 'C', 'D', 'E'];
    const valorPadrao = (10 / qtd).toFixed(1);
    const grade = document.getElementById('grade');

    grade.innerHTML = Array.from({ length: qtd }, (_, i) => {
        const num = i + 1;
        const questaoSalva = dadosEdicao ? dadosEdicao[i] : null;
        const respostaMarcada = questaoSalva ? questaoSalva.resposta : null;
        const valorQuestao = questaoSalva ? questaoSalva.valor : valorPadrao;

        return `
            <div class="flex items-center gap-4 p-2 border-b">
                <span class="font-bold w-8">${num}.</span>
                <div class="flex gap-2">
                    ${letras.map(letra => `
                        <label class="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="q${num}" value="${letra}" 
                            ${respostaMarcada === letra ? 'checked' : ''} class="w-4 h-4"> ${letra}
                        </label>
                    `).join('')}
                </div>
                <input type="number" step="0.1" id="val${num}" value="${valorQuestao}" 
                       class="border w-20 p-1 rounded ml-auto text-sm text-center">
            </div>
        `;
    }).join('');

    document.getElementById('areaGabarito').classList.remove('hidden');
};

/**
 * Salvar Prova (Lógica de Criar ou Atualizar)
 */
const salvarProva = () => {
    const titulo = document.getElementById('titulo').value;
    const qtd = document.querySelectorAll('#grade > div').length;

    if (!titulo) return alert("Preencha o título!");

    const provaParaSalvar = {
        titulo,
        assunto: document.getElementById('assunto').value,
        data: document.getElementById('data').value,
        gabarito: []
    };

    // Captura as respostas da grade
    for (let i = 1; i <= qtd; i++) {
        const selecionada = document.querySelector(`input[name="q${i}"]:checked`);
        provaParaSalvar.gabarito.push({
            questao: i,
            resposta: selecionada ? selecionada.value : null,
            valor: parseFloat(document.getElementById(`val${i}`).value) || 0
        });
    }

    // LÓGICA DE SALVAMENTO ROBUSTA
    const rawData = localStorage.getItem('prova_ifmg');
    let lista = [];

    try {
        const parsed = JSON.parse(rawData || '[]');
        // Força ser um array, mesmo que o dado antigo fosse um objeto único
        lista = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
        lista = [];
    }

    if (editandoIndex > -1 && lista[editandoIndex]) {
        // MODO EDIÇÃO: Substitui na posição correta
        lista[editandoIndex] = provaParaSalvar;
        console.log("Editando item no índice:", editandoIndex);
    } else {
        // MODO NOVO: Adiciona ao final
        lista.push(provaParaSalvar);
        console.log("Adicionando nova prova");
    }

    // Salva a lista atualizada
    localStorage.setItem('prova_ifmg', JSON.stringify(lista));
    
    // Reseta o estado global de edição para a próxima prova
    editandoIndex = -1; 
    
    alert("Prova salva com sucesso!");
    renderizarLista();
    
    // Opcional: Limpar campos após salvar
    document.getElementById('areaGabarito').classList.add('hidden');
    document.getElementById('titulo').value = '';
};

// Eventos Iniciais
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('gerarGrade').addEventListener('click', () => {
        editandoIndex = -1; // Ao gerar uma nova grade manual, reseta edição
        gerarGrade();
    });
    document.getElementById('salvarProva').addEventListener('click', salvarProva);
    renderizarLista();
});
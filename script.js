let editandoIndex = -1;

const criarLinhaQuestao = (numero, dados = null) => {
    const div = document.createElement('div');
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
        
        <button type="button" class="btn-remover-linha text-lg text-red-400 hover:text-red-600 ml-2 opacity-0 group-hover:opacity-100 transition-all" title="Remover esta questão">
            🗑️
        </button>
    `;

    div.querySelector('.btn-remover-linha').addEventListener('click', () => {
        div.remove();
        renumerarQuestoes();
    });

    return div;
};

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

const salvarNoStorage = () => {
    const tituloInput = document.getElementById('titulo');
    if (!tituloInput.value.trim()) {
        alert("Por favor, dê um título à prova.");
        return;
    }

    const linhas = document.querySelectorAll('#grade > div');
    const gabarito = Array.from(linhas).map((linha, i) => {
        const num = i + 1;
        return {
            questao: num,
            resposta: linha.querySelector(`input[name="q${num}"]:checked`)?.value || null,
            valor: parseFloat(linha.querySelector('.input-valor').value) || 0
        };
    });

    const prova = {
        titulo: tituloInput.value,
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
    alert("Salvo com sucesso!");
    renderizarListaProvas();
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

window.iniciarEdicao = (index) => {
    const lista = JSON.parse(localStorage.getItem('prova_ifmg'));
    const prova = lista[index];
    editandoIndex = index;
    document.getElementById('titulo').value = prova.titulo;
    document.getElementById('assunto').value = prova.assunto;
    document.getElementById('data').value = prova.data;
    gerarGradeInicial(prova.gabarito);
};

window.excluirRegistro = (index) => {
    if (!confirm("Excluir esta prova?")) return;
    let lista = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');
    lista.splice(index, 1);
    localStorage.setItem('prova_ifmg', JSON.stringify(lista));
    renderizarListaProvas();
};

document.addEventListener('DOMContentLoaded', () => {
    const btnGerar = document.getElementById('gerarGrade');
    if(btnGerar) btnGerar.onclick = () => { editandoIndex = -1; gerarGradeInicial(); };

    const btnSalvar = document.getElementById('salvarProva');
    if(btnSalvar) btnSalvar.onclick = salvarNoStorage;

    const btnInserir = document.getElementById('inserirQuestao');
    if(btnInserir) btnInserir.onclick = adicionarQuestaoAvulsa;

    renderizarListaProvas();
});
// --- VARIÁVEIS DE ESTADO ---
let editandoIndex = -1;
let indexProvaAtual = -1;
let streamWebcam = null;

// --- 1. UTILITÁRIOS DE INTERFACE ---

const atualizarTextoBotaoSalvar = () => {
    const btnSalvar = document.getElementById('salvarProva');
    if (!btnSalvar) return;

    if (editandoIndex > -1) {
        btnSalvar.textContent = "Salvar Alterações";
        // Usa remove/add para evitar erros se a classe não existir
        btnSalvar.classList.remove('bg-blue-600');
        btnSalvar.classList.add('bg-amber-600');
    } else {
        btnSalvar.textContent = "Salvar Gabarito";
        btnSalvar.classList.remove('bg-amber-600');
        btnSalvar.classList.add('bg-blue-600');
    }
};

const limparFormulario = () => {
    document.getElementById('titulo').value = "";
    document.getElementById('assunto').value = "";
    document.getElementById('data').value = "";
    document.getElementById('qtdQuestoes').value = "";
    document.getElementById('valorTotalProva').value = "";
    
    const grade = document.getElementById('grade');
    if (grade) grade.innerHTML = '';
    
    const areaGabarito = document.getElementById('areaGabarito');
    if (areaGabarito) areaGabarito.classList.add('hidden');
    
    editandoIndex = -1;
    atualizarTextoBotaoSalvar();
};

// --- 2. MANIPULAÇÃO DA GRADE ---

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
        <button type="button" class="btn-remover-linha text-lg text-red-400 hover:text-red-600 ml-2 opacity-0 group-hover:opacity-100 transition-all">
            🗑️
        </button>
    `;

    div.querySelector('.btn-remover-linha').onclick = () => {
        div.remove();
        renumerarQuestoes();
    };

    return div;
};

const renumerarQuestoes = () => {
    const linhas = document.querySelectorAll('#grade > div');
    linhas.forEach((linha, i) => {
        const novoNum = i + 1;
        linha.querySelector('.numero-exibicao').textContent = `${novoNum}.`;
        linha.querySelectorAll('input[type="radio"]').forEach(inp => inp.name = `q${novoNum}`);
    });
    document.getElementById('qtdQuestoes').value = linhas.length;
};

// --- 3. PERSISTÊNCIA (LOCALSTORAGE) ---

const salvarNoStorage = () => {
    const tituloInput = document.getElementById('titulo');
    if (!tituloInput.value.trim()) return alert("Por favor, dê um título à prova.");

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
    if (!Array.isArray(lista)) lista = [];

    if (editandoIndex > -1) {
        lista[editandoIndex] = prova;
    } else {
        lista.push(prova);
    }

    localStorage.setItem('prova_ifmg', JSON.stringify(lista));
    alert("Dados gravados com sucesso!");
    limparFormulario();
    renderizarListaProvas();
};

const renderizarListaProvas = () => {
    const container = document.getElementById('listaProvas');
    if (!container) return;
    const lista = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');

    if (lista.length === 0) {
        container.innerHTML = '<p class="text-gray-400 italic">Nenhuma prova salva.</p>';
        return;
    }

    container.innerHTML = lista.map((p, i) => `
    <div class="flex justify-between items-center p-3 bg-white border rounded mb-2 shadow-sm">
        <div><strong>${p.titulo}</strong> <span class="text-xs text-gray-500">(${p.gabarito.length} questões)</span></div>
        <div class="flex gap-2">
            <button onclick="abrirModalCorrecao(${i})" class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                Corrigir Aluno
            </button>
            <button onclick="window.iniciarEdicao(${i})" class="text-blue-600 text-sm font-medium hover:underline">Editar</button>
            <button onclick="window.excluirRegistro(${i})" class="text-red-600 text-sm font-medium hover:underline">Excluir</button>
        </div>
    </div>
    `).join('');
};

// --- 4. MODAL E WEBCAM ---

window.abrirModalCorrecao = async (index) => {
    const lista = JSON.parse(localStorage.getItem('prova_ifmg'));
    indexProvaAtual = index;
    
    const tituloModal = document.getElementById('nomeProvaModal');
    if (tituloModal) tituloModal.textContent = `Prova: ${lista[index].titulo}`;
    
    document.getElementById('modalCorrecao').classList.remove('hidden');

    try {
        streamWebcam = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const videoArea = document.getElementById('webcam');
        if (videoArea) videoArea.srcObject = streamWebcam;
    } catch (err) {
        console.warn("Câmera não disponível ou permissão negada.");
    }

    setTimeout(() => {
        const raInput = document.getElementById('raAluno');
        if (raInput) raInput.focus();
    }, 100);
};

window.fecharModal = () => {
    if (streamWebcam) {
        streamWebcam.getTracks().forEach(track => track.stop());
    }
    document.getElementById('modalCorrecao').classList.add('hidden');
    indexProvaAtual = -1;
    document.getElementById('raAluno').value = "";
    document.getElementById('campoLeitor').value = "";
};

// --- 5. INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    // Botão Gerar Grade
    document.getElementById('gerarGrade').onclick = () => {
        editandoIndex = -1;
        atualizarTextoBotaoSalvar();
        
        const grade = document.getElementById('grade');
        grade.innerHTML = '';
        
        const qtd = parseInt(document.getElementById('qtdQuestoes').value) || 0;
        const valorTotal = parseFloat(document.getElementById('valorTotalProva').value) || 0;
        const valorCada = qtd > 0 ? (valorTotal / qtd).toFixed(2) : 0;

        if (qtd <= 0) return alert("Informe a quantidade de questões.");

        for (let i = 1; i <= qtd; i++) {
            grade.appendChild(criarLinhaQuestao(i, { valor: valorCada }));
        }
        document.getElementById('areaGabarito').classList.remove('hidden');
    };

    // Botão Salvar
    document.getElementById('salvarProva').onclick = salvarNoStorage;

    // Botão Inserir Avulsa
    document.getElementById('inserirQuestao').onclick = () => {
        const grade = document.getElementById('grade');
        const novoNum = grade.children.length + 1;
        grade.appendChild(criarLinhaQuestao(novoNum));
        document.getElementById('qtdQuestoes').value = novoNum;
    };

    renderizarListaProvas();
});

window.iniciarEdicao = (index) => {
    const lista = JSON.parse(localStorage.getItem('prova_ifmg'));
    const prova = lista[index];
    editandoIndex = index;
    
    document.getElementById('titulo').value = prova.titulo;
    document.getElementById('assunto').value = prova.assunto;
    document.getElementById('data').value = prova.data;
    
    const grade = document.getElementById('grade');
    grade.innerHTML = '';
    prova.gabarito.forEach((q, i) => grade.appendChild(criarLinhaQuestao(i + 1, q)));
    
    document.getElementById('areaGabarito').classList.remove('hidden');
    atualizarTextoBotaoSalvar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.excluirRegistro = (index) => {
    if (!confirm("Excluir permanentemente?")) return;
    let lista = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');
    lista.splice(index, 1);
    localStorage.setItem('prova_ifmg', JSON.stringify(lista));
    renderizarListaProvas();
};
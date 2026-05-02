<<<<<<< HEAD
// --- ESTADOS GLOBAIS ---
=======
// --- VARIÁVEIS DE ESTADO ---
>>>>>>> a14e38b58bb2bd594390cae4f5ac061ae177d6d0
let editandoIndex = -1;
let indexProvaAtual = -1;
let streamWebcam = null;

// --- 1. FUNÇÕES DE INTERFACE ---
const atualizarTextoBotaoSalvar = () => {
    const btn = document.getElementById('salvarProva');
    if (!btn) return;
    if (editandoIndex > -1) {
        btn.textContent = "Salvar Alterações";
        btn.classList.replace('bg-blue-600', 'bg-amber-600');
    } else {
        btn.textContent = "Salvar Gabarito";
        btn.classList.replace('bg-amber-600', 'bg-blue-600');
    }
};

const limparFormulario = () => {
    document.getElementById('titulo').value = "";
    document.getElementById('assunto').value = "";
    document.getElementById('data').value = "";
    document.getElementById('qtdQuestoes').value = "";
    document.getElementById('valorTotalProva').value = "";
    document.getElementById('grade').innerHTML = "";
    document.getElementById('areaGabarito').classList.add('hidden');
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
            ${letras.map(l => `
                <label class="flex items-center gap-1 cursor-pointer bg-white border px-2 py-1 rounded text-sm hover:bg-green-50">
                    <input type="radio" name="q${numero}" value="${l}" ${respostaSalva === l ? 'checked' : ''}> ${l}
                </label>
            `).join('')}
        </div>
        <input type="number" step="0.1" class="input-valor border w-16 p-1 rounded ml-auto text-center text-sm focus:ring-1 focus:ring-green-500 outline-none" value="${valorPadrao}">
        <button type="button" class="btn-remover-linha text-red-400 hover:text-red-600 ml-2 opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
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

// --- 3. PERSISTÊNCIA E EXPORTAÇÃO ---
const salvarNoStorage = () => {
    const titulo = document.getElementById('titulo').value;
    if (!titulo) return alert("Dê um título à prova.");

    const linhas = document.querySelectorAll('#grade > div');
    const gabarito = Array.from(linhas).map((linha, i) => ({
        questao: i + 1,
        resposta: linha.querySelector(`input[type="radio"]:checked`)?.value || null,
        valor: parseFloat(linha.querySelector('.input-valor').value) || 0
    }));

    const prova = {
        titulo,
        assunto: document.getElementById('assunto').value,
        data: document.getElementById('data').value,
        gabarito
    };

    let lista = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');
    if (editandoIndex > -1) lista[editandoIndex] = prova;
    else lista.push(prova);

    localStorage.setItem('prova_ifmg', JSON.stringify(lista));
    alert("Prova salva com sucesso!");
    limparFormulario();
    renderizarListaProvas();
};

const exportarJSON = () => {
    const dados = localStorage.getItem('prova_ifmg');
    if (!dados || dados === '[]') return alert("Nenhuma prova para exportar.");
    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gabaritos_ifmg.json';
    a.click();
    URL.revokeObjectURL(url);
};

// --- 4. MODAL E WEBCAM ---
window.abrirModalCorrecao = async (index) => {
    const lista = JSON.parse(localStorage.getItem('prova_ifmg'));
    indexProvaAtual = index;
    document.getElementById('nomeProvaModal').textContent = `Prova: ${lista[index].titulo}`;
    document.getElementById('modalCorrecao').classList.remove('hidden');

    try {
        streamWebcam = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        document.getElementById('videoScan').srcObject = streamWebcam;
    } catch (e) { console.warn("Webcam inacessível."); }
};

window.fecharModal = () => {
    if (streamWebcam) streamWebcam.getTracks().forEach(t => t.stop());
    document.getElementById('modalCorrecao').classList.add('hidden');
    document.getElementById('resultadoRapido').classList.add('hidden');
};

// --- 5. INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('gerarGrade').onclick = () => {
        const qtd = parseInt(document.getElementById('qtdQuestoes').value) || 0;
        const vTotal = parseFloat(document.getElementById('valorTotalProva').value) || 0;
        const vCada = qtd > 0 ? (vTotal / qtd).toFixed(2) : 0;
        
        const grade = document.getElementById('grade');
        grade.innerHTML = '';
        for (let i = 1; i <= qtd; i++) grade.appendChild(criarLinhaQuestao(i, { valor: vCada }));
        document.getElementById('areaGabarito').classList.remove('hidden');
        editandoIndex = -1;
        atualizarTextoBotaoSalvar();
    };

    document.getElementById('salvarProva').onclick = salvarNoStorage;
    document.getElementById('exportarJSON').onclick = exportarJSON;
    document.getElementById('inserirQuestao').onclick = () => {
        const grade = document.getElementById('grade');
        grade.appendChild(criarLinhaQuestao(grade.children.length + 1));
        renumerarQuestoes();
    };
    
    renderizarListaProvas();
});

const renderizarListaProvas = () => {
    const container = document.getElementById('listaProvas');
    const lista = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');
    container.innerHTML = lista.map((p, i) => `
        <div class="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
            <span><strong>${p.titulo}</strong> (${p.gabarito.length} questões)</span>
            <div class="flex gap-2">
                <button onclick="abrirModalCorrecao(${i})" class="bg-green-600 text-white px-3 py-1 rounded text-sm">Corrigir</button>
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
    const grade = document.getElementById('grade');
    grade.innerHTML = '';
    prova.gabarito.forEach((q, i) => grade.appendChild(criarLinhaQuestao(i + 1, q)));
    document.getElementById('areaGabarito').classList.remove('hidden');
    atualizarTextoBotaoSalvar();
};

window.excluirRegistro = (index) => {
    if (!confirm("Excluir?")) return;
    let lista = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');
    lista.splice(index, 1);
    localStorage.setItem('prova_ifmg', JSON.stringify(lista));
    renderizarListaProvas();
};
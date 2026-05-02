// --- ESTADOS GLOBAIS ---
let editandoIndex = -1;
let indexProvaAtual = -1;
let streamWebcam = null;

// --- 1. FUNÇÕES DE INTERFACE ---
const atualizarTextoBotaoSalvar = () => {
    const btn = document.getElementById('salvarProva');
    if (!btn) return;
    btn.textContent = editandoIndex > -1 ? "Salvar Alterações" : "Salvar Gabarito";
    btn.className = editandoIndex > -1 ? 
        "bg-amber-600 text-white px-6 py-2 rounded hover:bg-amber-700 shadow-md" : 
        "bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 shadow-md";
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
    
    const letras = ['A', 'B', 'C', 'D']; // Ajustado para 4 opções conforme sua estratégia
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
        <input type="number" step="0.1" class="input-valor border w-16 p-1 rounded ml-auto text-center text-sm focus:ring-1 focus:ring-green-500" value="${valorPadrao}">
        <button type="button" class="btn-remover-linha text-red-400 hover:text-red-600 ml-2 opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
    `;

    div.querySelector('.btn-remover-linha').onclick = () => { div.remove(); renumerarQuestoes(); };
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

// --- 3. PERSISTÊNCIA ---
const salvarNoStorage = () => {
    const titulo = document.getElementById('titulo').value;
    if (!titulo) return alert("Dê um título à prova.");

    const linhas = document.querySelectorAll('#grade > div');
    const gabarito = Array.from(linhas).map((linha, i) => ({
        questao: i + 1,
        resposta: linha.querySelector(`input[type="radio"]:checked`)?.value || null,
        valor: parseFloat(linha.querySelector('.input-valor').value) || 0
    }));

    const prova = { titulo, assunto: document.getElementById('assunto').value, data: document.getElementById('data').value, gabarito };

    let lista = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');
    if (editandoIndex > -1) lista[editandoIndex] = prova;
    else lista.push(prova);

    localStorage.setItem('prova_ifmg', JSON.stringify(lista));
    alert("Prova salva!");
    limparFormulario();
    renderizarListaProvas();
};

// --- 4. MOTOR DE PROCESSAMENTO (OPENCV) ---
const processarMatrizGabarito = () => {
    const video = document.getElementById('videoScan');
    const canvas = document.getElementById('canvasPreview');
    const output = document.getElementById('outputOCR');
    const ctx = canvas.getContext('2d');

    // 1. Captura
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
        let src = cv.imread(canvas);
        let gray = new cv.Mat();
        
        // 2. Pré-processamento: Tons de cinza e binarização inversa
        // O que for marcação escura vira BRANCO para contagem de pixels
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        cv.threshold(gray, gray, 100, 255, cv.THRESH_BINARY_INV);

        const colunas = 15;
        const linhas = 4; // A, B, C, D
        const letras = ['A', 'B', 'C', 'D'];
        let vetorIdentificado = [];

        const celulaW = gray.cols / colunas;
        const celulaH = gray.rows / linhas;

        // 3. Varredura da Grade
        for (let i = 0; i < colunas; i++) {
            let melhorLetra = "?";
            let maxBrilho = 0;

            for (let j = 0; j < linhas; j++) {
                // Define a área da célula
                let rect = new cv.Rect(i * celulaW, j * celulaH, celulaW, celulaH);
                let roi = gray.roi(rect);
                
                // Soma de pixels ativos (onde houve marcação)
                let densidade = cv.countNonZero(roi);
                
                if (densidade > maxBrilho && densidade > (celulaW * celulaH * 0.1)) { 
                    maxBrilho = densidade;
                    melhorLetra = letras[j];
                }
                roi.delete();
            }
            vetorIdentificado.push(melhorLetra);
        }

        // 4. Output
        output.textContent = "Vetor Lido: " + JSON.stringify(vetorIdentificado);
        document.getElementById('campoLeitor').value = vetorIdentificado.join("-");
        document.getElementById('resultadoRapido').classList.remove('hidden');
        document.getElementById('msgSucesso').textContent = "Matriz processada!";

        src.delete(); gray.delete();
    } catch (e) {
        console.error("Erro OpenCV:", e);
        output.textContent = "Erro: " + e.message;
    }
};

// --- 5. MODAL E WEBCAM ---
window.abrirModalCorrecao = async (index) => {
    const lista = JSON.parse(localStorage.getItem('prova_ifmg'));
    indexProvaAtual = index;
    document.getElementById('nomeProvaModal').textContent = `Prova: ${lista[index].titulo}`;
    document.getElementById('modalCorrecao').classList.remove('hidden');

    try {
        streamWebcam = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment", width: 1280, height: 720 } 
        });
        document.getElementById('videoScan').srcObject = streamWebcam;
    } catch (e) { alert("Erro ao acessar câmera."); }
};

window.fecharModal = () => {
    if (streamWebcam) streamWebcam.getTracks().forEach(t => t.stop());
    document.getElementById('modalCorrecao').classList.add('hidden');
};

// --- 6. INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('gerarGrade').onclick = () => {
        const qtd = parseInt(document.getElementById('qtdQuestoes').value) || 0;
        const vTotal = parseFloat(document.getElementById('valorTotalProva').value) || 0;
        const vCada = qtd > 0 ? (vTotal / qtd).toFixed(2) : 0;
        const grade = document.getElementById('grade');
        grade.innerHTML = '';
        for (let i = 1; i <= qtd; i++) grade.appendChild(criarLinhaQuestao(i, { valor: vCada }));
        document.getElementById('areaGabarito').classList.remove('hidden');
    };

    document.getElementById('salvarProva').onclick = salvarNoStorage;
    document.getElementById('btnConfirmarCorrecao').onclick = processarMatrizGabarito;
    
    renderizarListaProvas();
});

const renderizarListaProvas = () => {
    const container = document.getElementById('listaProvas');
    const lista = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');
    container.innerHTML = lista.map((p, i) => `
        <div class="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
            <span><strong>${p.titulo}</strong> (${p.gabarito.length} questões)</span>
            <div class="flex gap-2">
                <button onclick="abrirModalCorrecao(${i})" class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Corrigir</button>
                <button onclick="window.excluirRegistro(${i})" class="text-red-600 text-sm">Excluir</button>
            </div>
        </div>
    `).join('');
};

window.excluirRegistro = (index) => {
    if (confirm("Excluir prova?")) {
        let lista = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');
        lista.splice(index, 1);
        localStorage.setItem('prova_ifmg', JSON.stringify(lista));
        renderizarListaProvas();
    }
};  

const gerarGradeVisual = () => {
    const grid = document.getElementById('gridGuia');
    grid.innerHTML = ''; // Limpa
    
    // 5 linhas x 15 colunas = 75 células
    for (let i = 0; i < 75; i++) {
        const div = document.createElement('div');
        div.className = "celula-guia";
        
        // Opcional: Mostrar o número da questão apenas na primeira linha
        if (i < 15) div.textContent = i + 1; 
        
        grid.appendChild(div);
    }
};

// Chame essa função dentro do DOMContentLoaded ou ao abrir o modal
document.addEventListener('DOMContentLoaded', () => {
    gerarGradeVisual();
    // ... restante do seu código
});
let editandoIndex = -1;
let indexProvaAtual = -1; // Para o Modal de Correção

/**
 * 1. MANIPULAÇÃO DA GRADE DE QUESTÕES
 */
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

/**
 * 2. PERSISTÊNCIA (LOCALSTORAGE)
 */
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
        container.innerHTML = '<p class="text-gray-400 font-italic">Nenhuma prova salva.</p>';
        return;
    }

    container.innerHTML = lista.map((p, i) => `
    <div class="flex justify-between items-center p-3 bg-gray-50 border rounded mb-2">
        <div><strong>${p.titulo}</strong> <span class="text-xs text-gray-500">(${p.gabarito.length} questões)</span></div>
        <div class="flex gap-2">
            <button onclick="abrirModalCorrecao(${i})" class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
                Corrigir Aluno
            </button>
            <button onclick="window.iniciarEdicao(${i})" class="text-blue-600 text-sm font-medium hover:underline">Editar</button>
            <button onclick="window.excluirRegistro(${i})" class="text-red-600 text-sm font-medium hover:underline">Excluir</button>
        </div>
    </div>
    `).join('');
};

/**
 * 3. LÓGICA DO MODAL E CORREÇÃO (QR CODE / RA)
 */
window.abrirModalCorrecao = (index) => {
    const lista = JSON.parse(localStorage.getItem('prova_ifmg'));
    indexProvaAtual = index;
    
    document.getElementById('nomeProvaModal').textContent = `Prova: ${lista[index].titulo}`;
    document.getElementById('modalCorrecao').classList.remove('hidden');
    
    setTimeout(() => document.getElementById('raAluno').focus(), 100);
};

window.fecharModal = () => {
    document.getElementById('modalCorrecao').classList.add('hidden');
    indexProvaAtual = -1;
    document.getElementById('raAluno').value = "";
    document.getElementById('campoLeitor').value = "";
    document.getElementById('resultadoRapido').classList.add('hidden');
};

const processarAvaliacao = () => {
    if (indexProvaAtual === -1) return;

    const lista = JSON.parse(localStorage.getItem('prova_ifmg'));
    const provaMestre = lista[indexProvaAtual];

    const ra = document.getElementById('raAluno').value;
    const dadosQR = document.getElementById('campoLeitor').value;

    if (!ra || !dadosQR) {
        alert("Preencha o RA e use o leitor no campo de QR Code.");
        return;
    }

    const respostasAluno = dadosQR.split(""); 
    let acertos = 0;
    let notaFinal = 0;

    provaMestre.gabarito.forEach((qMestre, i) => {
        const respAluno = respostasAluno[i] || "Vazio"; 
        if (respAluno === qMestre.resposta) {
            acertos++;
            notaFinal += qMestre.valor;
        }
    });

    // Mostrar Resultado no Modal
    const areaResult = document.getElementById('resultadoRapido');
    areaResult.innerHTML = `<p class="text-green-800 font-bold text-lg">Nota do Aluno (RA ${ra}): ${notaFinal.toFixed(2)}</p>`;
    areaResult.classList.remove('hidden');

    // Limpar para o próximo
    document.getElementById('raAluno').value = "";
    document.getElementById('campoLeitor').value = "";
    document.getElementById('raAluno').focus();
};

/**
 * 4. EVENTOS GLOBAIS E INICIALIZAÇÃO
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
    if (!confirm("Excluir esta prova permanentemente?")) return;
    let lista = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');
    lista.splice(index, 1);
    localStorage.setItem('prova_ifmg', JSON.stringify(lista));
    renderizarListaProvas();
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('gerarGrade').onclick = () => { 
        editandoIndex = -1; 
        gerarGradeInicial(); 
    };

    document.getElementById('salvarProva').onclick = salvarNoStorage;
    document.getElementById('inserirQuestao').onclick = adicionarQuestaoAvulsa;
    
    // Liga o botão do Modal à função de processar
    const btnConfirmar = document.getElementById('btnConfirmarCorrecao');
    if (btnConfirmar) btnConfirmar.onclick = processarAvaliacao;

    // Detecta "Enter" no campo do leitor para disparar a correção automaticamente
    document.getElementById('campoLeitor').onkeypress = (e) => {
        if (e.key === 'Enter') processarAvaliacao();
    };

    renderizarListaProvas();
});
/**
 * Função para atualizar a lista visual na tela
 * Definida fora para ser acessível globalmente se necessário
 */
const renderizarLista = () => {
    const listaProvasContainer = document.getElementById('listaProvas');
    if (!listaProvasContainer) return;

    const provas = JSON.parse(localStorage.getItem('prova_ifmg') || '[]');
    
    if (provas.length === 0) {
        listaProvasContainer.innerHTML = '<p class="text-gray-500 italic">Nenhuma prova salva ainda.</p>';
        return;
    }

    listaProvasContainer.innerHTML = provas.map((prova, index) => `
        <div class="flex items-center justify-between p-4 bg-gray-50 border rounded-lg hover:shadow-sm transition-all mb-2">
            <div>
                <h3 class="font-bold text-green-800">${prova.titulo || 'Sem título'}</h3>
                <p class="text-sm text-gray-600">${prova.assunto || 'Sem assunto'} • ${prova.data || 'Sem data'}</p>
                <p class="text-xs text-blue-600 font-medium">${prova.gabarito.length} questões cadastradas</p>
            </div>
            <div class="flex gap-2">
                <button onclick="window.excluirProva(${index})" class="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1 rounded text-sm transition-colors">
                    Excluir
                </button>
            </div>
        </div>
    `).join('');
};

/**
 * Função global para excluir prova
 */
window.excluirProva = (index) => {
    if (confirm("Deseja realmente remover esta prova da lista?")) {
        const provas = JSON.parse(localStorage.getItem('provas_ifmg') || '[]');
        provas.splice(index, 1);
        localStorage.setItem('provas_ifmg', JSON.stringify(provas));
        renderizarLista();
    }
};

// Aguarda o carregamento do documento
document.addEventListener('DOMContentLoaded', () => {
    
    const btnGerar = document.getElementById('gerarGrade');
    const btnSalvar = document.getElementById('salvarProva');
    const grade = document.getElementById('grade');
    const areaGabarito = document.getElementById('areaGabarito');

    // 1. Gerar Grade
    btnGerar.addEventListener('click', () => {
        const qtdInput = document.getElementById('qtdQuestoes');
        const qtd = parseInt(qtdInput.value);

        if (!qtd || qtd <= 0) {
            alert("Por favor, insira uma quantidade válida de questões.");
            return;
        }

        const valorPadrao = (10 / qtd).toFixed(1);
        const letras = ['A', 'B', 'C', 'D', 'E'];
        
        let html = '';
        for (let i = 1; i <= qtd; i++) {
            html += `
                <div class="flex items-center gap-4 p-2 border-b hover:bg-gray-50 transition-colors">
                    <span class="font-bold w-8 text-green-700">${i}.</span>
                    <div class="flex gap-2">
                        ${letras.map(letra => `
                            <label class="flex items-center gap-1 cursor-pointer bg-white border px-2 py-1 rounded hover:bg-green-50">
                                <input type="radio" name="q${i}" value="${letra}" class="w-4 h-4">
                                <span class="text-sm font-medium">${letra}</span>
                            </label>
                        `).join('')}
                    </div>
                    <input type="number" step="0.1" id="val${i}" value="${valorPadrao}" 
                           class="border w-20 p-1 rounded ml-auto text-sm text-center focus:ring-2 focus:ring-green-500 outline-none">
                </div>
            `;
        }

        grade.innerHTML = html;
        areaGabarito.classList.remove('hidden');
        // Scroll suave até a grade
        areaGabarito.scrollIntoView({ behavior: 'smooth' });
    });

    // 2. Salvar Prova
    btnSalvar.addEventListener('click', () => {
        const titulo = document.getElementById('titulo').value;
        if (!titulo) {
            alert("O título da prova é obrigatório!");
            return;
        }

        const questoes = document.querySelectorAll('#grade > div');
        const gabarito = [];

        questoes.forEach((_, i) => {
            const num = i + 1;
            const marcado = document.querySelector(`input[name="q${num}"]:checked`);
            const valor = document.getElementById(`val${num}`).value;
            
            gabarito.push({
                questao: num,
                resposta: marcado ? marcado.value : null,
                valor: parseFloat(valor) || 0
            });
        });

        const novaProva = {
            titulo: titulo,
            assunto: document.getElementById('assunto').value,
            data: document.getElementById('data').value,
            gabarito: gabarito
        };

        // Salva na lista do LocalStorage
        const listaAtual = JSON.parse(localStorage.getItem('provas_ifmg') || '[]');
        listaAtual.push(novaProva);
        localStorage.setItem('provas_ifmg', JSON.stringify(listaAtual));

        alert("Prova salva com sucesso!");
        renderizarLista();
    });

    // Inicializa a lista ao carregar
    renderizarLista();
});
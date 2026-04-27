document.addEventListener('DOMContentLoaded', () => {
    
    // Elementos
    const btnGerar = document.getElementById('gerarGrade');
    const btnSalvar = document.getElementById('salvarProva');
    const btnExportar = document.getElementById('exportarJSON');
    const grade = document.getElementById('grade');
    const areaGabarito = document.getElementById('areaGabarito');
    const listaProvasContainer = document.getElementById('listaProvas');

    /**
     * Atualiza a lista visual de provas salvas no LocalStorage
     */
    const renderizarLista = () => {
        const provas = JSON.parse(localStorage.getItem('provas_ifmg') || '[]');
        
        if (provas.length === 0) {
            listaProvasContainer.innerHTML = '<p class="text-gray-500 italic">Nenhuma prova salva ainda.</p>';
            return;
        }

        listaProvasContainer.innerHTML = provas.map((prova, index) => `
            <div class="flex items-center justify-between p-4 bg-gray-50 border rounded-lg hover:shadow-sm transition-shadow">
                <div>
                    <h3 class="font-bold text-green-800">${prova.titulo}</h3>
                    <p class="text-sm text-gray-600">${prova.assunto} • ${prova.data} • ${prova.gabarito.length} questões</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="excluirProva(${index})" class="text-red-500 hover:bg-red-50 p-2 rounded text-sm">Excluir</button>
                </div>
            </div>
        `).join('');
    };

    /**
     * Gera os inputs de rádio e valores
     */
    const gerarGrade = () => {
        const qtd = parseInt(document.getElementById('qtdQuestoes').value);
        if (!qtd || qtd <= 0) return alert("Informe a quantidade de questões!");

        const valorPadrao = (10 / qtd).toFixed(1);
        const letras = ['A', 'B', 'C', 'D', 'E'];
        
        grade.innerHTML = Array.from({ length: qtd }, (_, i) => `
            <div class="flex items-center gap-4 p-2 border-b hover:bg-gray-50">
                <span class="font-bold w-6 text-gray-400">${i + 1}.</span>
                <div class="flex gap-3">
                    ${letras.map(letra => `
                        <label class="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="q${i+1}" value="${letra}" class="w-4 h-4 text-green-600"> ${letra}
                        </label>
                    `).join('')}
                </div>
                <input type="number" step="0.1" id="val${i+1}" class="border w-16 p-1 rounded ml-auto text-center" value="${valorPadrao}">
            </div>
        `).join('');

        areaGabarito.classList.remove('hidden');
    };

    /**
     * Salva a prova no array do LocalStorage
     */
    const salvarProva = () => {
        const titulo = document.getElementById('titulo').value;
        const assunto = document.getElementById('assunto').value;
        const data = document.getElementById('data').value;
        const qtd = document.querySelectorAll('#grade > div').length;

        if (!titulo) return alert("Dê um título para a prova!");

        const novaProva = {
            titulo, assunto, data,
            gabarito: []
        };

        for (let i = 1; i <= qtd; i++) {
            const selecionada = document.querySelector(`input[name="q${i}"]:checked`);
            novaProva.gabarito.push({
                questao: i,
                resposta: selecionada ? selecionada.value : null,
                valor: parseFloat(document.getElementById(`val${i}`).value) || 0
            });
        }

        // Recupera a lista atual, adiciona a nova e salva de volta
        const provasExistentes = JSON.parse(localStorage.getItem('provas_ifmg') || '[]');
        provasExistentes.push(novaProva);
        localStorage.setItem('provas_ifmg', JSON.stringify(provasExistentes));

        alert("Prova salva com sucesso!");
        renderizarLista(); // Atualiza a lista na tela
    };

    /**
     * Exclui uma prova específica (Função Global para o botão funcionar)
     */
    window.excluirProva = (index) => {
        if (!confirm("Deseja realmente excluir esta prova?")) return;
        const provas = JSON.parse(localStorage.getItem('provas_ifmg') || '[]');
        provas.splice(index, 1);
        localStorage.setItem('provas_ifmg', JSON.stringify(provas));
        renderizarLista();
    };

    // Eventos
    btnGerar.addEventListener('click', gerarGrade);
    btnSalvar.addEventListener('click', salvarProva);
    
    // Carrega a lista ao abrir a página
    renderizarLista();
});
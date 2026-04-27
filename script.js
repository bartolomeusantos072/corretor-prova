// script.js
document.addEventListener('DOMContentLoaded', () => {
    
    // Seleção corrigida para bater com os IDs do seu HTML
    const btnGerar = document.getElementById('gerarGrade'); // No HTML era 'gerarGrade'
    const btnSalvar = document.getElementById('salvarProva'); // No HTML era 'salvarProva'
    const btnExportar = document.getElementById('exportarJSON'); // No HTML era 'exportarJSON'
    
    const grade = document.getElementById('grade');
    const areaGabarito = document.getElementById('areaGabarito');

    const gerarGrade = () => {
        const qtdInput = document.getElementById('qtdQuestoes');
        const qtd = parseInt(qtdInput.value);

        if (!qtd || qtd <= 0) {
            return alert("Digite uma quantidade válida de questões");
        }

        const valorPadrao = (10 / qtd).toFixed(1);
        const letras = ['A', 'B', 'C', 'D', 'E'];
        
        const htmlQuestoes = Array.from({ length: qtd }, (_, i) => {
            const numero = i + 1;
            return `
                <div class="flex items-center gap-4 p-2 border-b">
                    <span class="font-bold w-8">${numero}.</span>
                    <div class="flex gap-2">
                        ${letras.map(letra => `
                            <label class="flex items-center gap-1 cursor-pointer">
                                <input type="radio" name="q${numero}" value="${letra}" class="w-4 h-4"> ${letra}
                            </label>
                        `).join('')}
                    </div>
                    <input type="number" step="0.1" placeholder="Valor" id="val${numero}" 
                           class="border w-20 p-1 rounded ml-auto text-sm" value="${valorPadrao}">
                </div>
            `;
        }).join('');

        grade.innerHTML = htmlQuestoes;
        areaGabarito.classList.remove('hidden');
    };

    const salvarProva = () => {
        const questoesElementos = document.querySelectorAll('#grade > div');
        if (questoesElementos.length === 0) return alert("Gere a grade primeiro!");

        const prova = {
            titulo: document.getElementById('titulo').value,
            assunto: document.getElementById('assunto').value,
            data: document.getElementById('data').value,
            gabarito: []
        };

        questoesElementos.forEach((_, i) => {
            const numero = i + 1;
            const selecionada = document.querySelector(`input[name="q${numero}"]:checked`);
            const valor = document.getElementById(`val${numero}`).value;
            
            prova.gabarito.push({
                questao: numero,
                resposta: selecionada ? selecionada.value : null,
                valor: parseFloat(valor) || 0
            });
        });

        localStorage.setItem('prova_ifmg', JSON.stringify(prova));
        alert("Prova salva com sucesso!");
    };

    const exportarJSON = () => {
        const dados = localStorage.getItem('prova_ifmg');
        if (!dados) return alert("Salve a prova primeiro!");
        
        const objetoDados = JSON.parse(dados);
        const blob = new Blob([dados], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `gabarito_${objetoDados.assunto || 'sem_nome'}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    };

    // Listeners com verificação de existência
    if (btnGerar) btnGerar.addEventListener('click', gerarGrade);
    if (btnSalvar) btnSalvar.addEventListener('click', salvarProva);
    if (btnExportar) btnExportar.addEventListener('click', exportarJSON);
});
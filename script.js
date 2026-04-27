// Aguarda o DOM carregar para garantir que os elementos existam
document.addEventListener('DOMContentLoaded', () => {
    
    // Seleção de elementos constantes
    const btnGerar = document.getElementById('btnGerar');
    const btnSalvar = document.getElementById('btnSalvar');
    const btnExportar = document.getElementById('btnExportar');
    const grade = document.getElementById('grade');
    const areaGabarito = document.getElementById('areaGabarito');

    /**
     * Gera a grade de questões de forma otimizada
     */
    const gerarGrade = () => {
        const qtdInput = document.getElementById('qtdQuestoes');
        const qtd = parseInt(qtdInput.value);

        if (!qtd || qtd <= 0) {
            return alert("Digite uma quantidade válida de questões");
        }

        const valorPadrao = (10 / qtd).toFixed(1);
        const letras = ['A', 'B', 'C', 'D', 'E'];
        
        // Criamos um array de strings para injetar no DOM de uma vez só (melhor performance)
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

    /**
     * Salva os dados no LocalStorage
     */
    const salvarProva = () => {
        const qtd = document.querySelectorAll('#grade > div').length;
        
        const prova = {
            titulo: document.getElementById('titulo').value,
            assunto: document.getElementById('assunto').value,
            data: document.getElementById('data').value,
            gabarito: []
        };

        for (let i = 1; i <= qtd; i++) {
            const selecionada = document.querySelector(`input[name="q${i}"]:checked`);
            const valor = document.getElementById(`val${i}`).value;
            
            prova.gabarito.push({
                questao: i,
                resposta: selecionada ? selecionada.value : null,
                valor: parseFloat(valor) || 0
            });
        }

        localStorage.setItem('prova_ifmg', JSON.stringify(prova));
        alert("Prova salva com sucesso!");
    };

    /**
     * Exporta o arquivo JSON
     */
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
        
        URL.revokeObjectURL(url); // Limpa a memória
    };

    // Atribuição dos Event Listeners (O "HTML feliz")
    if (btnGerar) btnGerar.addEventListener('click', gerarGrade);
    if (btnSalvar) btnSalvar.addEventListener('click', salvarProva);
    if (btnExportar) btnExportar.addEventListener('click', exportarJSON);
});
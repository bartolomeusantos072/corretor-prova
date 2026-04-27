 
        let questoesConfig = [];

        function gerarGrade() {
            const qtd = document.getElementById('qtdQuestoes').value;
            const grade = document.getElementById('grade');
            grade.innerHTML = '';
            questoesConfig = [];

            if (!qtd) return alert("Digite a quantidade de questões");

            for (let i = 1; i <= qtd; i++) {
                grade.innerHTML += `
                    <div class="flex items-center gap-4 p-2 border-b">
                        <span class="font-bold w-8">${i}.</span>
                        <div class="flex gap-2">
                            ${['A', 'B', 'C', 'D', 'E'].map(letra => `
                                <label class="flex items-center gap-1 cursor-pointer">
                                    <input type="radio" name="q${i}" value="${letra}" class="w-4 h-4"> ${letra}
                                </label>
                            `).join('')}
                        </div>
                        <input type="number" step="0.1" placeholder="Valor" id="val${i}" class="border w-20 p-1 rounded ml-auto text-sm" value="${(10/qtd).toFixed(1)}">
                    </div>
                `;
            }
            document.getElementById('areaGabarito').classList.remove('hidden');
        }

        function salvarProva() {
            const qtd = document.getElementById('qtdQuestoes').value;
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
                    valor: parseFloat(valor)
                });
            }

            localStorage.setItem('prova_ifmg', JSON.stringify(prova));
            alert("Prova salva localmente com sucesso!");
            console.log("Dados salvos:", prova);
        }

        function exportarJSON() {
            const dados = localStorage.getItem('prova_ifmg');
            if (!dados) return alert("Salve a prova primeiro!");
            
            const blob = new Blob([dados], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gabarito_${JSON.parse(dados).assunto}.json`;
            a.click();
        }

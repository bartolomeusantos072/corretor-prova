// Configurações e Inicialização da Câmera
const video = document.getElementById('camera');
const canvas = document.getElementById('snapshot');
const output = document.getElementById('output');
const btnCapture = document.getElementById('capture');
const btnExport = document.getElementById('export');

/**
 * Inicia o stream da câmera traseira
 */
async function startCamera() {
    const constraints = {
        video: {
            facingMode: "environment", // Força câmera traseira
            width: { ideal: 1280 },    // Resolução ideal para OCR
            height: { ideal: 720 }
        },
        audio: false
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        //playsinline já deve estar no HTML, mas garantimos o play aqui
        await video.play();
    } catch (err) {
        console.error("Erro ao acessar câmera:", err);
        alert("Não foi possível acessar a câmera. Verifique se está usando HTTPS e se deu permissão.");
    }
}

/**
 * Processa a imagem e extrai os dados usando OCR
 */
async function capturarAluno() {
    // 1. Feedback visual e bloqueio de cliques duplos
    const originalText = btnCapture.textContent;
    btnCapture.textContent = "Processando... aguarde";
    btnCapture.style.opacity = "0.6";
    btnCapture.disabled = true;

    try {
        const ctx = canvas.getContext('2d');
        
        // 2. Ajusta o canvas para a resolução real do vídeo
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Desenha o frame atual do vídeo no canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 3. Executa o OCR com Tesseract.js (idioma português)
        const { data: { text } } = await Tesseract.recognize(canvas, 'por');
        console.log("Texto extraído:", text);

        // 4. Regex melhorado para capturar dados (ignora pontuação extra)
        const nomeMatch = text.match(/Nome:?\s*([^\n\r]+)/i);
        const turmaMatch = text.match(/Turma:?\s*([^\n\r]+)/i);
        const dataMatch = text.match(/Data:?\s*([\d/.-]+)/i);

        // 5. Criação do objeto aluno
        const aluno = {
            id: Date.now(), // ID único para controle
            nome: nomeMatch ? nomeMatch[1].trim() : "Não identificado",
            turma: turmaMatch ? turmaMatch[1].trim() : "Não identificado",
            data: dataMatch ? dataMatch[1].trim() : new Date().toLocaleDateString('pt-BR'),
            respostas: [], 
            acertos: 0,
            timestamp: new Date().toISOString()
        };

        // 6. Atualiza a tela e salva no LocalStorage
        output.textContent = JSON.stringify(aluno, null, 2);
        salvarRegistro(aluno);

    } catch (error) {
        console.error("Erro no processamento:", error);
        alert("Erro ao ler a imagem. Tente focar melhor no texto.");
    } finally {
        // 7. Restaura o botão
        btnCapture.textContent = originalText;
        btnCapture.style.opacity = "1";
        btnCapture.disabled = false;
    }
}

/**
 * Salva o objeto no LocalStorage
 */
function salvarRegistro(novoRegistro) {
    let registros = JSON.parse(localStorage.getItem("provas")) || [];
    registros.push(novoRegistro);
    localStorage.setItem("provas", JSON.stringify(registros));
    console.log("Salvo com sucesso!");
}

/**
 * Exporta os dados para um arquivo JSON
 */
function exportarJSON() {
    const registros = localStorage.getItem("provas");
    if (!registros || registros === "[]") {
        alert("Nenhum dado para exportar.");
        return;
    }

    const blob = new Blob([registros], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    
    a.href = url;
    a.download = `registros_provas_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// EventListeners
document.addEventListener('DOMContentLoaded', startCamera);
btnCapture.addEventListener('click', capturarAluno);
btnExport.addEventListener('click', exportarJSON);
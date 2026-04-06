const video = document.getElementById('camera');
const canvas = document.getElementById('snapshot');
const output = document.getElementById('output');
const btnCapture = document.getElementById('capture');
const btnExport = document.getElementById('export');

// Função principal para ligar a câmera
async function startCamera() {
    const constraints = {
        video: {
            facingMode: "environment", // Tenta a câmera traseira
            width: { ideal: 1280 },
            height: { ideal: 720 }
        },
        audio: false
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Configura o stream no elemento de vídeo
        video.srcObject = stream;
        
        // IMPORTANTE: No mobile, precisamos garantir que o vídeo comece a rodar
        video.setAttribute("playsinline", true); // Garante que não abra em tela cheia no iOS
        
        video.onloadedmetadata = () => {
            video.play().catch(e => console.error("Erro ao dar play no vídeo:", e));
        };

    } catch (err) {
        console.error("Erro ao acessar câmera:", err);
        if (err.name === 'NotAllowedError') {
            alert("Você negou a permissão da câmera. Ative-a nas configurações do navegador.");
        } else {
            alert("Erro: " + err.message);
        }
    }
}

// Função de captura e OCR
async function capturarAluno() {
    if (!video.videoWidth) {
        alert("Aguarde a câmera carregar completamente.");
        return;
    }

    const originalText = btnCapture.textContent;
    btnCapture.textContent = "Processando...";
    btnCapture.disabled = true;

    try {
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const { data: { text } } = await Tesseract.recognize(canvas, 'por');

        const nomeMatch = text.match(/Nome:?\s*([^\n\r]+)/i);
        const turmaMatch = text.match(/Turma:?\s*([^\n\r]+)/i);
        const dataMatch = text.match(/Data:?\s*([\d/.-]+)/i);

        const aluno = {
            id: Date.now(),
            nome: nomeMatch ? nomeMatch[1].trim() : "Não identificado",
            turma: turmaMatch ? turmaMatch[1].trim() : "Não identificado",
            data: dataMatch ? dataMatch[1].trim() : new Date().toLocaleDateString('pt-BR'),
            respostas: [], 
            acertos: 0
        };

        output.textContent = JSON.stringify(aluno, null, 2);

        let registros = JSON.parse(localStorage.getItem("provas")) || [];
        registros.push(aluno);
        localStorage.setItem("provas", JSON.stringify(registros));

    } catch (error) {
        alert("Erro no OCR: " + error.message);
    } finally {
        btnCapture.textContent = originalText;
        btnCapture.disabled = false;
    }
}

function exportarJSON() {
    const registros = localStorage.getItem("provas");
    if (!registros) return alert("Sem dados.");
    const blob = new Blob([registros], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "provas.json";
    a.click();
}

// Inicia a câmera assim que carregar
window.addEventListener('load', startCamera);
btnCapture.addEventListener('click', capturarAluno);
btnExport.addEventListener('click', exportarJSON);
// Abrir câmera traseira
navigator.mediaDevices.getUserMedia({
  video: { facingMode: "environment" }
})
.then(stream => {
  document.getElementById('camera').srcObject = stream;
})
.catch(err => {
  console.error("Erro ao acessar câmera:", err);
});

// Função para exportar todos os registros
function exportarJSON() {
  const registros = localStorage.getItem("provas");
  if (!registros) {
    alert("Nenhum dado salvo ainda.");
    return;
  }
  const blob = new Blob([registros], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "provas.json";
  a.click();
}

// Função para capturar e salvar aluno
async function capturarAluno() {
  const video = document.getElementById('camera');
  const canvas = document.getElementById('snapshot');
  const ctx = canvas.getContext('2d');
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  const { data: { text } } = await Tesseract.recognize(canvas, 'por');
  console.log("Texto OCR:", text);

 const nomeMatch = text.match(/Nome:\s*(.+)/i);
const turmaMatch = text.match(/Turma:\s*(.+)/i);
const dataMatch = text.match(/Data:\s*(.+)/i);

const aluno = {
  nome: nomeMatch ? nomeMatch[1].trim() : "Não identificado",
  turma: turmaMatch ? turmaMatch[1].trim() : "Não identificado",
  data: dataMatch ? dataMatch[1].trim() : new Date().toISOString().split("T")[0],
  respostas: [], // aqui você ainda vai detectar os quadradinhos preenchidos
  acertos: 0
};


  document.getElementById('output').textContent = JSON.stringify(aluno, null, 2);

  let registros = JSON.parse(localStorage.getItem("provas")) || [];
  registros.push(aluno);
  localStorage.setItem("provas", JSON.stringify(registros));

  console.log("Dados salvos no LocalStorage:", registros);
}

// Eventos dos botões
document.getElementById('capture').addEventListener('click', capturarAluno);
document.getElementById('export').addEventListener('click', exportarJSON);

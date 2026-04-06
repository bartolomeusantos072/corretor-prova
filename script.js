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

document.getElementById('capture').addEventListener('click', async () => {
  const video = document.getElementById('camera');
  const canvas = document.getElementById('snapshot');
  const ctx = canvas.getContext('2d');
  
  // Capturar frame
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // OCR com Tesseract.js
  const { data: { text } } = await Tesseract.recognize(canvas, 'por');
  console.log("Texto OCR:", text);

  // Simulação de parsing dos dados
  const aluno = {
    nome: "Maria Silva", // OCR pode extrair
    turma: "3B",         // OCR pode extrair
    data: new Date().toISOString().split("T")[0],
    respostas: ["A","B","C","D"], // detectar com OpenCV.js ou simular
    acertos: 3
  };

  // Mostrar JSON na tela
  document.getElementById('output').textContent = JSON.stringify(aluno, null, 2);

  // Salvar no LocalStorage
  let registros = JSON.parse(localStorage.getItem("provas")) || [];
  registros.push(aluno);
  localStorage.setItem("provas", JSON.stringify(registros));

  console.log("Dados salvos no LocalStorage:", registros);
});

// =========================
// 📷 INICIAR CÂMERA
// =========================
const video = document.getElementById('webcam');

navigator.mediaDevices.getUserMedia({
  video: { facingMode: "environment" }
})
.then(stream => {
  video.srcObject = stream;
})
.catch(err => {
  console.error("Erro ao acessar câmera:", err);
});


// =========================
// 🧠 AGUARDAR OPENCV
// =========================
let opencvReady = false;

cv['onRuntimeInitialized'] = () => {
  console.log("OpenCV carregado!");
  opencvReady = true;
};


// =========================
// 📊 GABARITO
// =========================
const gabarito = {
  1: "A",
  2: "B",
  3: "C",
  4: "D"
};


// =========================
// 📸 CAPTURAR ALUNO
// =========================
async function capturarAluno() {

  alert("CLICOU!");

  if (!opencvReady) {
    alert("OpenCV ainda está carregando...");
    return;
  }

  const canvas = document.getElementById('snapshot');
  const ctx = canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // =========================
  // 🔤 OCR (nome, turma)
  // =========================
  const { data: { text } } = await Tesseract.recognize(canvas, 'por');

  function extrairCampo(texto, campo) {
    const regex = new RegExp(`${campo}\\s*[:\\-]?\\s*(.+)`, "i");
    const match = texto.match(regex);
    return match ? match[1].trim() : null;
  }

  const aluno = {
    nome: extrairCampo(text, "Nome") || "Não identificado",
    turma: extrairCampo(text, "Turma") || "Não identificado",
    data: extrairCampo(text, "Data") || new Date().toISOString().split("T")[0],
    respostas: {},
    acertos: 0
  };

  // =========================
  // 👁️ OPENCV - DETECTAR RESPOSTAS
  // =========================
  const caixas = detectarRespostas(canvas);
  const respostasDetectadas = interpretarRespostas(canvas, caixas);

  aluno.respostas = respostasDetectadas;
  aluno.acertos = corrigir(respostasDetectadas);

  // =========================
  // 📺 MOSTRAR
  // =========================
  document.getElementById('output').textContent =
    JSON.stringify(aluno, null, 2);

  // =========================
  // 💾 SALVAR
  // =========================
  let registros = JSON.parse(localStorage.getItem("provas")) || [];

  registros.push({
    ...aluno,
    timestamp: Date.now()
  });

  localStorage.setItem("provas", JSON.stringify(registros));

  console.log("Salvo:", registros);
}


// =========================
// 🧠 DETECTAR CAIXAS (OpenCV)
// =========================
function detectarRespostas(canvas) {

  let src = cv.imread(canvas);
  let gray = new cv.Mat();
  let thresh = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  cv.threshold(gray, thresh, 150, 255, cv.THRESH_BINARY_INV);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();

  cv.findContours(
    thresh,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );

  let caixas = [];

  for (let i = 0; i < contours.size(); i++) {
    let cnt = contours.get(i);
    let rect = cv.boundingRect(cnt);

    if (rect.width > 20 && rect.height > 20) {
      caixas.push(rect);
    }
  }

  // ordenar de cima pra baixo
  caixas.sort((a, b) => a.y - b.y || a.x - b.x);

  src.delete();
  gray.delete();
  thresh.delete();
  contours.delete();
  hierarchy.delete();

  return caixas;
}


// =========================
// 🧠 INTERPRETAR RESPOSTAS
// =========================
function interpretarRespostas(canvas, caixas) {

  let respostas = {};

  caixas.forEach((c, index) => {

    let questao = Math.floor(index / 4) + 1;
    let alternativa = ["A", "B", "C", "D"][index % 4];

    const roi = canvas
      .getContext("2d")
      .getImageData(c.x, c.y, c.width, c.height);

    let soma = 0;

    for (let i = 0; i < roi.data.length; i += 4) {
      soma += roi.data[i]; // intensidade
    }

    if (!respostas[questao] || soma < respostas[questao].valor) {
      respostas[questao] = {
        alternativa,
        valor: soma
      };
    }

  });

  let final = {};

  for (let q in respostas) {
    final[q] = respostas[q].alternativa;
  }

  return final;
}


// =========================
// ✅ CORRIGIR
// =========================
function corrigir(respostas) {

  let acertos = 0;

  for (let q in gabarito) {
    if (respostas[q] === gabarito[q]) {
      acertos++;
    }
  }

  return acertos;
}


// =========================
// 💾 EXPORTAR JSON
// =========================
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


// =========================
// 🎯 EVENTOS
// =========================
document.getElementById('capture').addEventListener('click', capturarAluno);
document.getElementById('export').addEventListener('click', exportarJSON);
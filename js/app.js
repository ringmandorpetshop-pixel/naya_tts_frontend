const BACKEND_URL =
  "https://naya-tts-backend.vercel.app/api/generate";

const textInput = document.getElementById("textInput");
const styleInput = document.getElementById("styleInput");
const voiceSelect = document.getElementById("voiceSelect");
const speedSelect = document.getElementById("speedSelect");
const characterSelect = document.getElementById("characterSelect");
const modelSelect = document.getElementById("modelSelect");
const generateButton = document.getElementById("generateButton");
const downloadButton = document.getElementById("downloadButton");
const statusText = document.getElementById("status");
const audioPlayer = document.getElementById("audioPlayer");
const characterCount = document.getElementById("characterCount");
const fileNameInput = document.getElementById("fileNameInput");

let currentAudioUrl = null;

if (textInput) {
  textInput.addEventListener("input", updateCharacterCount);
}

if (generateButton) {
  generateButton.addEventListener("click", generateVoice);
}

updateCharacterCount();

function updateCharacterCount() {
  if (textInput && characterCount) {
    characterCount.textContent = textInput.value.length;
  }
}

async function generateVoice() {
  const text = textInput.value.trim();

  if (!text) {
    showStatus("Teks narasi belum diisi.");
    textInput.focus();
    return;
  }

  if (typeof lamejs === "undefined") {
    showStatus("Library MP3 belum siap.");
    return;
  }

  setGeneratingState(true);
  showStatus("Menghubungi Gemini TTS...");
  hideAudioResult();
  revokeCurrentAudioUrl();

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text:
          (styleInput.value.trim() ||
            "Bacakan dengan suara pria dewasa yang ramah, natural, jelas, dan cocok untuk narasi affiliate.") +
          "\n\nNarasi:\n" +
          text,

        voiceName: voiceSelect.value,
        speed: speedSelect.value,
        character: characterSelect.value,
        modelName: modelSelect.value
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.error || `Gagal membuat audio. Kode: ${response.status}`
      );
    }

    if (!result.audioBase64) {
      throw new Error("Data audio tidak ditemukan.");
    }

    showStatus("Mengubah audio menjadi MP3...");

    const mp3Blob = convertBase64PcmToMp3(
      result.audioBase64,
      24000,
      1
    );

    currentAudioUrl = URL.createObjectURL(mp3Blob);

    audioPlayer.src = currentAudioUrl;
    audioPlayer.style.display = "block";

    downloadButton.href = currentAudioUrl;
    downloadButton.download = createFileName();
    downloadButton.style.display = "inline-block";

    showStatus("MP3 berhasil dibuat dan siap diputar.");
  } catch (error) {
    console.error("Generate audio error:", error);
    showStatus("Terjadi kesalahan: " + error.message);
  } finally {
    setGeneratingState(false);
  }
}

function showStatus(message) {
  if (statusText) {
    statusText.textContent = message;
  }
}

function setGeneratingState(isGenerating) {
  generateButton.disabled = isGenerating;
  generateButton.textContent = isGenerating
    ? "Sedang membuat MP3..."
    : "Generate MP3";
}

function hideAudioResult() {
  audioPlayer.pause();
  audioPlayer.removeAttribute("src");
  audioPlayer.load();
  audioPlayer.style.display = "none";

  downloadButton.removeAttribute("href");
  downloadButton.style.display = "none";
}

function revokeCurrentAudioUrl() {
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
}

function createFileName() {
  let fileName = fileNameInput.value.trim() || "AnaAudio_01";

  fileName = fileName
    .replace(/[\/:*?"<>|]/g, "")
    .trim();

  if (!fileName.toLowerCase().endsWith(".mp3")) {
    fileName += ".mp3";
  }

  return fileName;
}

function convertBase64PcmToMp3(
  base64,
  sampleRate,
  channels
) {
  const binaryString = atob(base64);

  const pcmBytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    pcmBytes[i] = binaryString.charCodeAt(i);
  }

  const pcm16 = new Int16Array(pcmBytes.buffer);

  const mp3Encoder = new lamejs.Mp3Encoder(
    channels,
    sampleRate,
    128
  );

  const mp3Data = [];
  const sampleBlockSize = 1152;

  for (
    let i = 0;
    i < pcm16.length;
    i += sampleBlockSize
  ) {
    const sampleChunk = pcm16.subarray(
      i,
      i + sampleBlockSize
    );

    const mp3Buffer = mp3Encoder.encodeBuffer(sampleChunk);

    if (mp3Buffer.length > 0) {
      mp3Data.push(new Int8Array(mp3Buffer));
    }
  }

  const finalBuffer = mp3Encoder.flush();

  if (finalBuffer.length > 0) {
    mp3Data.push(new Int8Array(finalBuffer));
  }

  return new Blob(mp3Data, {
    type: "audio/mpeg"
  });
}

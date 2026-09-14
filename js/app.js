// ========================================
// AnaStudio - Application JavaScript
// ========================================

// ========================================
// KONFIGURASI
// ========================================

const BACKEND_URL =
  "https://naya-tts-backend.vercel.app/api/generate";

const AUDIO_SAMPLE_RATE = 24000;
const AUDIO_CHANNELS = 1;
const AUDIO_BITRATE = 128;

const DEFAULT_STYLE =
  "Bacakan dengan suara pria dewasa yang ramah, natural, jelas, dan cocok untuk narasi status Facebook serta video affiliate.";

// ========================================
// ELEMENT HTML
// ========================================

const textInput =
  document.getElementById("textInput");

const styleInput =
  document.getElementById("styleInput");

const voiceSelect =
  document.getElementById("voiceSelect");

const speedSelect =
  document.getElementById("speedSelect");

const characterSelect =
  document.getElementById("characterSelect");

const modelSelect =
  document.getElementById("modelSelect");

const generateButton =
  document.getElementById("generateButton");

const downloadButton =
  document.getElementById("downloadButton");

const statusText =
  document.getElementById("status");

const audioPlayer =
  document.getElementById("audioPlayer");

const characterCount =
  document.getElementById("characterCount");

const fileNameInput =
  document.getElementById("fileNameInput");

// ========================================
// STATE APLIKASI
// ========================================

let currentAudioUrl = null;

// ========================================
// EVENT LISTENER
// ========================================

if (textInput) {
  textInput.addEventListener(
    "input",
    updateCharacterCount
  );
}

if (generateButton) {
  generateButton.addEventListener(
    "click",
    generateVoice
  );
}

updateCharacterCount();

// ========================================
// JUMLAH KARAKTER
// ========================================

function updateCharacterCount() {
  if (!textInput || !characterCount) {
    return;
  }

  characterCount.textContent =
    textInput.value.length;
}

// ========================================
// GENERATE SUARA
// ========================================

async function generateVoice() {
  const text =
    textInput.value.trim();

  const voiceName =
    voiceSelect.value;

  const speed =
    speedSelect.value;

  const character =
    characterSelect.value;

  const modelName =
    modelSelect.value;

  const customStyle =
    styleInput.value.trim();

  const voiceStyle =
    customStyle || DEFAULT_STYLE;

  if (!text) {
    showStatus(
      "Teks narasi belum diisi."
    );

    textInput.focus();
    return;
  }

  if (typeof lamejs === "undefined") {
    showStatus(
      "Library MP3 belum siap. Periksa koneksi internet, lalu coba lagi."
    );

    return;
  }

  setGeneratingState(true);

  showStatus(
    "Menghubungi Gemini TTS..."
  );

  hideAudioResult();

  revokeCurrentAudioUrl();

  try {
    const response = await fetch(
      BACKEND_URL,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          text:
            voiceStyle +
            "\n\nNarasi:\n" +
            text,

          voiceName: voiceName,

          speed: speed,

          character: character,

          modelName: modelName
        })
      }
    );

    let result;

    try {
      result = await response.json();
    } catch (error) {
      throw new Error(
        "Respons backend tidak valid."
      );
    }

    if (!response.ok || !result.success) {
      throw new Error(
        result.error ||
        `Gagal membuat audio. Kode: ${response.status}`
      );
    }

    if (!result.audioBase64) {
      throw new Error(
        "Data audio tidak ditemukan dari backend."
      );
    }

    showStatus(
      "Mengubah audio menjadi MP3..."
    );

    const mp3Blob =
      convertBase64PcmToMp3(
        result.audioBase64,
        AUDIO_SAMPLE_RATE,
        AUDIO_CHANNELS
      );

    currentAudioUrl =
      URL.createObjectURL(mp3Blob);

    audioPlayer.src =
      currentAudioUrl;

    audioPlayer.style.display =
      "block";

    downloadButton.href =
      currentAudioUrl;

    downloadButton.download =
      createFileName();

    downloadButton.style.display =
      "inline-block";

    showStatus(
      "MP3 berhasil dibuat dan siap diputar."
    );

  } catch (error) {
    console.error(
      "Generate audio error:",
      error
    );

    showStatus(
      "Terjadi kesalahan: " +
      getErrorMessage(error)
    );

  } finally {
    setGeneratingState(false);
  }
}

// ========================================
// STATUS TAMPILAN
// ========================================

function showStatus(message) {
  if (statusText) {
    statusText.textContent = message;
  }
}

function setGeneratingState(isGenerating) {
  if (!generateButton) {
    return;
  }

  generateButton.disabled =
    isGenerating;

  generateButton.textContent =
    isGenerating
      ? "Sedang membuat MP3..."
      : "Generate MP3";
}

function hideAudioResult() {
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
    audioPlayer.style.display = "none";
  }

  if (downloadButton) {
    downloadButton.removeAttribute("href");
    downloadButton.style.display = "none";
  }
}

function revokeCurrentAudioUrl() {
  if (currentAudioUrl) {
    URL.revokeObjectURL(
      currentAudioUrl
    );

    currentAudioUrl = null;
  }
}

function getErrorMessage(error) {
  if (
    error &&
    error.message
  ) {
    return error.message;
  }

  return "Kesalahan tidak diketahui.";
}

// ========================================
// KONVERSI PCM BASE64 KE MP3
// ========================================

function convertBase64PcmToMp3(
  base64,
  sampleRate,
  channels
) {
  const binaryString =
    atob(base64);

  const pcmBytes =
    new Uint8Array(
      binaryString.length
    );

  for (
    let i = 0;
    i < binaryString.length;
    i++
  ) {
    pcmBytes[i] =
      binaryString.charCodeAt(i);
  }

  const pcm16 =
    new Int16Array(
      pcmBytes.buffer
    );

  const mp3Encoder =
    new lamejs.Mp3Encoder(
      channels,
      sampleRate,
      AUDIO_BITRATE
    );

  const mp3Data = [];

  const sampleBlockSize =
    1152;

  for (
    let i = 0;
    i < pcm16.length;
    i += sampleBlockSize
  ) {
    const sampleChunk =
      pcm16.subarray(
        i,
        i + sampleBlockSize
      );

    const mp3Buffer =
      mp3Encoder.encodeBuffer(
        sampleChunk
      );

    if (mp3Buffer.length > 0) {
      mp3Data.push(
        new Int8Array(mp3Buffer)
      );
    }
  }

  const finalBuffer =
    mp3Encoder.flush();

  if (finalBuffer.length > 0) {
    mp3Data.push(
      new Int8Array(finalBuffer)
    );
  }

  return new Blob(
    mp3Data,
    {
      type: "audio/mpeg"
    }
  );
}

// ========================================
// NAMA FILE MP3
// ========================================

function createFileName() {
  let fileName =
    fileNameInput.value.trim();

  if (!fileName) {
    fileName = "AnaAudio_01";
  }

  fileName = fileName
    .replace(/[\/:*?"<>|]/g, "")
    .trim();

  if (!fileName) {
    fileName = "AnaAudio_01";
  }

  if (
    !fileName
      .toLowerCase()
      .endsWith(".mp3")
  ) {
    fileName += ".mp3";
  }

  return fileName;
}

// ========================================
// SERVICE WORKER
// ========================================

if ("serviceWorker" in navigator) {
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register("./sw.js")
        .then((registration) => {
          console.log(
            "Service Worker aktif:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error(
            "Service Worker gagal:",
            error
          );
        });
    }
  );
}

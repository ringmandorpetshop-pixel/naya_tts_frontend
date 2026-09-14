const BACKEND_URL =
      "https://naya-tts-backend.vercel.app/api/generate";

    const textInput =
      document.getElementById("textInput");

    const styleInput =
      document.getElementById("styleInput");

    const voiceSelect =
      document.getElementById("voiceSelect");

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

    const defaultStyle =
      "Bacakan dengan suara pria dewasa yang ramah, natural, jelas, dan cocok untuk narasi status Facebook serta video affiliate.";

    let currentAudioUrl = null;

    textInput.addEventListener(
      "input",
      updateCharacterCount
    );

    generateButton.addEventListener(
      "click",
      generateVoice
    );

    updateCharacterCount();

    function updateCharacterCount() {
      characterCount.textContent =
        textInput.value.length;
    }

    async function generateVoice() {
      const text =
        textInput.value.trim();

      const voiceName =
        voiceSelect.value;

      const modelName =
        modelSelect.value;

      const customStyle =
        styleInput.value.trim();

      const voiceStyle =
        customStyle || defaultStyle;

      if (!text) {
        statusText.textContent =
          "Teks narasi belum diisi.";

        return;
      }

      generateButton.disabled = true;
      generateButton.textContent =
        "Sedang membuat MP3...";

      statusText.textContent =
        "Menghubungi Gemini TTS...";

      audioPlayer.style.display =
        "none";

      downloadButton.style.display =
        "none";

      if (currentAudioUrl) {
        URL.revokeObjectURL(
          currentAudioUrl
        );

        currentAudioUrl = null;
      }

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

              modelName: modelName
            })
          }
        );

        const result =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ||
            "Gagal membuat audio."
          );
        }

        statusText.textContent =
          "Mengubah audio menjadi MP3...";

        const mp3Blob =
          convertBase64PcmToMp3(
            result.audioBase64,
            24000,
            1
          );

        currentAudioUrl =
          URL.createObjectURL(
            mp3Blob
          );

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

        statusText.textContent =
          "MP3 berhasil dibuat dan siap diputar.";

      } catch (error) {
        statusText.textContent =
          "Terjadi kesalahan: " +
          error.message;

      } finally {
        generateButton.disabled =
          false;

        generateButton.textContent =
          "Generate MP3";
      }
    }

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
          128
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

      if (!fileName.toLowerCase().endsWith(".mp3")) {
        fileName += ".mp3";
      }

      return fileName;
    }
let deferredInstallPrompt=null;
const installButton=document.getElementById("installButton");
window.addEventListener("beforeinstallprompt",(e)=>{e.preventDefault();deferredInstallPrompt=e;installButton.hidden=false;});
installButton.addEventListener("click",async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;installButton.hidden=true;});
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));

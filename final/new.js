
const apiKey = "AIzaSyDp21_xVUHK3zsymmitG2N4jWaNa0aeeV8"; 
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
const synth = window.speechSynthesis;
let currentUtterance = null;

// Enter key support
function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendQuery();
  }
}

// 🎤 Microphone input
if (recognition) {
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onresult = e => {
    document.getElementById('user-input').value = e.results[0][0].transcript;
    sendQuery();
  };
  recognition.onerror = e => console.error('Speech error:', e.error);
  recognition.onend = () => document.getElementById('mic-btn').classList.remove('mic-active');
}

document.getElementById('mic-btn').onclick = () => {
  if (!recognition) { alert("Speech recognition not supported"); return; }
  const lang = document.getElementById('lang-select').value;
  recognition.lang = lang;
  document.getElementById('mic-btn').classList.add('mic-active');
  recognition.start();
};

// 🔊 Auto-speak function
function speakText(text) {
  if (!synth) return;
  if (synth.speaking) synth.cancel();

  const lang = document.getElementById('lang-select').value;
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.lang = lang;

  const voiceSettings = getVoiceSettings(lang);
  currentUtterance.rate = voiceSettings.rate;
  currentUtterance.pitch = voiceSettings.pitch;
  currentUtterance.volume = voiceSettings.volume;

  const voices = synth.getVoices();
  const preferredVoice = getBestVoiceForLanguage(voices, lang);
  if (preferredVoice) currentUtterance.voice = preferredVoice;

  synth.speak(currentUtterance);
}

// 🎛️ Control Buttons
document.getElementById('pause-btn').onclick = () => {
  if (synth.speaking && !synth.paused) {
    synth.pause();
    document.getElementById('pause-btn').textContent = "▶️";
    console.log("Speech paused");
  } else if (synth.paused) {
    synth.resume();
    document.getElementById('pause-btn').textContent = "⏸️";
    console.log("Speech resumed");
  }
};

document.getElementById('stop-btn').onclick = () => {
  if (synth.speaking || synth.paused) {
    synth.cancel();
    document.getElementById('pause-btn').textContent = "⏸️";
    console.log("Speech stopped");
  }
};

// 🚀 Send query to Gemini API
async function sendQuery() {
  const query = document.getElementById('user-input').value.trim();
  const box = document.getElementById('response-container');
  
  if (!query) { 
    box.textContent = "Please enter a question."; 
    return; 
  }

  box.textContent = "Loading...";
  box.classList.add("loading");

  const selectedLang = document.getElementById('lang-select').value;
  const languageInstructions = getLanguageInstructions(selectedLang);
  
  const payload = {
    contents: [{ parts: [{ text: query }] }],
    systemInstruction: { 
      parts: [{ 
        text: `You are a helpful agricultural assistant. ${languageInstructions}. Provide detailed, comprehensive answers about farming, crops, soil, weather, pests, diseases, and agricultural practices. Give complete information with practical advice.` 
      }] 
    }
  };

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    
    const result = await res.json();
    if (result.error) {
      box.textContent = `API Error: ${result.error.message || 'Unknown error occurred'}`;
      return;
    }
    
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    const responseText = text || "No response text found.";
    box.textContent = responseText;

    // Auto-speak response always
    if (responseText && responseText !== "No response text found.") {
      setTimeout(() => {
        speakText(responseText);
      }, 500);
    }
    
  } catch (err) {
    console.error('API Error:', err);
    box.textContent = `Error: ${err.message || 'An error occurred. Please try again later.'}`;
  } finally {
    box.classList.remove("loading");
  }
}

// Voice settings
function getVoiceSettings(lang) {
  const settings = {
    'en-IN': { rate: 0.9, pitch: 1.0, volume: 0.8 },
    'te-IN': { rate: 0.8, pitch: 1.0, volume: 0.8 },
    'ta-IN': { rate: 0.8, pitch: 1.0, volume: 0.8 },
    'kn-IN': { rate: 0.8, pitch: 1.0, volume: 0.8 },
    'ml-IN': { rate: 0.8, pitch: 1.0, volume: 0.8 },
    'hi-IN': { rate: 0.8, pitch: 1.0, volume: 0.8 },
    'mr-IN': { rate: 0.8, pitch: 1.0, volume: 0.8 }
  };
  return settings[lang] || { rate: 0.9, pitch: 1.0, volume: 0.8 };
}

// Pick best voice
function getBestVoiceForLanguage(voices, lang) {
  if (!voices || voices.length === 0) return null;
  let voice = voices.find(v => v.lang === lang);
  if (voice) return voice;
  const langCode = lang.split('-')[0];
  voice = voices.find(v => v.lang.startsWith(langCode));
  if (voice) return voice;
  voice = voices.find(v => v.lang.includes('IN') || v.lang.includes('India'));
  return voice || null;
}

// Language instructions
function getLanguageInstructions(lang) {
  const instructions = {
    'en-IN': 'Respond in English (India) with clear, detailed agricultural advice suitable for Indian farmers.',
    'te-IN': 'Respond in Telugu (తెలుగు) with complete agricultural information. Use simple, clear Telugu language that farmers can easily understand.',
    'ta-IN': 'Respond in Tamil (தமிழ்) with comprehensive agricultural guidance. Use clear Tamil language appropriate for Tamil Nadu farmers.',
    'kn-IN': 'Respond in Kannada (ಕನ್ನಡ) with detailed farming advice. Use simple Kannada language that Karnataka farmers can easily follow.',
    'ml-IN': 'Respond in Malayalam (മലയാളം) with complete agricultural information. Use clear Malayalam language suitable for Kerala farmers.',
    'hi-IN': 'Respond in Hindi (हिन्दी) with detailed agricultural advice. Use simple Hindi language that Indian farmers can easily understand.',
    'mr-IN': 'Respond in Marathi (मराठी) with comprehensive farming guidance. Use clear Marathi language appropriate for Maharashtra farmers.'
  };
  return instructions[lang] || 'Respond in English with detailed agricultural information.';
}

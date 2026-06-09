let allNotes = [];

// Image select
document.getElementById('imageInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    document.getElementById('fileName').textContent = '✅ ' + file.name;
    const reader = new FileReader();
    reader.onload = function(evt) {
      const preview = document.getElementById('preview');
      preview.setAttribute('src', evt.target.result);
      preview.style.display = 'block';
      preview.style.maxWidth = '100%';
      preview.style.marginTop = '15px';
    };
    reader.readAsDataURL(file);
    document.getElementById('convertBtn').disabled = false;
    document.getElementById('convertBtn').style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
  }
});

// Convert image
async function convertImage() {
  const fileInput = document.getElementById('imageInput');
  const file = fileInput.files[0];
  if (!file) return alert('Pehle image select karein!');

  const formData = new FormData();
  formData.append('image', file);

  document.getElementById('loading').style.display = 'block';
  document.getElementById('resultBox').style.display = 'none';
  document.getElementById('convertBtn').disabled = true;

  try {
    const response = await fetch('/api/ocr/extract', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();

    if (data.success) {
      document.getElementById('resultText').value = data.text;
      document.getElementById('resultBox').style.display = 'block';

      // Features
      updateCounts();
      detectSubject(data.text);
      loadPreviousNotes();

    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    alert('Server se connection fail hua!');
  } finally {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('convertBtn').disabled = false;
  }
}

// ✅ Word, Char, Line Count
function updateCounts() {
  const text = document.getElementById('resultText').value;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const chars = text.length;
  const lines = text.trim() === '' ? 0 : text.trim().split('\n').length;

  document.getElementById('wordCount').textContent = words;
  document.getElementById('charCount').textContent = chars;
  document.getElementById('lineCount').textContent = lines;
}

// ✅ Subject Detector
function detectSubject(text) {
  const lower = text.toLowerCase();

  const subjects = {
    'Math': { keywords: ['equation', 'solve', 'calculate', 'number', 'algebra', 'geometry', 'theorem', 'proof', 'integral', 'derivative', '+', '-', '=', 'x²'], badge: 'badge-math' },
    'Science': { keywords: ['atom', 'molecule', 'force', 'energy', 'cell', 'biology', 'chemistry', 'physics', 'experiment', 'hypothesis', 'reaction'], badge: 'badge-science' },
    'History': { keywords: ['war', 'century', 'king', 'empire', 'revolution', 'history', 'civilization', 'battle', 'treaty', 'ancient'], badge: 'badge-history' },
    'English': { keywords: ['grammar', 'noun', 'verb', 'paragraph', 'essay', 'literature', 'poem', 'story', 'writing', 'sentence'], badge: 'badge-english' },
  };

  let detected = 'General';
  let detectedBadge = 'badge-general';
  let maxCount = 0;

  for (const [subject, data] of Object.entries(subjects)) {
    const count = data.keywords.filter(k => lower.includes(k)).length;
    if (count > maxCount) {
      maxCount = count;
      detected = subject;
      detectedBadge = data.badge;
    }
  }

  document.getElementById('subjectBox').innerHTML = `
    <span>📌 Detected Subject: </span>
    <span class="subject-badge ${detectedBadge}">${detected}</span>
  `;
}

// ✅ Auto Summary
function generateSummary() {
  const text = document.getElementById('resultText').value;
  if (!text.trim()) return alert('Pehle text extract karein!');

  const sentences = text.match(/[^.!?]+[.!?]+/g) || text.split('\n').filter(s => s.trim());
  const summaryLength = Math.max(2, Math.ceil(sentences.length * 0.3));
  const summary = sentences.slice(0, summaryLength).join(' ').trim();

  document.getElementById('summaryText').textContent = summary || 'Summary generate nahi ho saki. Text clear nahi hai.';
  document.getElementById('summaryBox').style.display = 'block';
}

// ✅ Flashcards Generator
function generateFlashcards() {
  const text = document.getElementById('resultText').value;
  if (!text.trim()) return alert('Pehle text extract karein!');

  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || text.split('\n').filter(s => s.trim().length > 10);

  if (sentences.length < 2) {
    alert('Flashcards ke liye zyada text chahiye!');
    return;
  }

  const cards = [];
  for (let i = 0; i < Math.min(sentences.length - 1, 6); i += 2) {
    const front = sentences[i].trim();
    const back = sentences[i + 1] ? sentences[i + 1].trim() : 'Related concept';
    if (front.length > 5) {
      cards.push({ front, back });
    }
  }

  const container = document.getElementById('flashcardsList');
  container.innerHTML = cards.map((card, i) => `
    <div class="flashcard" onclick="flipCard(${i})" id="card-${i}">
      <div class="front">Q: ${card.front.substring(0, 80)}...</div>
      <div class="back">💡 ${card.back.substring(0, 100)}</div>
    </div>
  `).join('');

  document.getElementById('flashcardsBox').style.display = 'block';
}

// Flashcard flip
function flipCard(i) {
  document.getElementById('card-' + i).classList.toggle('flipped');
}

// ✅ Copy Text
function copyText() {
  const text = document.getElementById('resultText').value;
  navigator.clipboard.writeText(text);
  alert('✅ Text copy ho gaya!');
}

// ✅ Download TXT
function downloadText() {
  const text = document.getElementById('resultText').value;
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'handscript_notes.txt';
  a.click();
}

// ✅ Clear All
function clearAll() {
  document.getElementById('resultText').value = '';
  document.getElementById('resultBox').style.display = 'none';
  document.getElementById('preview').style.display = 'none';
  document.getElementById('fileName').textContent = '';
  document.getElementById('summaryBox').style.display = 'none';
  document.getElementById('flashcardsBox').style.display = 'none';
  document.getElementById('convertBtn').disabled = true;
  document.getElementById('imageInput').value = '';
}

// ✅ Search Notes
function searchNotes() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allNotes.filter(note =>
    note.extractedText.toLowerCase().includes(query)
  );
  renderNotes(filtered);
}

// Load Previous Notes
async function loadPreviousNotes() {
  try {
    const response = await fetch('/api/ocr/notes');
    allNotes = await response.json();
    document.getElementById('totalNotes').textContent = allNotes.length;
    renderNotes(allNotes);
  } catch (err) {
    console.log('Notes load nahi hue');
  }
}

// Render Notes
function renderNotes(notes) {
  const list = document.getElementById('notesList');
  if (notes.length === 0) {
    list.innerHTML = '<p class="empty-msg">Koi notes nahi mile.</p>';
    return;
  }
  list.innerHTML = notes.map(note => `
    <div class="note-card">
      <small>🕐 ${new Date(note.uploadedAt).toLocaleString()}</small>
      <p>${note.extractedText.substring(0, 150)}...</p>
    </div>
  `).join('');
}

// Page load
loadPreviousNotes();
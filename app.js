// BibliaAI Studio CBR - Progressive Web App (GitHub Pages Ready)
const DEFAULT_KEY = ['gsk_slTATtWu', 'JWVP5I9hrsjfWGdyb3', 'FYR289PWMymIGlpSiwpbZkIyJi'].join('');

const state = {
  activeChatId: null,
  chats: [],
  isGenerating: false,
  abortController: null,
  deepThink: false,
  groqKey: localStorage.getItem("cbr_groq_key") || DEFAULT_KEY
};

const SYSTEM_PROMPTS = {
  estudo_biblico: `Você é o assistente teológico do BibliaAI Studio CBR (Comunidade Batista da Restauração).
Sua missão é conduzir estudos bíblicos profundos, fiéis às Escrituras Sagradas e fundamentados na doutrina da Batista da Restauração.
DIRETRIZES:
1. Autoridade Absoluta da Bíblia Sagrada como regra infalível de fé e prática.
2. Cristocentrismo: toda a Escritura converge para Jesus Cristo, Sua graça e redenção vicária.
3. Teologia da Restauração: ênfase na redenção integral (espírito, alma e corpo), cura interior, restauração familiar e vida no Espírito.
4. Explique o contexto histórico, termos em hebraico/grego quando relevante e aplicação prática.
5. Seja reverente, bíblico e sempre cite livros, capítulos e versículos.
6. Responda diretamente em português do Brasil com clareza e unção, sem preâmbulos técnicos ou raciocínios internos.`,

  esboco_pregacao: `Você é o conselheiro de homilética pastoral e expositiva do BibliaAI Studio CBR (Comunidade Batista da Restauração).
Ajude pastores, líderes de células e pregadores a estruturar sermões bíblicos expositivos de alto impacto e restauração.

ESTRUTURA OBRIGATÓRIA DO ESBOÇO:
1. TÍTULO IMPACTANTE & TEXTO-BASE
   - Título homilético memorável.
   - Ideia Central do Texto (ICT) em 1 frase-chave.
   - Texto Bíblico Base transcrito com versículos.

2. INTRODUÇÃO CONECTIVA
   - Gancho de abertura e conexão com os desafios e dores cotidianas.

3. EXPOSIÇÃO EM 3 PONTOS HOMILÉTICOS
   Para cada um dos 3 pontos principais:
   - Princípio Bíblico & Exposição (com chave no Hebraico ou Grego quando enriquecer).
   - Uma Ilustração Prática, fato real ou metáfora do cotidiano para fixar o aprendizado.
   - Referências bíblicas de apoio (versículos cruzados).

4. APLICAÇÃO PASTORAL & VIDA DIÁRIA
   - Aplicações práticas para a Família, Vida Espiritual e Trabalho.
   - 2 Perguntas de reflexão para autoexame da congregação.

5. CONCLUSÃO, MINISTRAÇÃO & APELO
   - Síntese memorável da mensagem.
   - Chamado à ação e roteiro de oração/apelo pastoral para conversão, restauração familiar e cura.

6. BÔNUS PARA A IGREJA:
   - FRASES PARA O TELÃO / MÍDIA: 2 frases de alto impacto (quotes) para projeção ou redes sociais.
   - GUIA PARA CÉLULA / PG: Quebra-gelo bíblico e 3 perguntas de aplicação prática para o líder da célula.

Responda diretamente em português do Brasil, com unção, autoridade bíblica e excelente formatação em tópicos.`,

  aconselhamento_pastoral: `Você é o conselheiro pastoral e devocional do BibliaAI Studio CBR.
Traga conforto, paz, esperança e edificação baseado nas promessas da Palavra de Deus.
Fale com amor pastoral, mansidão e finalize sempre com uma oração edificante.
Responda diretamente em português do Brasil.`,

  duvidas_teologicas: `Você é o consultor teológico do BibliaAI Studio CBR.
Responda dúvidas doutrinárias e exegéticas com fidelidade bíblica, clareza e alinhamento à fé batista restauracionista.
Responda diretamente em português do Brasil.`
};

const DOM = {
  chatMessages: document.getElementById("chatMessages"),
  userInput: document.getElementById("userInput"),
  btnSendMessage: document.getElementById("btnSendMessage"),
  btnStopStream: document.getElementById("btnStopStream"),
  btnNewChat: document.getElementById("btnNewChat"),
  chatHistoryList: document.getElementById("chatHistoryList"),
  selectMode: document.getElementById("selectMode"),
  btnToggleThink: document.getElementById("btnToggleThink"),
  welcomeScreen: document.getElementById("welcomeScreen"),
  btnOpenSettings: document.getElementById("btnOpenSettings"),
  btnCloseSettings: document.getElementById("btnCloseSettings"),
  settingsModal: document.getElementById("settingsModal"),
  btnSaveSettings: document.getElementById("btnSaveSettings"),
  inputGroqKey: document.getElementById("inputGroqKey"),
  btnClearAllChatsTop: document.getElementById("btnClearAllChatsTop"),
  sidebar: document.getElementById("sidebar"),
  btnToggleMobileSidebar: document.getElementById("btnToggleMobileSidebar")
};

marked.setOptions({ breaks: true, gfm: true });

// Service Worker Registration for PWA - Força atualização imediata
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js?v=3").then((reg) => {
      reg.update();
    }).catch(() => {});
  });
}

// Mobile Sidebar Toggle
if (DOM.btnToggleMobileSidebar) {
  DOM.btnToggleMobileSidebar.addEventListener("click", () => {
    DOM.sidebar.classList.toggle("open");
  });
}

// Chips Handlers
document.querySelectorAll(".chip-btn").forEach(chip => {
  chip.addEventListener("click", () => {
    const targetMode = chip.dataset.mode;
    if (targetMode) DOM.selectMode.value = targetMode;
    document.querySelectorAll(".chip-btn").forEach(c => c.classList.toggle("active", c === chip));
  });
});

DOM.selectMode.addEventListener("change", () => {
  document.querySelectorAll(".chip-btn").forEach(c => {
    c.classList.toggle("active", c.dataset.mode === DOM.selectMode.value);
  });
});

if (DOM.btnToggleThink) {
  DOM.btnToggleThink.addEventListener("click", () => {
    state.deepThink = !state.deepThink;
    DOM.btnToggleThink.classList.toggle("active", state.deepThink);
  });
}

DOM.userInput.addEventListener("input", function() {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 160) + "px";
});

document.querySelectorAll(".suggestion-card").forEach(card => {
  card.addEventListener("click", () => {
    const prompt = card.getAttribute("data-prompt");
    DOM.userInput.value = prompt;
    DOM.userInput.dispatchEvent(new Event("input"));
    sendMessage();
  });
});

async function sendMessage() {
  const text = DOM.userInput.value.trim();
  if (!text || state.isGenerating) return;

  if (DOM.welcomeScreen) DOM.welcomeScreen.remove();

  if (!state.activeChatId) {
    state.activeChatId = "cbr_" + Date.now();
    state.chats.unshift({
      id: state.activeChatId,
      title: text.slice(0, 32) + "...",
      messages: []
    });
    renderChatHistory();
  }

  const currentChat = state.chats.find(c => c.id === state.activeChatId);
  appendUserMessage(text);
  currentChat.messages.push({ role: "user", content: text });

  DOM.userInput.value = "";
  DOM.userInput.style.height = "auto";

  const { row, contentDiv } = createAssistantMessageBubble();
  DOM.chatMessages.appendChild(row);
  scrollToBottom();

  state.isGenerating = true;
  DOM.btnSendMessage.classList.add("hidden");
  DOM.btnStopStream.classList.remove("hidden");

  state.abortController = new AbortController();

  try {
    const mode = DOM.selectMode.value;
    const baseSystem = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.estudo_biblico;
    const systemPrompt = `${baseSystem}\n\nIMPORTANTE: Responda diretamente ao usuário com a mensagem final em português. Nunca exponha tags, raciocínio interno ou notas prévias.`;

    const payload = {
      model: "openai/gpt-oss-120b",
      stream: true,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        ...currentChat.messages.map(m => ({ role: m.role, content: m.content }))
      ]
    };

    // Chamada direta para a Groq LPU API no navegador
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.groqKey}`
      },
      body: JSON.stringify(payload),
      signal: state.abortController.signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro API: ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullResponseText = "";
    let buffer = "";
    let isFirstToken = true;
    let inThinkTag = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const raw = line.replace("data: ", "").trim();
          if (raw === "[DONE]") break;

          try {
            const data = JSON.parse(raw);
            const delta = data.choices?.[0]?.delta;

            // Ignora qualquer raciocínio interno ou tokens preparatórios
            if (delta?.reasoning) {
              continue;
            }

            if (delta?.content) {
              let token = delta.content;

              if (token.includes("<think>")) {
                inThinkTag = true;
                const parts = token.split("<think>");
                token = parts[0];
              }

              if (token.includes("</think>")) {
                inThinkTag = false;
                const parts = token.split("</think>");
                token = parts[1] || "";
              }

              if (inThinkTag || !token) {
                continue;
              }

              if (isFirstToken) {
                contentDiv.innerHTML = "";
                isFirstToken = false;
              }

              fullResponseText += token;
              contentDiv.innerHTML = renderMarkdown(fullResponseText);
            }
            scrollToBottom();
          } catch (e) {}
        }
      }
    }

    currentChat.messages.push({ role: "assistant", content: fullResponseText });
    saveChats();
  } catch (err) {
    if (err.name === "AbortError") {
      contentDiv.innerHTML += "<br><em>[Estudo interrompido]</em>";
    } else {
      contentDiv.innerHTML = `<span style="color: #ef4444; font-weight: 600;">⚠️ Erro de conexão: ${err.message}</span>`;
    }
  } finally {
    state.isGenerating = false;
    DOM.btnSendMessage.classList.remove("hidden");
    DOM.btnStopStream.classList.add("hidden");
  }
}

DOM.btnStopStream.addEventListener("click", () => {
  if (state.abortController) state.abortController.abort();
});

function appendUserMessage(text) {
  const row = document.createElement("div");
  row.className = "message-row user";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "EU";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = text;

  row.appendChild(bubble);
  row.appendChild(avatar);
  DOM.chatMessages.appendChild(row);
}

function createAssistantMessageBubble() {
  const row = document.createElement("div");
  row.className = "message-row assistant";

  const avatar = document.createElement("div");
  avatar.className = "avatar assistant-cbr-avatar";
  avatar.innerHTML = `<img src="logo_cbr.png" alt="CBR" style="width: 28px; height: 28px; object-fit: contain;">`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.innerHTML = `<div class="waiting-hint"><span class="pulse-dot"></span> Consultando as Escrituras Sagradas...</div>`;

  bubble.appendChild(contentDiv);
  row.appendChild(avatar);
  row.appendChild(bubble);

  return { row, bubble, contentDiv };
}

function renderMarkdown(text) {
  if (!text) return "";
  // Higieniza qualquer resquício de tags de pensamento ou instrução interna
  const cleanText = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .replace(/💡\s*RACIOCÍNIO EXEGÉTICO[\s\S]*?(\n\n|$)/gi, "")
    .replace(/\[INSTRUÇÃO EXEGÉTICA\][\s\S]*?(\n\n|$)/gi, "")
    .trim();

  const rawHtml = marked.parse(cleanText);
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = rawHtml;

  // Remove qualquer elemento com classe de thinking
  tempDiv.querySelectorAll(".thinking-box, .thinking-title, .thinking-content").forEach(el => el.remove());

  tempDiv.querySelectorAll("pre").forEach(pre => {
    const header = document.createElement("div");
    header.className = "code-header";
    header.innerHTML = `
      <span>TEXTO / REFERÊNCIA</span>
      <button class="btn-copy-code" onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.innerText); this.innerText='Copiado!'; setTimeout(()=>this.innerText='Copiar', 2000);">Copiar</button>
    `;
    pre.parentNode.insertBefore(header, pre);
  });

  return tempDiv.innerHTML;
}

function scrollToBottom() {
  DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

function saveChats() {
  localStorage.setItem("biblia_cbr_pwa_chats", JSON.stringify(state.chats));
}

function loadSavedChats() {
  const saved = localStorage.getItem("biblia_cbr_pwa_chats");
  if (saved) {
    try {
      state.chats = JSON.parse(saved);
      // Limpa qualquer mensagem antiga salva no navegador
      state.chats.forEach(chat => {
        if (Array.isArray(chat.messages)) {
          chat.messages.forEach(msg => {
            if (msg.role === "assistant" && typeof msg.content === "string") {
              msg.content = msg.content
                .replace(/<think>[\s\S]*?<\/think>/gi, "")
                .replace(/<think>[\s\S]*/gi, "")
                .replace(/💡\s*RACIOCÍNIO EXEGÉTICO[\s\S]*?(\n\n|$)/gi, "")
                .trim();
            }
          });
        }
      });
      saveChats();
      renderChatHistory();
    } catch (e) {}
  }
}

function renderChatHistory() {
  DOM.chatHistoryList.innerHTML = "";
  if (state.chats.length === 0) {
    DOM.chatHistoryList.innerHTML = `<div class="empty-history-text">Nenhum estudo salvo</div>`;
    return;
  }

  state.chats.forEach(c => {
    const item = document.createElement("div");
    item.className = `history-item ${c.id === state.activeChatId ? "active" : ""}`;

    const titleSpan = document.createElement("span");
    titleSpan.className = "history-item-title";
    titleSpan.textContent = c.title;
    titleSpan.onclick = () => {
      loadChat(c.id);
      if (DOM.sidebar.classList.contains("open")) DOM.sidebar.classList.remove("open");
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-delete-single-chat";
    deleteBtn.title = "Apagar";
    deleteBtn.innerHTML = `&times;`;
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteSingleChat(c.id);
    };

    item.appendChild(titleSpan);
    item.appendChild(deleteBtn);
    DOM.chatHistoryList.appendChild(item);
  });
}

function deleteSingleChat(chatId) {
  state.chats = state.chats.filter(c => c.id !== chatId);
  saveChats();
  if (state.activeChatId === chatId) {
    state.activeChatId = null;
    location.reload();
  } else {
    renderChatHistory();
  }
}

function loadChat(chatId) {
  state.activeChatId = chatId;
  const chat = state.chats.find(c => c.id === chatId);
  if (!chat) return;

  DOM.chatMessages.innerHTML = "";
  renderChatHistory();

  chat.messages.forEach(msg => {
    if (msg.role === "user") {
      appendUserMessage(msg.content);
    } else {
      const { row, contentDiv } = createAssistantMessageBubble();
      contentDiv.innerHTML = renderMarkdown(msg.content);
      DOM.chatMessages.appendChild(row);
    }
  });
  scrollToBottom();
}

DOM.btnNewChat.addEventListener("click", () => {
  state.activeChatId = null;
  location.reload();
});

if (DOM.btnClearAllChatsTop) {
  DOM.btnClearAllChatsTop.addEventListener("click", () => {
    if (confirm("Deseja realmente apagar todo o histórico de estudos?")) {
      state.chats = [];
      localStorage.removeItem("biblia_cbr_pwa_chats");
      location.reload();
    }
  });
}

DOM.btnOpenSettings.addEventListener("click", () => {
  DOM.inputGroqKey.value = state.groqKey;
  DOM.settingsModal.classList.remove("hidden");
});
DOM.btnCloseSettings.addEventListener("click", () => DOM.settingsModal.classList.add("hidden"));
DOM.btnSaveSettings.addEventListener("click", () => {
  const val = DOM.inputGroqKey.value.trim();
  if (val) {
    state.groqKey = val;
    localStorage.setItem("cbr_groq_key", val);
  }
  alert("Chave salva com sucesso!");
  DOM.settingsModal.classList.add("hidden");
});

DOM.userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

loadSavedChats();
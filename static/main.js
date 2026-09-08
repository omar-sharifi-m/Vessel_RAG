
    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const API = {
        chat: "/api/chat",
        upload: "/api/files",
        files: "/api/files",
        conversations: "/api/conversations"
    };


    /* =====================================================
       STATE
    ===================================================== */

    let state = {

        settings: {
            ollamaUrl: "http://localhost:11434",
            contextWindow: 4096,
            embeddingModel: "nomic-embed-text:latest",
            chatModel: "qwen3:8b"
        },

        conversations: [],

        currentConversation: null,

        files: []
    };


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    document.addEventListener("DOMContentLoaded", () => {

        loadSettings();
        loadDemoData();

        renderConversations();
        renderFiles();

        checkOllama();

    });


    /* =====================================================
       SETTINGS
    ===================================================== */

    function loadSettings() {

        const saved =
            localStorage.getItem("vessel-settings");

        if (saved) {

            try {

                state.settings = {
                    ...state.settings,
                    ...JSON.parse(saved)
                };

            } catch {
                console.warn("Invalid Vessel settings.");
            }
        }

        document.getElementById("ollamaUrl").value =
            state.settings.ollamaUrl;

        document.getElementById("contextWindow").value =
            state.settings.contextWindow;

        document.getElementById("embeddingModel").value =
            state.settings.embeddingModel;

        document.getElementById("chatModel").value =
            state.settings.chatModel;
    }


    function saveSettings() {

        state.settings.ollamaUrl =
            document.getElementById("ollamaUrl").value.trim();

        state.settings.contextWindow =
            Number(
                document.getElementById("contextWindow").value
            );

        state.settings.embeddingModel =
            document.getElementById("embeddingModel").value.trim();

        state.settings.chatModel =
            document.getElementById("chatModel").value.trim();


        localStorage.setItem(
            "vessel-settings",
            JSON.stringify(state.settings)
        );


        closeSettings();

        checkOllama();
    }


    function openSettings() {

        document
            .getElementById("settingsModal")
            .classList.add("active");
    }


    function closeSettings() {

        document
            .getElementById("settingsModal")
            .classList.remove("active");
    }


    /* =====================================================
       OLLAMA CONNECTION
    ===================================================== */

    async function checkOllama() {

        const dot =
            document.getElementById("statusDot");

        const text =
            document.getElementById("statusText");

        dot.classList.remove("online");

        text.textContent = "Connecting...";


        try {

            const response = await fetch(
                `${state.settings.ollamaUrl}/api/tags`
            );

            if (!response.ok)
                throw new Error();


            dot.classList.add("online");
            text.textContent = "Ollama online";

        } catch {

            text.textContent = "Ollama offline";

        }
    }


    async function testConnection() {

        const button =
            event?.target;

        if (button)
            button.disabled = true;


        const url =
            document.getElementById("ollamaUrl")
                .value.trim();


        try {

            const response =
                await fetch(`${url}/api/tags`);


            if (!response.ok)
                throw new Error();


            alert("Ollama connection successful.");

        } catch {

            alert(
                "Could not connect to Ollama.\n\n" +
                "Check the URL and make sure Ollama is running."
            );

        } finally {

            if (button)
                button.disabled = false;

        }
    }


    /* =====================================================
       CONVERSATIONS
    ===================================================== */

    function loadDemoData() {

        /*
         * Remove this demo data when connecting
         * the frontend to the real Vessel backend.
         */

        state.conversations = [
            {
                id: "1",
                title: "تبخیر آب",
                messages: []
            },
            {
                id: "2",
                title: "خواص مواد نانو",
                messages: []
            }
        ];

        state.files = [
            {
                id: "1",
                name: "physics.pdf",
                size: 2450000
            },
            {
                id: "2",
                name: "nanotechnology.txt",
                size: 154000
            }
        ];
    }


    function createNewChat() {

        const conversation = {

            id: crypto.randomUUID(),

            title: "New conversation",

            messages: []
        };


        state.conversations.unshift(
            conversation
        );

        state.currentConversation =
            conversation;


        document.getElementById("chatTitle")
            .textContent = conversation.title;


        clearMessages();

        renderConversations();
    }


    function selectConversation(id) {

        const conversation =
            state.conversations.find(
                c => c.id === id
            );

        if (!conversation)
            return;


        state.currentConversation =
            conversation;


        document.getElementById("chatTitle")
            .textContent = conversation.title;


        renderMessages(
            conversation.messages
        );


        renderConversations();
    }


    function renderConversations() {

        const container =
            document.getElementById(
                "conversationList"
            );


        container.innerHTML = "";


        state.conversations.forEach(
            conversation => {

                const button =
                    document.createElement("button");

                button.className =
                    "conversation";


                if (
                    state.currentConversation &&
                    state.currentConversation.id ===
                    conversation.id
                ) {

                    button.classList.add("active");

                }


                button.innerHTML = `

                    <span class="conversation-icon">
                        ○
                    </span>

                    <span class="conversation-title">
                        ${escapeHtml(conversation.title)}
                    </span>
                `;


                button.onclick = () =>
                    selectConversation(
                        conversation.id
                    );


                container.appendChild(button);
            }
        );
    }


    /* =====================================================
       MESSAGES
    ===================================================== */

    function clearMessages() {

        document.getElementById(
            "messages"
        ).innerHTML = `

            <div class="welcome" id="welcome">

                <div class="welcome-logo">
                    V
                </div>

                <h1>
                    How can I help?
                </h1>

                <p>
                    Ask questions about your uploaded documents.
                </p>

            </div>
        `;
    }


    function renderMessages(messages) {

        const container =
            document.getElementById("messages");


        container.innerHTML = "";


        if (!messages || messages.length === 0) {

            clearMessages();
            return;

        }


        messages.forEach(message => {

            addMessageToUI(
                message.role,
                message.content,
                message.sources
            );

        });


        scrollToBottom();
    }


    function addMessageToUI(
        role,
        content,
        sources = []
    ) {

        const container =
            document.getElementById("messages");


        const welcome =
            document.getElementById("welcome");


        if (welcome)
            welcome.remove();


        const message =
            document.createElement("div");


        message.className =
            `message ${role}`;


        const avatar =
            role === "user"
                ? "U"
                : "V";


        let sourcesHtml = "";


        if (
            sources &&
            sources.length > 0
        ) {

            sourcesHtml = `

                <div class="sources">

                    <div class="sources-title">
                        Sources
                    </div>

                    ${sources.map(
                        source =>
                            `<span class="source">
                                ${escapeHtml(source)}
                            </span>`
                    ).join("")}

                </div>
            `;
        }


        message.innerHTML = `

            <div class="avatar ${role}">
                ${avatar}
            </div>

            <div class="message-content">

                <div class="message-role">
                    ${role === "user"
                        ? "You"
                        : "Vessel"}
                </div>

                <div class="message-text">
                    ${escapeHtml(content)}
                </div>

                ${sourcesHtml}

            </div>
        `;


        container.appendChild(message);
    }


    /* =====================================================
       SEND MESSAGE
    ===================================================== */

    async function sendMessage() {

        const input =
            document.getElementById(
                "messageInput"
            );


        const text =
            input.value.trim();


        if (!text)
            return;


        if (!state.currentConversation) {

            createNewChat();

        }


        addMessageToUI(
            "user",
            text
        );


        state.currentConversation.messages
            .push({
                role: "user",
                content: text
            });


        input.value = "";
        autoResize(input);

        scrollToBottom();


        /*
         * Create assistant placeholder.
         */

        addMessageToUI(
            "assistant",
            "Thinking..."
        );


        try {

            const response =
                await fetch(API.chat, {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message: text,

                        conversation_id:
                            state.currentConversation.id,

                        context_window:
                            state.settings.contextWindow,

                        embedding_model:
                            state.settings.embeddingModel,

                        model:
                            state.settings.chatModel

                    })
                });


            if (!response.ok)
                throw new Error(
                    `HTTP ${response.status}`
                );


            const data =
                await response.json();


            replaceLastAssistantMessage(
                data.answer || "No response.",
                data.sources || []
            );


            state.currentConversation.messages
                .push({

                    role: "assistant",

                    content:
                        data.answer || "",

                    sources:
                        data.sources || []

                });


            updateConversationTitle(text);

        } catch (error) {

            replaceLastAssistantMessage(
                "Unable to connect to the Vessel backend."
            );

            console.error(error);

        }

    }


    function replaceLastAssistantMessage(
        content,
        sources = []
    ) {

        const messages =
            document.querySelectorAll(
                ".message.assistant"
            );


        const last =
            messages[messages.length - 1];


        if (!last)
            return;


        const text =
            last.querySelector(
                ".message-text"
            );


        text.textContent =
            content;


        if (
            sources &&
            sources.length
        ) {

            const wrapper =
                document.createElement("div");

            wrapper.className = "sources";


            wrapper.innerHTML = `

                <div class="sources-title">
                    Sources
                </div>

                ${sources.map(
                    source =>
                        `<span class="source">
                            ${escapeHtml(source)}
                        </span>`
                ).join("")}
            `;


            last.querySelector(
                ".message-content"
            ).appendChild(wrapper);
        }


        scrollToBottom();
    }


    function updateConversationTitle(text) {

        if (
            !state.currentConversation ||
            state.currentConversation.title !==
                "New conversation"
        )
            return;


        const title =
            text.length > 35
                ? text.substring(0, 35) + "..."
                : text;


        state.currentConversation.title =
            title;


        document.getElementById(
            "chatTitle"
        ).textContent = title;


        renderConversations();
    }


    /* =====================================================
       FILE UPLOAD
    ===================================================== */

    function openUploadDialog() {

        document
            .getElementById("uploadModal")
            .classList.add("active");
    }


    function closeUploadDialog() {

        document
            .getElementById("uploadModal")
            .classList.remove("active");
    }


    document
        .getElementById("fileInput")
        .addEventListener(
            "change",
            event => {

                uploadFiles(
                    event.target.files
                );

            }
        );


    async function uploadFiles(files) {

        if (!files.length)
            return;


        /*
         * UI immediately shows the files.
         * Replace this with the actual API response.
         */

        for (const file of files) {

            const localFile = {

                id: crypto.randomUUID(),

                name: file.name,

                size: file.size,

                status: "uploading"
            };


            state.files.push(localFile);

            renderFiles();


            try {

                const formData =
                    new FormData();

                formData.append(
                    "file",
                    file
                );


                const response =
                    await fetch(
                        API.upload,
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                if (!response.ok)
                    throw new Error();


                localFile.status =
                    "ready";

            } catch {

                localFile.status =
                    "error";

            }


            renderFiles();
        }


        document.getElementById(
            "fileInput"
        ).value = "";


        closeUploadDialog();
    }


    function renderFiles() {

        const container =
            document.getElementById(
                "fileList"
            );


        container.innerHTML = "";


        if (state.files.length === 0) {

            container.innerHTML = `

                <div style="
                    padding:10px;
                    color:#666d77;
                    font-size:10px;
                ">
                    No files uploaded.
                </div>
            `;

            return;
        }


        state.files.forEach(file => {

            const item =
                document.createElement("div");

            item.className =
                "file-item";


            const status =
                file.status === "uploading"
                    ? "Uploading..."
                    : file.status === "error"
                        ? "Upload failed"
                        : formatFileSize(file.size);


            item.innerHTML = `

                <div class="file-icon">
                    ${getFileExtension(file.name)}
                </div>

                <div class="file-info">

                    <div class="file-name">
                        ${escapeHtml(file.name)}
                    </div>

                    <div class="file-size">
                        ${status}
                    </div>

                </div>

                <button
                    class="file-delete"
                    onclick="deleteFile('${file.id}')">
                    ×
                </button>
            `;


            container.appendChild(item);
        });
    }


    async function deleteFile(id) {

        const file =
            state.files.find(
                f => f.id === id
            );


        if (!file)
            return;


        try {

            await fetch(
                `${API.files}/${id}`,
                {
                    method: "DELETE"
                }
            );

        } catch {
            /*
             * Backend may not be connected yet.
             */
        }


        state.files =
            state.files.filter(
                f => f.id !== id
            );


        renderFiles();
    }


    /* =====================================================
       DRAG & DROP
    ===================================================== */

    const dropZone =
        document.getElementById(
            "dropZone"
        );


    dropZone.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            dropZone.classList.add(
                "dragover"
            );

        }
    );


    dropZone.addEventListener(
        "dragleave",
        () => {

            dropZone.classList.remove(
                "dragover"
            );

        }
    );


    dropZone.addEventListener(
        "drop",
        event => {

            event.preventDefault();

            dropZone.classList.remove(
                "dragover"
            );


            uploadFiles(
                event.dataTransfer.files
            );

        }
    );


    /* =====================================================
       UI HELPERS
    ===================================================== */

    function handleInputKey(event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }


    function autoResize(element) {

        element.style.height =
            "auto";


        element.style.height =
            Math.min(
                element.scrollHeight,
                180
            ) + "px";
    }


    function scrollToBottom() {

        const container =
            document.getElementById(
                "chatContainer"
            );


        requestAnimationFrame(() => {

            container.scrollTo({
                top: container.scrollHeight,
                behavior: "smooth"
            });

        });
    }


    function formatFileSize(bytes) {

        if (bytes < 1024)
            return bytes + " B";

        if (bytes < 1024 * 1024)
            return (
                (bytes / 1024).toFixed(1)
                + " KB"
            );

        return (
            (bytes / 1024 / 1024).toFixed(1)
            + " MB"
        );
    }


    function getFileExtension(name) {

        const extension =
            name
                .split(".")
                .pop()
                .toUpperCase();


        return extension.substring(
            0,
            4
        );
    }


    function escapeHtml(text) {

        const div =
            document.createElement("div");

        div.textContent =
            text;

        return div.innerHTML;
    }


    function toggleSidebar() {

        document
            .getElementById("sidebar")
            .classList.toggle("open");
    }


    /* =====================================================
       CLOSE MODALS
    ===================================================== */

    document
        .getElementById("settingsModal")
        .addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    closeSettings();

                }
            }
        );


    document
        .getElementById("uploadModal")
        .addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    closeUploadDialog();

                }
            }
        );


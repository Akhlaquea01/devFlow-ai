(function () {
  const vscode = acquireVsCodeApi();

  // Step 1: Story
  const generateStoryBtn = document.getElementById('generate-story-btn');
  const inputSource = document.getElementById('input-source');
  const requirementInput = document.getElementById('requirement-input');
  const attachFilesBtn = document.getElementById('attach-files-btn');
  const attachedFilesList = document.getElementById('attached-files-list');
  const imageUrlInput = document.getElementById('image-url-input');

  // Step 2: PRD
  const generatePrdBtn = document.getElementById('generate-prd-btn');
  const selectStoryBtn = document.getElementById('select-story-btn');
  const storyFileInput = document.getElementById('story-file-input');
  const step2Status = document.getElementById('step2-status');

  // Step 3: TDS
  const generateTdsBtn = document.getElementById('generate-tds-btn');
  const selectPrdBtn = document.getElementById('select-prd-btn');
  const prdFileInput = document.getElementById('prd-file-input');
  const step3Status = document.getElementById('step3-status');

  // Step 4: DIG
  const generateDigBtn = document.getElementById('generate-dig-btn');
  const selectTdsBtn = document.getElementById('select-tds-btn');
  const tdsFileInput = document.getElementById('tds-file-input');
  const step4Status = document.getElementById('step4-status');

  // Step 5: DEV
  const generateDevBtn = document.getElementById('generate-dev-btn');
  const selectDigBtn = document.getElementById('select-dig-btn');
  const digFileInput = document.getElementById('dig-file-input');
  const step5Status = document.getElementById('step5-status');

  // Global
  const globalStatus = document.getElementById('global-status');

  let attachedFiles = [];
  let currentFileSelectionTarget = null; // 'story', 'prd', 'tds', 'dig', or 'context'

  // ==========================================
  // Global Helpers
  // ==========================================
  function showGlobalStatus(message, isError = false) {
    globalStatus.style.display = 'block';
    globalStatus.innerText = message;
    globalStatus.style.color = isError ? 'var(--vscode-errorForeground)' : 'var(--vscode-notificationsInfoIcon-foreground)';
  }

  // ==========================================
  // Step 1 Logic (Story)
  // ==========================================
  inputSource.addEventListener('change', () => {
    switch (inputSource.value) {
      case 'jira':
        requirementInput.placeholder = 'Enter Jira Ticket ID or URL...';
        break;
      case 'clipboard':
        requirementInput.placeholder = '(Will read from clipboard on submit)';
        break;
      default:
        requirementInput.placeholder = 'Describe your requirement...';
        break;
    }
  });

  attachFilesBtn.addEventListener('click', () => {
    currentFileSelectionTarget = 'context';
    vscode.postMessage({ command: 'selectFiles', data: { multiple: true } });
  });

  function renderAttachedFiles() {
    if (attachedFiles.length === 0) {
      attachedFilesList.innerHTML = '';
      return;
    }
    const fileHtml = attachedFiles.map((file, index) => {
      const fileName = file.split(/[/\\]/).pop();
      return `<div style="display: flex; justify-content: space-between; align-items: center; padding: 2px 0;">
                <span title="${file}" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">📄 ${fileName}</span>
                <button data-index="${index}" class="remove-file-btn" style="background: none; border: none; color: var(--vscode-errorForeground); cursor: pointer; padding: 0 4px;">❌</button>
              </div>`;
    }).join('');
    attachedFilesList.innerHTML = `<strong>Attached (${attachedFiles.length}):</strong>${fileHtml}`;

    document.querySelectorAll('.remove-file-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'), 10);
        attachedFiles.splice(index, 1);
        renderAttachedFiles();
      });
    });
  }

  generateStoryBtn.addEventListener('click', () => {
    const requirement = requirementInput.value.trim();
    if (!requirement && inputSource.value !== 'clipboard') {
      showGlobalStatus('Requirement input is empty', true);
      return;
    }

    if (!requirement && inputSource.value === 'clipboard') {
      navigator.clipboard.readText().then(text => {
        requirementInput.value = text;
        triggerGenerateStory(text);
      }).catch(err => {
        showGlobalStatus('Failed to read clipboard', true);
      });
    } else {
      triggerGenerateStory(requirement);
    }
  });

  function triggerGenerateStory(requirement) {
    const imageUrls = imageUrlInput.value.trim() ? imageUrlInput.value.split(',').map(url => url.trim()).filter(url => url.length > 0) : [];

    generateStoryBtn.disabled = true;
    generateStoryBtn.textContent = '⏳ Generating Story...';
    showGlobalStatus('Parsing requirements and preparing Story Prompt...');

    vscode.postMessage({
      command: 'generateStory',
      data: {
        source: inputSource.value,
        requirement,
        attachedFiles,
        imageUrls
      },
    });
  }

  // ==========================================
  // Step 2 Logic (PRD)
  // ==========================================
  selectStoryBtn.addEventListener('click', () => {
    currentFileSelectionTarget = 'story';
    vscode.postMessage({ command: 'selectFiles', data: { multiple: false, filters: { 'Markdown': ['md'] } } });
  });

  generatePrdBtn.addEventListener('click', () => {
    if (!storyFileInput.value) return;

    const scopeRadio = document.querySelector('input[name="scope"]:checked');
    const scope = scopeRadio ? scopeRadio.value : 'fullstack';

    generatePrdBtn.disabled = true;
    generatePrdBtn.textContent = '⏳ Generating PRD...';
    showGlobalStatus('Generating PRD prompt based on Story...');

    vscode.postMessage({
      command: 'generatePrd',
      data: { storyPath: storyFileInput.value, scope }
    });
  });

  // ==========================================
  // Step 3 Logic (TDS)
  // ==========================================
  selectPrdBtn.addEventListener('click', () => {
    currentFileSelectionTarget = 'prd';
    vscode.postMessage({ command: 'selectFiles', data: { multiple: false, filters: { 'Markdown': ['md'] } } });
  });

  generateTdsBtn.addEventListener('click', () => {
    if (!prdFileInput.value) return;
    generateTdsBtn.disabled = true;
    generateTdsBtn.textContent = '⏳ Generating TDS...';
    showGlobalStatus('Generating TDS prompt based on PRD...');

    vscode.postMessage({
      command: 'generateTds',
      data: { prdPath: prdFileInput.value }
    });
  });

  // ==========================================
  // Step 4 Logic (DIG)
  // ==========================================
  selectTdsBtn.addEventListener('click', () => {
    currentFileSelectionTarget = 'tds';
    vscode.postMessage({ command: 'selectFiles', data: { multiple: false, filters: { 'Markdown': ['md'] } } });
  });

  generateDigBtn.addEventListener('click', () => {
    if (!prdFileInput.value || !tdsFileInput.value) return;
    generateDigBtn.disabled = true;
    generateDigBtn.textContent = '⏳ Generating DIG...';
    showGlobalStatus('Generating DIG prompt based on TDS...');

    vscode.postMessage({
      command: 'generateDig',
      data: { prdPath: prdFileInput.value, tdsPath: tdsFileInput.value }
    });
  });

  // ==========================================
  // Step 5 Logic (DEV)
  // ==========================================
  selectDigBtn.addEventListener('click', () => {
    currentFileSelectionTarget = 'dig';
    vscode.postMessage({ command: 'selectFiles', data: { multiple: false, filters: { 'Markdown': ['md'] } } });
  });

  generateDevBtn.addEventListener('click', () => {
    if (!prdFileInput.value || !tdsFileInput.value || !digFileInput.value) return;
    generateDevBtn.disabled = true;
    generateDevBtn.textContent = '⏳ Generating DEV...';
    showGlobalStatus('Generating DEV code prompt based on DIG...');

    vscode.postMessage({
      command: 'generateDev',
      data: { prdPath: prdFileInput.value, tdsPath: tdsFileInput.value, digPath: digFileInput.value }
    });
  });

  // ==========================================
  // Message Handling
  // ==========================================
  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.command) {
      case 'filesSelected':
        const filePaths = msg.data.filePaths;
        if (!filePaths || filePaths.length === 0) return;

        if (currentFileSelectionTarget === 'context') {
          const newFiles = filePaths.filter(f => !attachedFiles.includes(f));
          attachedFiles = [...attachedFiles, ...newFiles];
          renderAttachedFiles();
        } else if (currentFileSelectionTarget === 'story') {
          storyFileInput.value = filePaths[0];
          generatePrdBtn.disabled = false;
        } else if (currentFileSelectionTarget === 'prd') {
          prdFileInput.value = filePaths[0];
          generateTdsBtn.disabled = false;
        } else if (currentFileSelectionTarget === 'tds') {
          tdsFileInput.value = filePaths[0];
          if (prdFileInput.value) generateDigBtn.disabled = false;
        } else if (currentFileSelectionTarget === 'dig') {
          digFileInput.value = filePaths[0];
          if (prdFileInput.value && tdsFileInput.value) generateDevBtn.disabled = false;
        }
        break;

      case 'generationComplete':
        showGlobalStatus(msg.data.message);
        const { step, filePath } = msg.data;

        if (step === 'story') {
          generateStoryBtn.disabled = false;
          generateStoryBtn.textContent = '🚀 Generate Story Prompt';
          storyFileInput.value = filePath;
          generatePrdBtn.disabled = false;
          step2Status.innerText = '✅ Story Generated';
        } else if (step === 'prd') {
          generatePrdBtn.disabled = false;
          generatePrdBtn.textContent = '🚀 Generate PRD Prompt';
          prdFileInput.value = filePath;
          generateTdsBtn.disabled = false;
          step3Status.innerText = '✅ PRD Generated';
        } else if (step === 'tds') {
          generateTdsBtn.disabled = false;
          generateTdsBtn.textContent = '🚀 Generate TDS Prompt';
          tdsFileInput.value = filePath;
          generateDigBtn.disabled = false;
          step4Status.innerText = '✅ TDS Generated';
        } else if (step === 'dig') {
          generateDigBtn.disabled = false;
          generateDigBtn.textContent = '🚀 Generate DIG Prompt';
          digFileInput.value = filePath;
          generateDevBtn.disabled = false;
          step5Status.innerText = '✅ DIG Generated';
        } else if (step === 'dev') {
          generateDevBtn.disabled = false;
          generateDevBtn.textContent = '🚀 Generate DEV Prompt';
        }
        break;

      case 'error':
        showGlobalStatus(`❌ ${msg.data.message}`, true);
        generateStoryBtn.disabled = false;
        generateStoryBtn.textContent = '🚀 Generate Story Prompt';
        generatePrdBtn.disabled = false;
        generatePrdBtn.textContent = '🚀 Generate PRD Prompt';
        generateTdsBtn.disabled = false;
        generateTdsBtn.textContent = '🚀 Generate TDS Prompt';
        generateDigBtn.disabled = false;
        generateDigBtn.textContent = '🚀 Generate DIG Prompt';
        generateDevBtn.disabled = false;
        generateDevBtn.textContent = '🚀 Generate DEV Prompt';
        break;

      default:
        break;
    }
  });
})();


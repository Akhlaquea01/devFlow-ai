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
  const step1Status = document.getElementById('step1-status');
  const step2Status = document.getElementById('step2-status'); // kept for compat

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

  const analyzeWorkspaceBtn = document.getElementById('analyze-workspace-btn');
  const workspaceAnalysisResult = document.getElementById('workspace-analysis-result');
  const resetWorkflowBtn = document.getElementById('reset-workflow-btn');
  const previewContainer = document.getElementById('preview-container');
  const previewContent = document.getElementById('preview-content');
  const viewFullBtn = document.getElementById('view-full-btn');
  const copyPreviewBtn = document.getElementById('copy-preview-btn');

  let attachedFiles = [];
  let currentFileSelectionTarget = null; // 'story', 'prd', 'tds', 'dig', or 'context'
  let currentPreviewStep = null;
  let currentPreviewText = null;

  // ==========================================
  // Global Helpers
  // ==========================================
  function showGlobalStatus(message, isError = false) {
    globalStatus.style.display = 'block';
    globalStatus.innerText = message;
    globalStatus.style.color = isError ? 'var(--vscode-errorForeground)' : 'var(--vscode-notificationsInfoIcon-foreground)';
  }

  function updateStepIndicator(activeStep) {
    const steps = ['story', 'prd', 'tds', 'dig', 'dev'];
    let reached = true;
    steps.forEach(s => {
      const el = document.getElementById('indicator-' + s);
      if (s === activeStep) {
        el.style.color = 'var(--vscode-foreground)';
        el.style.fontWeight = 'bold';
        reached = false;
      } else if (reached) {
        el.style.color = 'var(--vscode-charts-green)';
        el.style.fontWeight = 'bold';
      } else {
        el.style.color = 'var(--vscode-descriptionForeground)';
        el.style.fontWeight = 'normal';
      }
    });
  }

  function showPreview(text, step) {
    currentPreviewStep = step;
    currentPreviewText = text;
    previewContainer.style.display = 'block';
    const lines = text.split('\n');
    previewContent.textContent = lines.slice(0, 30).join('\n') + (lines.length > 30 ? '\n\n... [Truncated]' : '');
  }

  analyzeWorkspaceBtn.addEventListener('click', () => {
    vscode.postMessage({ command: 'analyzeCodebase' });
  });

  resetWorkflowBtn.addEventListener('click', () => {
    vscode.postMessage({ command: 'resetWorkflow' });
  });

  viewFullBtn.addEventListener('click', () => {
    if (currentPreviewStep) {
      vscode.postMessage({ command: 'openPromptFile', data: { fileType: currentPreviewStep } });
    }
  });

  copyPreviewBtn.addEventListener('click', () => {
    if (currentPreviewText) {
      navigator.clipboard.writeText(currentPreviewText).then(() => {
        showGlobalStatus('Copied to clipboard');
      });
    }
  });


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
    attachedFilesList.textContent = '';
    if (attachedFiles.length === 0) {
      return;
    }

    const titleLabel = document.createElement('strong');
    titleLabel.textContent = `Attached (${attachedFiles.length}):`;
    attachedFilesList.appendChild(titleLabel);

    attachedFiles.forEach((file, index) => {
      const fileName = file.split(/[/\\]/).pop();
      const fileRow = document.createElement('div');
      fileRow.style.display = 'flex';
      fileRow.style.justifyContent = 'space-between';
      fileRow.style.alignItems = 'center';
      fileRow.style.padding = '2px 0';

      const fileSpan = document.createElement('span');
      fileSpan.title = file;
      fileSpan.style.overflow = 'hidden';
      fileSpan.style.textOverflow = 'ellipsis';
      fileSpan.style.whiteSpace = 'nowrap';
      fileSpan.textContent = `📄 ${fileName}`;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-file-btn';
      removeBtn.style.background = 'none';
      removeBtn.style.border = 'none';
      removeBtn.style.color = 'var(--vscode-errorForeground)';
      removeBtn.style.cursor = 'pointer';
      removeBtn.style.padding = '0 4px';
      removeBtn.textContent = '❌';
      removeBtn.addEventListener('click', () => {
        attachedFiles.splice(index, 1);
        renderAttachedFiles();
      });

      fileRow.appendChild(fileSpan);
      fileRow.appendChild(removeBtn);
      attachedFilesList.appendChild(fileRow);
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
        const { step, promptContent } = msg.data;

        if (promptContent) {
          showPreview(promptContent, step);
        }

        if (step === 'story') {
          generateStoryBtn.disabled = false;
          generateStoryBtn.textContent = '🚀 Generate Story Prompt';
          step1Status.innerText = '✅ Story Prompt sent to Chat.';
          updateStepIndicator('prd');
          // Auto-populate Step 2 with the saved story file path
          if (msg.data.outputPath) {
            storyFileInput.value = msg.data.outputPath;
            generatePrdBtn.disabled = false;
            step1Status.innerText = `✅ Story Prompt sent to Chat. Step 2 auto-filled.`;
          }
        } else if (step === 'prd') {
          generatePrdBtn.disabled = false;
          generatePrdBtn.textContent = '🚀 Generate PRD Prompt';
          step3Status.innerText = '✅ PRD Prompt sent to Chat.';
          updateStepIndicator('tds');
          // Auto-populate Step 3 with the saved PRD file path
          if (msg.data.outputPath) {
            prdFileInput.value = msg.data.outputPath;
            generateTdsBtn.disabled = false;
            step3Status.innerText = `✅ PRD Prompt sent to Chat. Step 3 auto-filled.`;
          }
        } else if (step === 'tds') {
          generateTdsBtn.disabled = false;
          generateTdsBtn.textContent = '🚀 Generate TDS Prompt';
          step4Status.innerText = '✅ TDS Prompt sent to Chat.';
          updateStepIndicator('dig');
          // Auto-populate Step 4 with the saved TDS file path
          if (msg.data.outputPath) {
            tdsFileInput.value = msg.data.outputPath;
            generateDigBtn.disabled = false;
            step4Status.innerText = `✅ TDS Prompt sent to Chat. Step 4 auto-filled.`;
          }
        } else if (step === 'dig') {
          generateDigBtn.disabled = false;
          generateDigBtn.textContent = '🚀 Generate DIG Prompt';
          step5Status.innerText = '✅ DIG Prompt sent to Chat.';
          updateStepIndicator('dev');
          // Auto-populate Step 5 with the saved DIG file path
          if (msg.data.outputPath) {
            digFileInput.value = msg.data.outputPath;
            generateDevBtn.disabled = false;
            step5Status.innerText = `✅ DIG Prompt sent to Chat. Step 5 auto-filled.`;
          }
        } else if (step === 'dev') {
          generateDevBtn.disabled = false;
          generateDevBtn.textContent = '🚀 Generate DEV Prompt';
          updateStepIndicator('dev');
        }
        break;

      case 'workspaceAnalysisResult':
        workspaceAnalysisResult.style.display = 'block';
        workspaceAnalysisResult.textContent = `Detected Stack:\n${msg.data.result}`;
        break;

      case 'workflowReset':
        requirementInput.value = '';
        imageUrlInput.value = '';
        attachedFiles = [];
        renderAttachedFiles();

        storyFileInput.value = '';
        prdFileInput.value = '';
        tdsFileInput.value = '';
        digFileInput.value = '';

        generatePrdBtn.disabled = true;
        generateTdsBtn.disabled = true;
        generateDigBtn.disabled = true;
        generateDevBtn.disabled = true;

        step1Status.innerText = '';
        step3Status.innerText = '';
        step4Status.innerText = '';
        step5Status.innerText = '';

        globalStatus.style.display = 'none';
        previewContainer.style.display = 'none';
        workspaceAnalysisResult.style.display = 'none';

        updateStepIndicator('story');
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


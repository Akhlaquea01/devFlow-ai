(function () {
  const vscode = acquireVsCodeApi();

  const startBtn = document.getElementById('start-btn');
  const inputSource = document.getElementById('input-source');
  const requirementInput = document.getElementById('requirement-input');
  const progressSection = document.getElementById('progress-section');
  const outputSection = document.getElementById('output-section');
  const progressFill = document.getElementById('progress-fill');
  const stepList = document.getElementById('step-list');
  const outputContent = document.getElementById('output-content');
  const copyBtn = document.getElementById('copy-btn');
  const openBtn = document.getElementById('open-btn');
  const attachFilesBtn = document.getElementById('attach-files-btn');
  const attachedFilesList = document.getElementById('attached-files-list');
  const imageUrlInput = document.getElementById('image-url-input');

  let activeTab = 'prd';
  let attachedFiles = [];

  const WORKFLOW_STEPS = [
    'Parsing Requirement',
    'Analyzing Codebase',
    'Generating PRD Prompt',
    'Generating TDS Prompt',
    'Generating DIG Prompt',
    'Generating DEV Prompt',
    'Ready for Copy/Paste',
  ];

  inputSource.addEventListener('change', () => {
    switch (inputSource.value) {
      case 'jira':
        requirementInput.placeholder = 'Enter Jira Ticket ID or URL...';
        break;
      case 'file':
        requirementInput.placeholder = 'Enter absolute or workspace-relative file path...';
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
    vscode.postMessage({ command: 'selectFiles' });
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

  startBtn.addEventListener('click', () => {
    const requirement = requirementInput.value.trim();
    if (!requirement) {
      if (inputSource.value === 'clipboard') {
        navigator.clipboard.readText().then(text => {
          requirementInput.value = text;
          startWorkflow(text);
        }).catch(err => {
          vscode.postMessage({ command: 'error', data: { message: 'Failed to read clipboard' } });
        });
      } else {
        vscode.postMessage({ command: 'error', data: { message: 'Requirement input is empty' } });
      }
    } else {
      startWorkflow(requirement);
    }
  });

  function startWorkflow(requirement) {
    const scopeRadio = document.querySelector('input[name="scope"]:checked');
    const scope = scopeRadio ? scopeRadio.value : 'fullstack';
    const imageUrls = imageUrlInput.value.trim() ? imageUrlInput.value.split(',').map(url => url.trim()).filter(url => url.length > 0) : [];

    vscode.postMessage({
      command: 'startWorkflow',
      data: {
        source: inputSource.value,
        requirement,
        scope,
        attachedFiles,
        imageUrls
      },
    });

    startBtn.disabled = true;
    startBtn.textContent = '⏳ Generating...';
    progressSection.classList.remove('hidden');
    renderSteps(-1);
  }

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      vscode.postMessage({ command: 'switchTab', data: { tab: activeTab } });
    });
  });

  copyBtn.addEventListener('click', () => {
    vscode.postMessage({ command: 'copyPrompt', data: { fileType: activeTab } });
  });

  openBtn.addEventListener('click', () => {
    vscode.postMessage({ command: 'openPromptFile', data: { fileType: activeTab } });
  });

  function renderSteps(activeIndex) {
    stepList.innerHTML = '';
    WORKFLOW_STEPS.forEach((step, i) => {
      const el = document.createElement('div');
      let cls = 'step-pending';
      if (i < activeIndex) {
        cls = 'step-done';
      }
      if (i === activeIndex) {
        cls = 'step-active';
      }
      el.className = `step-item ${cls}`;
      el.innerHTML = `<span class="step-icon"></span><span>${step}</span>`;
      stepList.appendChild(el);
    });
    const clampedIndex = Math.max(0, activeIndex + 1);
    progressFill.style.width = `${(clampedIndex / WORKFLOW_STEPS.length) * 100}%`;
  }

  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.command) {
      case 'stepUpdate':
        renderSteps(msg.data.stepIndex);
        break;
      case 'workflowComplete':
        startBtn.disabled = false;
        startBtn.textContent = '🚀 Generate Prompts';
        outputSection.classList.remove('hidden');
        outputContent.innerHTML = msg.data.html || '<p>Generation complete. Check tabs above.</p>';
        break;
      case 'tabContent':
        outputContent.innerHTML = msg.data.html;
        break;
      case 'error':
        startBtn.disabled = false;
        startBtn.textContent = '🚀 Generate Prompts';
        outputSection.classList.remove('hidden');
        outputContent.innerHTML = `<p style="color:var(--vscode-errorForeground)">❌ ${msg.data.message}</p>`;
        break;
      case 'filesSelected':
        const newFiles = msg.data.filePaths.filter(f => !attachedFiles.includes(f));
        attachedFiles = [...attachedFiles, ...newFiles];
        renderAttachedFiles();
        break;
      default:
        break;
    }
  });
})();


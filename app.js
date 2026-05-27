/**
 * Dynamic Data Proofreader - Core Engine with Multimodal File Uploads & OCR
 * Implements high-precision sequence alignment, visually similar character analysis,
 * and client-side processing of TXT, CSV, Excel, PDF, and images (OCR via Tesseract.js).
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const templateInput = document.getElementById('templateInput');
  const compareInput = document.getElementById('compareInput');
  const btnLoadDemo = document.getElementById('btnLoadDemo');
  const btnProofread = document.getElementById('btnProofread');
  const btnCopyClean = document.getElementById('btnCopyClean');
  
  const reportPlaceholder = document.getElementById('reportPlaceholder');
  const reportContent = document.getElementById('reportContent');
  
  // Stats Elements
  const statTemplateCount = document.getElementById('statTemplateCount');
  const statCompareCount = document.getElementById('statCompareCount');
  const statMissingCount = document.getElementById('statMissingCount');
  const statDuplicateCount = document.getElementById('statDuplicateCount');
  const statErrorCount = document.getElementById('statErrorCount');
  
  // Report Displays
  const diagnosticTableBody = document.getElementById('diagnosticTableBody');
  const cleanListOutput = document.getElementById('cleanListOutput');
  const toast = document.getElementById('toast');

  // Visually Similar Characters Map for comparison & detailed logs
  const similarPairs = [
    { correct: '0', wrong: 'O', desc: '數字 0 被誤輸入為大寫英文字母 O' },
    { correct: '0', wrong: 'o', desc: '數字 0 被誤輸入為小寫英文字母 o' },
    { correct: '1', wrong: 'I', desc: '數字 1 被誤輸入為大寫英文字母 I' },
    { correct: '1', wrong: 'l', desc: '數字 1 被誤輸入為小寫英文字母 l' },
    { correct: '8', wrong: 'B', desc: '數字 8 被誤輸入為大寫英文字母 B' },
    { correct: '8', wrong: 'b', desc: '數字 8 被誤輸入為小寫英文字母 b' },
    { correct: '2', wrong: 'Z', desc: '數字 2 被誤輸入為大寫英文字母 Z' },
    { correct: '2', wrong: 'z', desc: '數字 2 被誤輸入為小寫英文字母 z' },
    { correct: '5', wrong: 'S', desc: '數字 5 被誤輸入為大寫英文字母 S' },
    { correct: '5', wrong: 's', desc: '數字 5 被誤輸入為小寫英文字母 s' }
  ];

  // 1. TABS SWITCHING LOGIC
  document.querySelectorAll('.tab-control').forEach(control => {
    const side = control.getAttribute('data-for');
    const buttons = control.querySelectorAll('.tab-btn');
    
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const tab = btn.getAttribute('data-tab');
        if (tab === 'manual') {
          document.getElementById(`${side}-manual-pane`).classList.add('active');
          document.getElementById(`${side}-upload-pane`).classList.remove('active');
        } else {
          document.getElementById(`${side}-manual-pane`).classList.remove('active');
          document.getElementById(`${side}-upload-pane`).classList.add('active');
        }
      });
    });
  });

  function switchToManualTab(side) {
    const control = document.querySelector(`.tab-control[data-for="${side}"]`);
    if (!control) return;
    
    const manualBtn = control.querySelector('[data-tab="manual"]');
    const uploadBtn = control.querySelector('[data-tab="upload"]');
    
    manualBtn.classList.add('active');
    uploadBtn.classList.remove('active');
    
    document.getElementById(`${side}-manual-pane`).classList.add('active');
    document.getElementById(`${side}-upload-pane`).classList.remove('active');
  }

  // 2. MULTIMODAL DRAG AND DROP / FILE SELECT LOGIC
  ['template', 'compare'].forEach(side => {
    const dropzone = document.getElementById(`${side}Dropzone`);
    const fileInput = document.getElementById(`${side}FileInput`);
    const overlay = document.getElementById(`${side}ProgressOverlay`);
    const progressBar = document.getElementById(`${side}ProgressBar`);
    const progressMsg = overlay.querySelector('.progress-message');

    // Click to browse
    dropzone.addEventListener('click', (e) => {
      if (!overlay.classList.contains('hidden')) return; // Ignore if currently parsing
      if (e.target === fileInput) return; // Prevent loop
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0], side);
      }
    });

    // Drag events
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!overlay.classList.contains('hidden')) return;
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (!overlay.classList.contains('hidden')) return;

      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0], side);
      }
    });
  });

  // 3. FILE PARSING DISPATCHER
  function handleFile(file, side) {
    const overlay = document.getElementById(`${side}ProgressOverlay`);
    const progressBar = document.getElementById(`${side}ProgressBar`);
    const progressMsg = overlay.querySelector('.progress-message');
    const textarea = document.getElementById(`${side}Input`);

    // Reset progress UI
    overlay.classList.remove('hidden');
    progressBar.style.width = '0%';

    const fileName = file.name.toLowerCase();
    const fileType = file.type;

    // A. TEXT OR CSV FILES
    if (fileType.startsWith('text/') || fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
      progressMsg.textContent = '讀取文字檔案中...';
      progressBar.style.width = '50%';
      
      const reader = new FileReader();
      reader.onload = function(e) {
        progressBar.style.width = '100%';
        textarea.value = e.target.result;
        
        setTimeout(() => {
          switchToManualTab(side);
          overlay.classList.add('hidden');
          showToast(`已載入文字檔案：${file.name}`);
        }, 300);
      };
      reader.onerror = function() {
        alert('檔案讀取失敗！');
        overlay.classList.add('hidden');
      };
      reader.readAsText(file);
    }
    // B. EXCEL FILES
    else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || 
             fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
             fileType === 'application/vnd.ms-excel') {
      
      progressMsg.textContent = '解析 Excel 儲存格中...';
      progressBar.style.width = '40%';

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          if (workbook.SheetNames.length === 0) {
            throw new Error('工作簿中沒有工作表！');
          }
          
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          progressBar.style.width = '75%';
          
          // Convert sheet to plain text (line separated values)
          const txt = XLSX.utils.sheet_to_txt(worksheet);
          const rows = txt.split('\n')
            .map(line => cleanSerialKey(line))
            .filter(line => line.length > 0);
          
          progressBar.style.width = '100%';
          textarea.value = rows.join('\n');
          
          setTimeout(() => {
            switchToManualTab(side);
            overlay.classList.add('hidden');
            showToast(`已載入 Excel 檔案：${file.name}`);
          }, 300);
        } catch (err) {
          console.error(err);
          alert('Excel 解析失敗：' + err.message);
          overlay.classList.add('hidden');
        }
      };
      reader.onerror = function() {
        alert('檔案讀取失敗！');
        overlay.classList.add('hidden');
      };
      reader.readAsArrayBuffer(file);
    }
    // C. PDF SCANS
    else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      progressMsg.textContent = '解析 PDF 文件中...';
      progressBar.style.width = '20%';

      const reader = new FileReader();
      reader.onload = async function(e) {
        try {
          const arrayBuffer = e.target.result;
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          
          loadingTask.promise.then(async (pdf) => {
            let fullText = [];
            
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => item.str.trim()).filter(Boolean).join('\n');
              
              if (pageText) {
                fullText.push(pageText);
              }
              
              const pct = Math.round((pageNum / pdf.numPages) * 100);
              progressBar.style.width = pct + '%';
              progressMsg.textContent = `PDF 讀取中... ${pct}%`;
            }
            
            textarea.value = fullText.join('\n');
            switchToManualTab(side);
            overlay.classList.add('hidden');
            showToast(`已載入 PDF 檔案：${file.name}`);
          }).catch(err => {
            throw err;
          });
        } catch (err) {
          console.error(err);
          alert('PDF 解析失敗，或者是不可讀取文字的掃描 PDF！請直接上傳圖片。');
          overlay.classList.add('hidden');
        }
      };
      reader.onerror = function() {
        alert('檔案讀取失敗！');
        overlay.classList.add('hidden');
      };
      reader.readAsArrayBuffer(file);
    }
    // D. PHOTO / IMAGE (LOCAL OCR via Tesseract.js)
    else if (fileType.startsWith('image/') || fileName.endsWith('.png') || 
             fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      
      progressMsg.textContent = '初始化 OCR 辨識引擎...';
      progressBar.style.width = '10%';

      // Run Tesseract.js client side OCR
      Tesseract.recognize(
        file,
        'eng', // Best for serial numbers and invoices
        { 
          logger: m => {
            if (m.status === 'recognizing text') {
              const pct = Math.round(m.progress * 100);
              progressBar.style.width = pct + '%';
              progressMsg.textContent = `圖片文字 OCR 辨識中... ${pct}%`;
            } else {
              progressMsg.textContent = `OCR 初始化: ${translateOcrStatus(m.status)}`;
            }
          }
        }
      ).then(({ data: { text } }) => {
        // Clean up text
        const cleanedLines = text.split('\n')
          .map(line => cleanSerialKey(line))
          .filter(line => line.length > 0);

        textarea.value = cleanedLines.join('\n');
        
        switchToManualTab(side);
        overlay.classList.add('hidden');
        showToast(`已完成圖片 OCR 辨識！`);
      }).catch(err => {
        console.error(err);
        alert('OCR 辨識失敗！請確保圖片清晰。');
        overlay.classList.add('hidden');
      });
    }
    // E. UNSUPPORTED FORMATS
    else {
      alert('不支援的檔案格式！\n請上傳 TXT, CSV, Excel, PDF 或者是 JPG/PNG 照片。');
      overlay.classList.add('hidden');
    }
  }

  function translateOcrStatus(status) {
    switch (status) {
      case 'loading tesseract core': return '載入 OCR 核心元件...';
      case 'initializing tesseract: eng':
      case 'initializing tesseract': return '載入英文語言包...';
      case 'loading language traineddata': return '載入特徵比對庫...';
      case 'initializing api': return '初始化辨識介面...';
      default: return status;
    }
  }

  // 4. PRESET DEMO DATA LOADING
  btnLoadDemo.addEventListener('click', () => {
    const demoTemplate = [
      'SN-2026-001',
      'SN-2026-002',
      'SN-2026-003',
      'SN-2026-004',
      'SN-2026-005',
      'SN-2026-006',
      'SN-2026-007',
      'SN-2026-008',
      'SN-2026-009',
      'SN-2026-010',
      'SN-2026-011',
      'SN-2026-012'
    ].join('\n');

    const demoCompare = [
      'SN-2026-OO1',  // Visual error (0 -> O)
      'SN-2026-002',  // Correct
      'SN-2026-002',  // Duplicate
      'SN-2026-003',  // Correct
      'SN-2026-004',  // Correct
      'SN-2026-005',  // Correct
      'SN-2026-006',  // Correct
      // SN-2026-007 is missing (Gap / Missing)
      'SN-2026-008',  // Correct (Should automatically align!)
      'SN-2026-009',  // Correct
      'SN-2026-010',  // Correct
      'SN-2026-O10',  // Visual error & duplicate (0 -> O)
      'SN-2026-012'   // Correct
    ].join('\n');

    templateInput.value = demoTemplate;
    compareInput.value = demoCompare;
    
    // Switch to manual tabs to see loaded text
    switchToManualTab('template');
    switchToManualTab('compare');
    
    showToast('已載入示範資料！');
  });

  // 5. PROOFREAD COMMAND
  btnProofread.addEventListener('click', () => {
    const templateText = templateInput.value.trim();
    const compareText = compareInput.value.trim();

    if (!templateText) {
      alert('請輸入原始基準範本（或拖曳檔案上傳）！');
      return;
    }
    if (!compareText) {
      alert('請輸入待核對文件（或拖曳檔案上傳）！');
      return;
    }

    // Process & Align
    const result = runProofreader(templateText, compareText);
    
    // Render Results
    renderReport(result);
  });

  // 6. COPY TO CLIPBOARD
  btnCopyClean.addEventListener('click', () => {
    const text = cleanListOutput.textContent;
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
      showToast('複製成功！已複製修正後的乾淨列表');
    }).catch(err => {
      console.error('無法複製文字: ', err);
    });
  });

  // Helper: Toast Alert
  function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2500);
  }

  // Helper: Clean Serial Keys (remove leading/trailing pipes, brackets, spaces, noise)
  function cleanSerialKey(str) {
    if (!str) return '';
    return str.trim()
      .replace(/^[\s|\[\(\{'".,:;]+/, '')
      .replace(/[\s|\]\)\}'".,:;]+$/, '')
      .trim();
  }

  // Helper: Normalize Visually Confusing Characters
  function normVisual(str) {
    if (!str) return '';
    return str.toUpperCase()
      .replace(/[O]/g, '0')
      .replace(/[IL]/g, '1')
      .replace(/[B]/g, '8')
      .replace(/[Z]/g, '2')
      .replace(/[S]/g, '5');
  }

  // Helper: Levenshtein Distance
  function levenshtein(s1, s2) {
    const m = s1.length;
    const n = s2.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j - 1] + 1, // substitution
            dp[i - 1][j] + 1,     // deletion
            dp[i][j - 1] + 1      // insertion
          );
        }
      }
    }
    return dp[m][n];
  }

  // Analyze Visually Confused Characters
  function checkVisualConfusion(correct, input) {
    if (correct === input) return null;
    if (correct.length !== input.length) return null;
    
    const errors = [];
    for (let k = 0; k < correct.length; k++) {
      const cChar = correct[k];
      const iChar = input[k];
      
      if (cChar !== iChar) {
        // Check if there is a match in our visually similar mapping
        const match = similarPairs.find(p => p.correct === cChar && p.wrong === iChar);
        if (match) {
          errors.push(match.desc);
        } else {
          // Check for reverse confusion
          const reverseMatch = similarPairs.find(p => p.correct === iChar && p.wrong === cChar);
          if (reverseMatch) {
            errors.push(`字母 ${cChar} 被誤輸入為數字 ${iChar}`);
          } else {
            errors.push(`字元 '${iChar}' 應為 '${cChar}'`);
          }
        }
      }
    }
    return errors.length > 0 ? errors.join('；') : null;
  }

  // CORE ENGINE: Dynamic Sequence Alignment
  function runProofreader(templateText, compareText) {
    // 1. Establish Ground Truth
    const templates = templateText.split('\n')
      .map(line => cleanSerialKey(line))
      .filter(line => line.length > 0);
      
    const compares = compareText.split('\n')
      .map(line => cleanSerialKey(line))
      .filter(line => line.length > 0);

    const N = templates.length;
    const M = compares.length;

    // DP Alignment Cost Parameters
    const GAP_PENALTY = 15;   // Cost of a template missing in compares
    const INSERT_PENALTY = 10; // Cost of an extra compare element

    function getSubstitutionCost(tLine, cLine) {
      if (tLine === cLine) return 0;
      
      // Normalized match (only shape errors)
      if (normVisual(tLine) === normVisual(cLine)) {
        return 1.5; // low cost substitution
      }
      
      // Calculate Levenshtein distance
      const dist = levenshtein(tLine, cLine);
      if (dist <= 3) {
        return 3 + dist;
      }
      return 30; // High penalty for completely different strings
    }

    // DP table
    const dp = Array.from({ length: N + 1 }, () => Array(M + 1).fill(0));
    
    for (let i = 0; i <= N; i++) dp[i][0] = i * GAP_PENALTY;
    for (let j = 0; j <= M; j++) dp[0][j] = j * INSERT_PENALTY;

    for (let i = 1; i <= N; i++) {
      for (let j = 1; j <= M; j++) {
        const matchCost = getSubstitutionCost(templates[i - 1], compares[j - 1]);
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + matchCost,       // Match or Substitute
          dp[i - 1][j] + GAP_PENALTY,         // Template missing (Gap)
          dp[i][j - 1] + INSERT_PENALTY       // Extra compare item (Insertion)
        );
      }
    }

    // Traceback to find optimal alignment path
    let i = N;
    let j = M;
    const alignment = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0) {
        const matchCost = getSubstitutionCost(templates[i - 1], compares[j - 1]);
        const currentScore = dp[i][j];
        
        if (currentScore === dp[i - 1][j - 1] + matchCost) {
          alignment.push({
            type: templates[i - 1] === compares[j - 1] ? 'MATCH' : 'SUBSTITUTE',
            templateVal: templates[i - 1],
            templateIdx: i - 1,
            compareVal: compares[j - 1],
            compareIdx: j - 1
          });
          i--;
          j--;
          continue;
        }
      }
      
      if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + GAP_PENALTY)) {
        alignment.push({
          type: 'MISSING',
          templateVal: templates[i - 1],
          templateIdx: i - 1,
          compareVal: '[無內容]',
          compareIdx: null
        });
        i--;
      } else if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1] + INSERT_PENALTY)) {
        alignment.push({
          type: 'INSERTION',
          templateVal: '[無對應範本]',
          templateIdx: null,
          compareVal: compares[j - 1],
          compareIdx: j - 1
        });
        j--;
      }
    }

    alignment.reverse();

    // 2. Post-processing: Duplicate Monitoring & Deep Character Check
    const finalReport = [];
    const seenTemplates = new Map(); // templateVal -> count of matches

    // Track matching templates first to identify duplicates accurately
    alignment.forEach(item => {
      if (item.templateVal !== '[無對應範本]' && item.type !== 'MISSING') {
        const normT = normVisual(item.templateVal);
        seenTemplates.set(normT, (seenTemplates.get(normT) || 0) + 1);
      }
    });

    // Secondary alignment pass to build detailed records
    const trackedCompareIndices = new Set();
    let gapCount = 0;
    let dupCount = 0;
    let errorCount = 0;

    alignment.forEach((item, index) => {
      const record = {
        groupLabel: '',
        templateVal: item.templateVal,
        compareVal: item.compareVal,
        status: 'FINE', // FINE, MISSING, DUPLICATE, ERROR
        description: ''
      };

      if (item.templateIdx !== null) {
        const numStr = String(item.templateIdx + 1).padStart(2, '0');
        record.groupLabel = `第 ${numStr} 組`;
      } else {
        record.groupLabel = `額外項`;
      }

      if (item.type === 'MISSING') {
        record.status = 'MISSING';
        record.description = '【缺漏】文件遺漏此組編號，已自動對齊後續資料';
        gapCount++;
      } 
      else if (item.type === 'INSERTION') {
        const normC = normVisual(item.compareVal);
        const correspondingT = templates.find(t => normVisual(t) === normC);
        
        if (correspondingT) {
          record.status = 'DUPLICATE';
          record.templateVal = correspondingT;
          
          if (correspondingT !== item.compareVal) {
            const visErrDesc = checkVisualConfusion(correspondingT, item.compareVal);
            record.description = `【重複與字元錯誤】重複輸入此組編號，且包含字元錯誤：${visErrDesc || '拼寫不同'}`;
            errorCount++;
          } else {
            record.description = '【重複項】同一組編號重複出現於文件中';
          }
          dupCount++;
        } else {
          record.status = 'ERROR';
          record.description = '【格式錯誤】待核對內容無法對齊任何基準範本';
          errorCount++;
        }
      } 
      else if (item.type === 'SUBSTITUTE') {
        const normT = normVisual(item.templateVal);
        const normC = normVisual(item.compareVal);
        const isDuplicate = seenTemplates.get(normT) > 1 && trackedCompareIndices.has(normT);
        
        if (normT === normC) {
          record.status = isDuplicate ? 'DUPLICATE' : 'ERROR';
          const visualDesc = checkVisualConfusion(item.templateVal, item.compareVal) || '字元形似錯誤';
          
          if (isDuplicate) {
            record.description = `【重複與字元錯誤】重複出現且字元錯誤：${visualDesc}`;
            dupCount++;
          } else {
            record.description = `【字元錯誤】${visualDesc}`;
          }
          errorCount++;
        } else {
          record.status = 'ERROR';
          const visualDesc = checkVisualConfusion(item.templateVal, item.compareVal);
          record.description = visualDesc 
            ? `【字元錯誤】${visualDesc}`
            : `【拼寫錯誤】輸入內容與範本存在多處字元不吻合`;
          errorCount++;
        }
        
        trackedCompareIndices.add(normT);
      } 
      else if (item.type === 'MATCH') {
        const normT = normVisual(item.templateVal);
        if (trackedCompareIndices.has(normT)) {
          record.status = 'DUPLICATE';
          record.description = '【重複項】同一組編號重複出現於文件中';
          dupCount++;
        } else {
          record.status = 'FINE';
          record.description = '校對無誤';
        }
        trackedCompareIndices.add(normT);
      }

      finalReport.push(record);
    });

    const cleanList = [...templates];

    return {
      templateCount: N,
      compareCount: M,
      missingCount: gapCount,
      duplicateCount: dupCount,
      errorCount: errorCount,
      diagnostics: finalReport,
      cleanList: cleanList
    };
  }

  // RENDER REPORT TO DOM
  function renderReport(result) {
    reportPlaceholder.classList.add('hidden');
    reportContent.classList.remove('hidden');

    statTemplateCount.textContent = result.templateCount;
    statCompareCount.textContent = result.compareCount;
    statMissingCount.textContent = result.missingCount;
    statDuplicateCount.textContent = result.duplicateCount;
    statErrorCount.textContent = result.errorCount;

    diagnosticTableBody.innerHTML = '';
    
    result.diagnostics.forEach(item => {
      const tr = document.createElement('tr');
      
      if (item.status === 'MISSING') {
        tr.className = 'row-missing';
      } else if (item.status === 'DUPLICATE') {
        tr.className = 'row-duplicate';
      } else if (item.status === 'ERROR') {
        tr.className = 'row-error-char';
      } else {
        tr.className = 'row-fine';
      }

      const tdGroup = document.createElement('td');
      tdGroup.textContent = item.groupLabel;
      tdGroup.className = 'mono-text';

      const tdTemplate = document.createElement('td');
      tdTemplate.textContent = item.templateVal;
      tdTemplate.className = 'mono-text';

      const tdInput = document.createElement('td');
      tdInput.textContent = item.compareVal;
      tdInput.className = 'mono-text';

      const tdDesc = document.createElement('td');
      
      let badgeHTML = '';
      if (item.status === 'MISSING') {
        badgeHTML = `<span class="status-badge badge-danger">缺漏</span> `;
      } else if (item.status === 'DUPLICATE') {
        badgeHTML = `<span class="status-badge badge-warning">重複</span> `;
      } else if (item.status === 'ERROR') {
        badgeHTML = `<span class="status-badge badge-warning">錯誤</span> `;
      } else {
        badgeHTML = `<span class="status-badge badge-success">正常</span> `;
      }

      tdDesc.innerHTML = `${badgeHTML}<span>${item.description}</span>`;

      tr.appendChild(tdGroup);
      tr.appendChild(tdTemplate);
      tr.appendChild(tdInput);
      tr.appendChild(tdDesc);
      
      diagnosticTableBody.appendChild(tr);
    });

    cleanListOutput.textContent = result.cleanList.join('\n');
    
    if (window.innerWidth <= 1024) {
      reportContent.scrollIntoView({ behavior: 'smooth' });
    }
  }
});

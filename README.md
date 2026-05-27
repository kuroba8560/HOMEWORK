# 🎯 動態資料校對專家 (Dynamic Data Proofreader)

本專案是一個兼具**個人工作流程 Skill 定義**與**實體互動成果 Web App** 的完整作品。
旨在解決在大規模資料登錄、條碼掃描、序號輸入等場景中，人工極易出錯的**跳號漏字**、**重複輸入**及**形似字元混淆**等問題。

---

## 📂 專案結構 (Repository Structure)

- 📝 [skill.md](file:///C:/Users/User/.gemini/antigravity/scratch/dynamic-data-proofreader/skill.md) - **第一部分：個人工作流程 Skill 定義**。詳細規範了如何建立動態基準 (Ground Truth)、序列自動對齊、形似字比對及標準報告輸出的核心思維。
- 🖥️ [index.html](file:///C:/Users/User/.gemini/antigravity/scratch/dynamic-data-proofreader/index.html) - **第二部分：成果作品網頁**。提供精美、直觀且反應快速的極客風 (Dark Tech Mode) 使用者介面。
- 🎨 [index.css](file:///C:/Users/User/.gemini/antigravity/scratch/dynamic-data-proofreader/index.css) - 高質感暗色科技風格與毛玻璃 (Glassmorphism) 微互動樣式表。
- ⚙️ [app.js](file:///C:/Users/User/.gemini/antigravity/scratch/dynamic-data-proofreader/app.js) - 核心 JavaScript 處理引擎。在瀏覽器前端實現**動態規劃（Needleman-Wunsch 變體）序列對齊演算法**與字元級交叉校對。

---

## ✨ 作品核心特色 (Key Features)

1. **動態基準建立 (Zero-Hardcoding)**：自動分析範本序號的結構規律（字首字尾、長度、數字分布），無須手寫寫死正則表達式。
2. **序列自動對齊與跳號偵測**：採用先進的序列對齊（Sequence Alignment）演算法。當文件中缺少中間某一項（例如有 24、26，但缺少 25）時，能完美判斷 25 為「缺漏」，並**自動將後續資料對齊**，絕不會引發連鎖錯位誤判。
3. **極精密字元級校驗**：加強形似字（`0` 與 `O`、`1` 與 `I`、`8` 與 `B`、`2` 與 `Z`、`5` 與 `S`）交叉比對，並產出易讀的中文錯誤描述。
4. **一鍵載入示範範例**：網頁內建了精心設計的「測試用錯誤資料」，點擊即可瞬間體驗校對、對齊與修復效果。
5. **高質感視覺介面**：
   - 全響應式（Responsive）毛玻璃卡片式排版。
   - 動態漸層背景與滑鼠懸停微動畫。
   - 包含錯誤標註表格與一鍵複製修正後資料之乾淨列表。

---

## 🚀 如何運行與體驗 (How to Run)

1. **複製/下載本專案**至您的本機電腦。
2. 直接在瀏覽器中雙擊打開 [index.html](file:///C:/Users/User/.gemini/antigravity/scratch/dynamic-data-proofreader/index.html)。
3. 在左側「原始範本（基準）」與「待核對文件」中輸入資料，或**點擊「載入示範範例」按鈕**。
4. 點擊「開始校對」，右側便會立即渲染出精美的視覺化校對報告！

---

## 💡 實用技術細節 (Tech Stack)
- **前端邏輯**：Vanilla JS (無外部依賴，保障敏感序列資料的百分之百安全與隱私)。
- **樣式視覺**：Vanilla CSS3 + Custom Variables (支援極致暗黑科技風格)。
- **核心對齊**：基於 Levenshtein 距離與 LCS 概念的最佳化序列對齊演算法，搭配自定義字元權重，精確還原輸入者的原始意圖。

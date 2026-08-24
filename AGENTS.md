# 聖輪宗網站 — 工作區規範（AGENTS.md）

本檔案定義聖輪宗網站專案的開發規範與工作流程。當 Hermes 在此目錄啟動時自動載入。

---

## 專案定位

**聖輪宗 (SriCakra)** 是佛教修持團體的官方網站，提供：
- 法會資訊與報名
- 皈依會員專區
- 儀軌典藏庫（限定會員存取）
- 修行資源分享

---

## 核心開發原則

### 1. 先備份，再修改
修改任何檔案前，確認有備份版本：
- HTML 備份: `member.html.bak`, `member.html.bak2`
- JS 備份: `auth.js.bak`
- 完整備份: `website - 複製/` 目錄

### 2. 嚴格遵循技術規範
- 使用 Firebase popup 登入（禁止 redirect）
- top-menu.js 不加 defer
- 所有 script 同步載入
- DOMContentLoaded 內處理 auth 狀態

### 3. 文案不亂改
使用者提供的文案保持原樣，最多加標題結構化。

### 4. 本地確認後再上傳
使用者必須先本地雙擊 HTML 確認，說「可以上傳」後才執行 GitHub 上傳。

---

## 檔案職責分工

| 檔案 | 職責 | 修改規範 |
|------|------|----------|
| `js/auth.js` | Firebase Auth 邏輯 | 全域函數掛到 `window.firebaseAuth` |
| `js/top-menu.js` | 靜態導航渲染 | 純 HTML，不含 auth 邏輯 |
| `js/footer.js` | Footer 共用元件 | 各頁面自動載入 |
| `css/style.css` | 全站樣式 | 新增 class 需註明用途 |
| `member.html` | 皈依報名/會員專區 | 需保留表單結構 |
| 其他 HTML | 各內容頁面 | 遵循 SKILL.md 模板 |

---

## 儀軌典藏庫規範（發展中）

### 目標
將近千種佛教儀軌數位化，限定皈依會員讀取，支援分類與關鍵字查詢。

### 資料來源
- 原始資料: `D:\888\Obsidian Vault\電子書\宗教\佛\儀軌_課誦_禮讚_祈請文`
- 總檔案數: 3,188
- 格式: PDF（60%）、Markdown（21%）、HTML（6%）、Word（6%）、文字（3%）

### 處理策略（待確認）
1. **文字型 PDF**: 直接提取文字
2. **掃描型 PDF**: OCR 處理（需 Tesseract）
3. **Markdown**: 轉換為網站格式
4. **分類體系**: 需另外建立 MD 文件

### 權限控制
- 儀軌典藏僅限皈依會員讀取
- 使用 Firebase Auth + GAS API 驗證
- 前端檢查 `hasMemberData()` 決定是否顯示

---

## 快速參考

### 本地測試
```bash
# 啟動本地伺服器
cd C:\Users\yebi\Desktop\聖輪宗網站
python start-server.bat
# 訪問 http://127.0.0.1:8085
```

### 上傳 GitHub
修改後立即執行上傳，不需等待提醒。

### 關鍵路徑
- 網站目錄: `C:\Users\yebi\Desktop\聖輪宗網站\website\`
- GitHub Token: `C:\Users\yebi\Desktop\聖輪宗網站\github-token.txt`
- Apps Script: 見 `gas_code_gemini.gs`

---

## 注意事項

1. **不要**在 top-menu.js 中加入 auth 邏輯
2. **不要**使用 `signInWithRedirect`
3. **不要**在 HTML 中使用 `\$` 轉義 template literal
4. **不要**自行上傳 GitHub，需等用戶確認
5. **不要**忽略本地測試步驟

---

*建立時間：2026-08-24*  
*基於 shenglunzong-auth.md 與 SKILL.md 重建*

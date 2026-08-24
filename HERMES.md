# 聖輪宗網站 — Hermes 專案規範

本文檔定義聖輪宗網站專案的工作規範、技術標準和開發流程。

---

## 專案概述

### 網站資訊
- **專案名稱**: 聖輪宗 (SriCakra) 官方網站
- **主要網址**: https://srichakra.spiritstar.org/
- **GitHub Repo**: omahhum/spiritstar
- **Branch**: master
- **部署方式**: GitHub Pages 靜態站點

### 技術棧
- **前端**: 純靜態 HTML/CSS/JavaScript
- **認證**: Firebase Auth（Google Gmail 登入）
- **後端**: Google Apps Script + Google Sheets
- **風格指南**: 遵循現有 CSS class（見 SKILL.md）

---

## 檔案結構

```
C:\Users\yebi\Desktop\聖輪宗網站\
├── website/                    # 網站根目錄（GitHub Pages 根）
│   ├── index.html             # 首頁
│   ├── about.html             # 關於聖輪宗
│   ├── gospel.html            # 聖輪福音
│   ├── methods.html           # 修行法門
│   ├── member.html            # 皈依報名/會員專區
│   ├── contact.html           # 聯絡我們
│   ├── refuge.html            # 皈依專區
│   ├── css/
│   │   └── style.css          # 主要樣式表
│   └── js/
│       ├── auth.js            # Firebase Auth 邏輯
│       ├── top-menu.js        # 共用導航（無 auth 邏輯）
│       └── footer.js          # Footer 共用元件
│
├── website - 複製/             # 備份（非必要）
├── graphify-out/              # Graphviz 輸出
├── SKILL.md                   # 內容新增工作流
├── TODO_IN_PROGRESS.md        # 進行中任務
├── plan-auth-layer.md         # 認證層計畫
├── github-token.txt           # GitHub Token（上傳用）
├── gas_code_gemini.gs         # Apps Script 原始碼
└── .opencode/                 # OpenCode 配置
```

---

## 技術規範

### 1. Firebase Auth 規範（重要！）

**使用彈出視窗登入**：
```javascript
// ✅ 正確：使用 popup（避免 redirect 問題）
auth.signInWithPopup(googleProvider).catch(err => {
  alert('登入失敗：' + err.message);
});
```

**嚴禁使用**：
```javascript
// ❌ 禁止：signInWithRedirect 會導致狀態遺失
auth.signInWithRedirect(googleProvider);
```

**Script 載入順序**（關鍵！）：
```html
<!-- 1. auth.js 同步載入（不加 defer） -->
<script src="js/auth.js"></script>

<!-- 2. top-menu.js 同步載入（不加 defer） -->
<script src="js/top-menu.js"></script>

<!-- 3. DOMContentLoaded 處理 auth 狀態 -->
<script>
document.addEventListener('DOMContentLoaded', () => {
  // 強制 Firebase 重新通知 auth 狀態
  firebaseAuth.getRedirectResult().catch(() => {});
  
  firebaseAuth.onAuthStateChanged(user => {
    // 更新 nav、loginGate 等 UI
  });
});
</script>
```

### 2. top-menu.js 規範

- **純靜態導航**，不含任何 auth 邏輯
- 所有 HTML 共用一支 `top-menu.js`
- HTML 只留 `<nav id="top-nav"></nav>`
- Nav items 由 `NAV_ITEMS` 陣列定義

### 3. Apps Script 規範

- **接收資料**: URL-encoded (`URLSearchParams`)，非 JSON
- **欄位對應**: 見 `shenglunzong-auth.md`
- **部署後需重新部署新版本**才能生效
- **CORS**: GAS Web App 自動處理，不需要手動加 headers

### 4. 配色系統

| 角色 | 色碼 | 用途 |
|------|------|------|
| 深夜藍 | `#0F172A` | 背景主色 |
| 古金 | `#D4AF37` | 標題、CTA 按鈕 |
| 象牙白 | `#F8F5EE` | 文字、淺色卡片 |
| 藏紅 | `#7A1F2B` | 法會標籤、重要按鈕 |

### 5. 字體系統

- 中文一般: `'Noto Sans TC', sans-serif`
- 中文標題: `'Noto Serif TC', serif`

---

## 開發流程

### 新增頁面內容

參見 `SKILL.md`，標準流程：
1. 使用者提供文案
2. Agent 生成 HTML（遵循模板）
3. 更新 `top-menu.js` 導航
4. 本地確認（雙擊 HTML）
5. 使用者說「可以上傳」後才上傳 GitHub

### 上傳到 GitHub

使用 Python `requests` 庫（勿用 urllib）：
```python
import requests, base64, os

with open("github-token.txt", "rb") as f:
    raw = f.read()
lines = raw.decode("utf-8").split("\r\n")
ghp = [l for l in lines if l.startswith("ghp_")][0].strip()

REPO = "omahhum/spiritstar"
BRANCH = "master"
API = f"https://api.github.com/repos/{REPO}/contents"

s = requests.Session()
s.headers.update({"Accept": "application/vnd.github.v3+json", 
                  "Authorization": f"token {ghp}"})
```

每次修改後立即上傳，不需等用戶提醒。

---

## 常見錯誤

| 錯誤 | 原因 | 解法 |
|------|------|------|
| `auth/unauthorized-domain` | 網域未在 Firebase 授權 | Console → Authentication → Settings → 加入 `srichakra.spiritstar.org` |
| 登入後仍顯示「請先登入」 | 未呼叫 `getRedirectResult()` | 在 DOMContentLoaded 內第一行執行此呼叫 |
| nav 不顯示登入者名稱 | `top-menu.js` 加了 `defer` | 移除 defer 屬性 |
| GAS POST 回 401 | 部署存取權限錯誤 | 重新部署 → 「任何人」可存取 |
| CORS 錯誤 | 使用 JSON body | 改用 `URLSearchParams` |
| 選單顯示 `${displayName}` | template literal 寫成 `\\${}` | 修正為 `${}` |

---

## 相關文件

- `SKILL.md` — 內容新增工作流
- `shenglunzong-auth.md` — 已驗證的程式碼參考
- `srichakra-project.md` — 專案詳細資訊
- `plan-auth-layer.md` — 認證層實現計畫

---

*建立時間：2026-08-24*  
*最後更新：根據 shenglunzong-auth.md 重建*

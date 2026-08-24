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

## 上傳 GitHub 的絕對死規定

**🚨 只能上傳 `website/` 目錄裡的檔案，其他任何檔案都不得上傳到 GitHub。**

修改 `website/` 下的任何 `.html`、`.js`、`.css` 檔案後，**必須立即執行上傳到 GitHub**，不需要等用戶提醒。

### 上傳方式（使用 `requests` 庫）

使用 Python `requests` 庫（`urllib` 的 PUT 有編碼問題，勿用）：

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
s.headers.update({"Accept": "application/vnd.github.v3+json", "Authorization": f"token {ghp}"})

# 每次修改後只上傳有變動的檔案
for f in ["js/top-menu.js", "index.html", "member.html", "about.html",
          "contact.html", "gospel.html", "methods.html", "refuge.html",
          "js/auth.js", "css/style.css"]:
    local_path = os.path.join("website", f)
    if not os.path.exists(local_path):
        continue
    with open(local_path, "rb") as fh:
        content = base64.b64encode(fh.read()).decode()
    r = s.get(f"{API}/{f}", params={"ref": BRANCH})
    sha = r.json()["sha"]
    data = {"message": f"update: {f}", "content": content, "branch": BRANCH, "sha": sha}
    r2 = s.put(f"{API}/{f}", json=data)
    print(f"✓ {f}" if r2.status_code == 200 else f"✗ {f}: {r2.status_code}")
```

### 觸發時機

每次使用 `patch`、`write_file` 或任何工具修改了 `website/` 下的程式碼，就立刻執行上傳。**主動執行，不詢問**。

### 禁止上傳的檔案

**嚴禁上傳以下檔案到 GitHub：**
- `AGENTS.md`、`HERMES.md`、`SKILL.md`
- `github-token.txt`、`gas_code_gemini.gs`
- `plan.md`、`config.yaml`、`計劃.md`、`儀軌*.md`
- `.opencode/`、`.git/`、`website - 複製/`
- 任何其他非 `website/` 目錄下的檔案

**上傳時務必檢查路徑，確保只上傳 `website/` 下的檔案。**

### GitHub Repo 資訊

- Repo: `omahhum/spiritstar`
- Branch: `master`
- 發布位置: https://srichakra.spiritstar.org/（GitHub Pages）
- 本地 website\ 即是Github 的根目錄

### 網站技術棧

- Firebase Auth（Gmail 登入）+ Apps Script + Google Sheets
- 成員皈依報名：member.html → POST to Apps Script URL → 寫入 Sheet
- 共用導航：js/top-menu.js（所有 HTML 共用，nav 預留 `id="navLinks"`）
- 配色：深夜藍 #0F172A / 古金 #D4AF37 / 象牙白 #F8F5EE / 藏紅 #7A1F2B

### top-menu.js 的 auth 規範（2026-06-12 更新）

`top-menu.js` 純靜態導航，**不含任何 auth 邏輯**。Auth nav item（登入/會員名稱/登出）由各 HTML 的 inline script 在 `DOMContentLoaded` 中追加至 `id="navLinks"` 的 `<ul>` 內。

`top-menu.js` 的 script 標籤在 HTML 中**不加 `defer`**，確保在 Firebase session restore 觸發 `onAuthStateChanged` 之前，nav 已經渲染完畢，listener 才不會 miss 第一次 fire。

### Firebase Auth 登入規範（2026-06-12 新增）

**嚴禁在此專案中使用 `signInWithRedirect` 進行登入！後續任何 AI Agent 修改此專案時，務必遵守以下規範：**

1. **必須使用彈出視窗登入 (`signInWithPopup`)**：
   - **原因**：由於現代瀏覽器（Chrome, Safari, Brave 等）加強了第三方 Cookie 與跨網域儲存分割 (Storage Partitioning) 的隱私保護限制，若使用 `signInWithRedirect`，登入跳轉回來後，Firebase 往往無法讀取並還原登入狀態，導致使用者陷入「無限登入卻仍顯示未登入」的狀態。
   - **解決方案**：一律使用 `auth.signInWithPopup(googleProvider)`。

2. **必須保留並強化錯誤提示 (Error Handling)**：
   - 呼叫 `signInWithPopup` 時必須附加 `.catch()` 區塊。
   - 若登入失敗，必須使用 `alert()` 或 UI 顯眼元件告知使用者詳細錯誤訊息。
   - **重要提示**：如果錯誤訊息為 `auth/unauthorized-domain`，應在錯誤訊息中明確提示管理員必須至 Firebase Console 將當前網域（如 `srichakra.spiritstar.org`）加入「授權網域 (Authorized domains)」中。

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

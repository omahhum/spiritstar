# Graph Report - website  (2026-07-04)

**上次更新**: 2026-07-04  
**最新功能**: ✅ [修改皈依資料] 功能已完成

## 功能更新日誌

### 2026-07-04 — 修改皈依資料功能上線

**問題**: Firebase 登入後無法載入已皈依會員資料，畫面一片空白。

**根本原因**:
1. GAS 程式碼錯誤：`Utilities.newString()` 不存在（應為 `Utilities.newBlob().getDataAsString()`）
2. GAS 程式碼錯誤：`ContentService.addHeader()` 不存在（GAS 自動處理 CORS）
3. 前端邏輯缺陷：已皈依時只显示 Banner，表單維持隱藏，需手動點擊按鈕才顯示

**解決方案**:
1. 修正 GAS Token 解碼：改用 `Utilities.newBlob(decodedBytes).getDataAsString()`
2. 移除 GAS 手動 CORS headers，依賴 GAS 自動處理
3. 重構前端 `checkRefugeeAndRender()`：已皈依且讀取成功時，自動調用 `showEditForm()` 顯示並填入表單
4. 加入 `_token_log` 工作表日誌，記錄每次 Token 驗證結果

**檔案修改**:
- `gas_code_gemini.gs`: Token 驗證邏輯、日誌功能
- `website/member.html`: `checkRefugeeAndRender()` 重構
- `website/js/auth.js`: 移除 `mode: 'cors'` 和 `headers`，加入 console.log 除錯

**技術棧**:
- Firebase Auth (Gmail 登入)
- Google Apps Script (後端 API)
- Google Sheets (資料儲存)
- GitHub Pages (靜態託管)

---

## Corpus Check
- 3 files · ~4,618 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 18 nodes · 20 edges · 4 communities (3 shown, 1 thin omitted)
- Extraction: 50% EXTRACTED · 50% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_auth.js|auth.js]]
- [[_COMMUNITY_getFirebaseToken|getFirebaseToken]]
- [[_COMMUNITY_top-menu.js|top-menu.js]]

## God Nodes (most connected - your core abstractions)
1. `getFirebaseToken()` - 5 edges
2. `saveMemberData()` - 2 edges
3. `updateMemberData()` - 2 edges
4. `getMemberData()` - 2 edges
5. `getMemberDataLocal()` - 2 edges
6. `hasMemberData()` - 2 edges
7. `checkRefugeeStatus()` - 2 edges
8. `auth` - 1 edges
9. `googleProvider` - 1 edges
10. `NAV_ITEMS` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (4 total, 1 thin omitted)

### Community 0 - "auth.js"
Cohesion: 0.25
Nodes (4): auth, getMemberDataLocal(), googleProvider, hasMemberData()

### Community 1 - "getFirebaseToken"
Cohesion: 0.40
Nodes (5): checkRefugeeStatus(), getFirebaseToken(), getMemberData(), saveMemberData(), updateMemberData()

## Knowledge Gaps
- **3 isolated node(s):** `auth`, `googleProvider`, `NAV_ITEMS`
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getFirebaseToken()` connect `getFirebaseToken` to `auth.js`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `auth`, `googleProvider`, `NAV_ITEMS` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
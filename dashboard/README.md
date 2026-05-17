# Portfolio Dashboard — Deployment Guide

**URL 结构**: `https://daihuizhu.github.io/dashboard/`

---

## 文件结构

```
你的 github.io repo/
└── dashboard/
    └── index.html    ← 上传这个
    
Cloudflare Workers/
└── worker.js         ← 单独部署
```

---

## Step 1 — 部署 Cloudflare Worker

### 1.1 注册 Cloudflare（免费）
去 [cloudflare.com](https://cloudflare.com) 注册，免费账号每天 100,000 次请求。

### 1.2 创建 Worker
1. Dashboard → Workers & Pages → Create Worker
2. 点击 **Edit Code**，把 `worker.js` 全部内容粘贴进去
3. 点击 **Save and Deploy**
4. 记录你的 Worker URL，格式：`https://xxxxx.workers.dev`

### 1.3 设置环境变量（重要！）
在 Worker 页面 → Settings → Variables → Add variable:

| Variable Name    | Value               |
|-----------------|---------------------|
| `OPENAI_API_KEY` | `sk-...你的key`      |
| `ALLOWED_ORIGIN_ENV` | `https://daihuizhu.github.io` |

⚠️ API key 放在环境变量里，不会暴露在前端代码中。

---

## Step 2 — 配置 index.html

打开 `index.html`，找到顶部 `const CFG = {` 部分，修改以下字段：

```javascript
const CFG = {
  password:      "your-secure-password",   // 你的访问密码

  workerURL:     "https://xxxxx.workers.dev",  // Step 1 拿到的 Worker URL

  sheetID:       "1BxiMVs0XRA...",        // Google Sheet ID
  // URL: docs.google.com/spreadsheets/d/[这段]/edit

  sheetName:     "Daily Log",              // Sheet 标签名

  initialCapital: 70000,                   // 初始本金 SEK

  watchlist: ["PLTR", "VST", "AAPL", "TEM", "MEG"],

  holdings: [
    { ticker: "PLTR", name: "Palantir",    qty: 100, entry: 22.00, target: 35.00, stop: 18.00 },
    { ticker: "VST",  name: "Vistra Corp", qty: 50,  entry: 80.00, target: 120.00, stop: 70.00 },
    { ticker: "AAPL", name: "Apple",       qty: 20,  entry: 175.00, target: 210.00, stop: 160.00 },
    // 继续添加...
  ],

  goals: [
    { label: "年度目标", target: 150000, currency: "SEK" },
    { label: "Q2 目标",  target: 110000, currency: "SEK" },
  ],
};
```

---

## Step 3 — 上传到 GitHub

### 3.1 在你的 github.io repo 创建 dashboard 文件夹
```bash
# 如果你用 git：
mkdir dashboard
cp index.html dashboard/
git add dashboard/
git commit -m "Add portfolio dashboard"
git push
```

或者直接在 GitHub 网页操作：
1. 打开你的 `daihuizhu.github.io` repo
2. Add file → Create new file
3. 文件名输入：`dashboard/index.html`（会自动创建文件夹）
4. 粘贴 `index.html` 内容 → Commit

### 3.2 访问
等 1-2 分钟后访问：
```
https://daihuizhu.github.io/dashboard/
```

---

## Step 4 — Google Sheets 设置

你的 Daily Log sheet 需要设为公开可读：
1. Google Sheets → Share → Change → Anyone with the link → **Viewer**
2. 复制 Sheet ID 填入 CFG

Sheet 格式：

| A (日期)    | B (净值 SEK) |
|------------|-------------|
| 2026-05-13 | 70000       |
| 2026-05-14 | 81383       |
| 2026-05-15 | 102345      |

---

## 功能说明

| 功能 | 数据来源 | 刷新 |
|------|---------|------|
| P&L Chart | Google Sheets | 手动/每次打开 |
| Holdings + Signals | Yahoo Finance via Worker | 手动刷新 |
| Macro (Gold/Oil/VIX/FX) | Yahoo Finance via Worker | **每5分钟自动** |
| Options Max Pain | Yahoo Finance via Worker | 手动选 ticker |
| ETP / MINI Future | Avanza via Worker | 手动搜索 |
| News Feed | Yahoo Finance RSS via Worker | 手动刷新 |
| Trade Plan | LocalStorage (浏览器本地) | 实时 |
| AI Analysis | OpenAI GPT-4o via Worker | **手动点击生成** |
| AI Review | OpenAI GPT-4o via Worker | **手动点击生成** |
| Financial Goals | 读取当前 NAV 自动计算 | 每次加载 |

---

## CORS 问题排查

如果 Worker 请求失败，检查：
1. Worker URL 是否正确填入 `CFG.workerURL`
2. Cloudflare Worker 里 `ALLOWED_ORIGIN_ENV` 是否设为你的 GitHub Pages URL
3. Worker 是否正常部署（访问 `https://你的worker.workers.dev/macro` 看是否返回 JSON）

---

## MEG 说明

MEG (Montauk Renewables) 在 Yahoo Finance 上可能 ticker 是 `MNTK`，如果搜索没结果，
在 CFG.watchlist 里把 "MEG" 改成 "MNTK"。

---

## 安全说明

- 密码存在 `sessionStorage`，关闭浏览器自动锁
- OpenAI key 只存在 Cloudflare 环境变量，不出现在任何前端代码
- Google Sheets 只需要 Viewer 权限，读取公开 JSON API
- 如需更强密码保护，用 SHA-256 hash 替代明文密码（见 index.html 注释）

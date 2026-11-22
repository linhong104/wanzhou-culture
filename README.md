# 万州烤鱼文化网站 · GitHub Pages 版

完整的中、英、日三语文化展示网站，包含 7 个页面、首页循环视频和鱼形向导「万滋」。

## 发布

1. 使用 GitHub 账号 `linhong104` [新建一个仓库](https://github.com/new)，设为 Public（公开），建议命名为 `wanzhou-culture`。
2. 上传这个目录**里面的文件和 assets 文件夹**到仓库根目录；确保首页 `index.html` 直接位于根目录。不要上传 ZIP 本身，不要再套一层 github-pages 文件夹。
3. 打开仓库 **Settings → Pages → Build and deployment**。
4. Source 选择 **Deploy from a branch**，Branch 选择 **main**，目录选择 **/(root)**，点击 **Save**。
5. 在 Pages 设置页等待 GitHub 显示实际发布网址。预期网址是 `https://linhong104.github.io/wanzhou-culture/?lang=zh`，只有发布成功后才能访问。页面名称请保留 `.html` 后缀，例如 `explore.html?lang=zh`。
6. 用手机和电脑打开发布网址，再请之前打不开的朋友实测。

免费方案使用公开仓库；发布后本包中的网页和素材会公开。此包没有平台身份文件、Git 历史、密钥或服务端文件。

## 功能

- 首页视频保留最新原视频，静音、循环播放；浏览器可能因系统设置限制自动播放，页面保留播放控制。
- 页面导航、风味筛选、工艺章节、三语切换和小鱼互动保留。
- 万滋当前使用**本站文化资料**回答问题，不调用云端 AI，不向 Groq 发送问题。
- GitHub Pages 不能运行原来的 AI 后端。以后启用 AI 时，需要另行部署后端并配置服务器密钥；不要把 Groq 密钥写入网页、JavaScript 或仓库。
- GitHub Pages 与当前 chatgpt.site 使用不同入口，但不同网络的可达性仍需实际测试。

## 官方说明

- [GitHub Pages 简介](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)
- [配置发布来源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub Pages 使用限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

图片和视频的署名说明见网站 `credits.html`。

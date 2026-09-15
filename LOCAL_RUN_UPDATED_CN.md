# 雨林外贸课程：当前启动与验收说明

更新日期：2026-09-14。旧 LOCAL_RUN_CN.md 正被其他程序占用，本说明取代旧文档中的 Clerk 配置步骤。

## 本地启动
目录：D:\codexshipinjiaoxue\LMS-clone
登录：http://localhost:3000/sign-in
课程管理：http://localhost:3000/teacher/courses
学员开通：http://localhost:3000/teacher/students

已有服务运行时直接访问。重新启动：
```powershell
npm run dev -- --hostname 127.0.0.1 --port 3000
```
当前使用本地邮箱密码登录。管理员读取 LocalUser.role = TEACHER，现有管理员账号密码保持不变。
.env 必须有 DATABASE_URL、AUTH_SECRET；运行时不需要 Clerk 或 NEXT_PUBLIC_TEACHER_ID。

## 数据与迁移
课程已按用户课表重排：13 个模块、15 节视频，Facebook 为 5.1–5.3，Instagram / TikTok 为 6，AI 为 8，Codex 为 9。
排序配置在 scripts/curriculum.mjs；排序脚本先完整匹配、再事务更新，保留课时 ID 和学习记录。
本轮数据库备份位于 backups/。数据库、备份及 .env 不应提交到 Git。

现有数据库已新增 videoProvider 列。将代码应用到其他旧 SQLite 数据库时，先备份、停止服务，再运行：
```powershell
node scripts/migrate-video-provider.mjs
npx prisma generate
```
不要运行旧 scripts/init-sqlite.mjs 来启动已有项目，它会重建数据库。
旧手工 SQLite 表与 Prisma 布尔类型声明有差异，不要强制 db push --accept-data-loss；本轮使用仅新增列的迁移。

## 操作验收
1. 管理员在“学员开通”创建学员，选择学员和课程开通。
2. 课程管理 → 章节 → 视频课时，填写有权使用的 HTTPS MP4 测试地址并保存。
3. 另一个浏览器会话登录学员，打开已开通课程并播放。
4. 播放结束自动记录完成，也可手动标记/取消，刷新后完成状态和百分比保留。
5. “继续学习”进入首个未完成课时，手机端可展开目录。
6. 未授权账号不能取得视频地址或保存进度；课程/章节下架后直链也被拦截。

## 检查命令
```powershell
npx tsc --noEmit --incremental false
npm run build
$env:SMOKE_VIDEO_URL = '替换为公开测试 MP4 的 HTTPS 地址'
node scripts/smoke-mvp.mjs
```
自动检查仅允许 localhost，使用临时账号与课程，默认结束后清理。

## 当前边界
正式课程尚未绑定视频。进度记录课时完成状态，尚未实现按秒断点续播。
隐藏下载按钮与固定水印不等于 DRM；腾讯云签名鉴权尚未实现。
Mux/UploadThing 保留为可选入口，部分旧后台仍为英文；AI 推荐未配置时返回未启用。支付未开放。
国内上线前仍需依赖升级、正式数据库迁移、备份、HTTPS、域名备案与腾讯云播放鉴权验收。

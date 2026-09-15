# 本地启动说明（雨林外贸课程 / LMS-clone）

## 当前状态
- 项目目录：`D:\codexshipinjiaoxue\LMS-clone`
- 开发服务已尝试启动：`http://localhost:3000`
- 若页面 500，通常是因为还没有填写 Clerk 密钥

## 你需要做的唯一关键步骤（约 3 分钟）
1. 打开 https://dashboard.clerk.com 注册/登录（免费）
2. Create application（随便起名，例如 yulin-lms）
3. 选择 Email 登录即可
4. 在 API Keys 页面复制：
   - Publishable key
   - Secret key
5. 用记事本打开本项目的 `.env` 文件（不要发到聊天里），填入：

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

6. 保存后告诉我“已填好 Clerk”，我会帮你重启服务
7. 注册一个账号后，把该用户的 User ID 填到：
```
NEXT_PUBLIC_TEACHER_ID=user_xxx
```
这样才能进教师后台创建课程

## 说明
- 第一阶段先不接 Stripe / 腾讯云 VOD / UploadThing / Mux 也可以先看界面
- 本地数据库暂时使用 SQLite（原项目是 MySQL），仅方便本机启动

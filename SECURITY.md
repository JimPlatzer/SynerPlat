# Security Policy

## 报告安全问题

请不要在公开 Issue 中提交 API Key、Token、密码、Cookie、个人数据或可复现的敏感利用细节。

如果你维护该项目的公开 GitHub 仓库，请通过仓库的 **Security → Report a vulnerability** 私下报告。若该入口尚未启用，请先仅描述受影响范围并联系仓库维护者，不要附带真实凭据。

## 凭据处理

- 真实 `.env` 文件不得提交。
- 部署凭据应存放在托管平台的加密环境变量或 GitHub Actions Secrets 中。
- 发现凭据进入 Git 历史后，应立即撤销并轮换，不能只删除最新版本中的文本。

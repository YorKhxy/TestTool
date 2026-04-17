# 三方平台管理端 API 测试计划

## 文档信息

| 属性 | 内容 |
|------|------|
| 项目名称 | 三方平台管理端 |
| API版本 | v1.0 |
| Base URL | /api/admin |
| 认证方式 | Bearer Token |
| 文档日期 | 2026-04-14 |
| 数据来源 | G:\api文档-管理(1)\api文档-管理 |

---

## 错误码定义

| 常量 | 值 | 说明 |
|------|-----|------|
| CodeOK | 200 | 成功 |
| CodeSystemError | 500 | 系统内部错误 |
| CodeParamError | 10001 | 请求参数错误 |
| CodeSmsCodeError | 10002 | 验证码错误 |
| CodeAccountNotFound | 10003 | 管理员账号不存在 |
| CodePasswordError | 10004 | 密码错误 |
| CodeAccountExists | 10005 | 角色名已存在 |
| CodeTokenInvalid | 10006 | 无效的 token |
| CodePermissionDenied | 10007 | 权限不足 |
| CodeGameNotFound | 10008 | 游戏不存在 |
| CodeVersionConflict | 10009 | 版本状态冲突 |
| CodeFileTypeError | 10010 | 不支持的文件类型 |
| CodeFileSizeError | 10011 | 文件超出允许大小 |
| CodeApkParseError | 10012 | APK 解析失败 |
| CodeNotFound | 10013 | 用户不存在 |
| CodeMerchantNotFound | 10014 | 商户不存在 |
| CodeAppNotFound | 10015 | 应用不存在 |
| CodeRoleNotFound | 10016 | 角色不存在 |
| CodeMenuNotFound | 10017 | 菜单不存在 |
| CodeAccountDisabled | 10018 | 账号已停用 |
| CodePackageNameExists | 10019 | 该包名已被注册，请更换包名 |

---

## 预期结果编写规则

| 场景 | HTTP状态码 | code | message | 说明 |
|------|-----------|------|---------|------|
| 成功 | 200 | 200 | success | - |
| 系统错误 | 200 | 500 | 系统内部错误 | - |
| 参数错误 | 200 | 10001 | 请求参数错误 | - |
| 短信验证码错误或过期 | 200 | 10002 | 验证码错误 | - |
| 账号不存在 | 200 | 10003 | 管理员账号不存在 | - |
| 密码错误 | 200 | 10004 | 密码错误 | - |
| 账号已存在/角色名已存在 | 200 | 10005 | 角色名已存在 | - |
| Token无效/无Token | 200 | 10006 | 无效的 token | - |
| 权限不足 | 200 | 10007 | 权限不足 | - |
| 游戏不存在 | 200 | 10008 | 游戏不存在 | - |
| 资源不存在/用户不存在 | 200 | 10013 | 用户不存在 | - |
| 商户不存在 | 200 | 10014 | 商户不存在 | - |
| 应用不存在 | 200 | 10015 | 应用不存在 | - |
| 角色不存在 | 200 | 10016 | 角色不存在 | - |
| 菜单不存在 | 200 | 10017 | 菜单不存在 | - |
| 账号已停用 | 200 | 10018 | 账号已停用 | - |
| 包名已被注册 | 200 | 10019 | 该包名已被注册，请更换包名 | - |

---

## 登录认证模块

> 基础路径：`/api/admin/auth`

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-AUTH-001 | 发送短信验证码-正常 | POST | /api/admin/auth/sendCode | Content-Type: application/json | - | `{"phone": "13800000000"}` | P0 | HTTP 200; code:200; message:success | - |
| TC-AUTH-002 | 发送短信验证码-手机号为空 | POST | /api/admin/auth/sendCode | Content-Type: application/json | - | `{"phone": ""}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-AUTH-003 | 发送短信验证码-手机号格式错误 | POST | /api/admin/auth/sendCode | Content-Type: application/json | - | `{"phone": "12345"}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-AUTH-004 | 登录-正常 | POST | /api/admin/auth/login | Content-Type: application/json | - | `{"phone": "13800000000", "code": "123456"}` | P0 | HTTP 200; code:200; message:success | admin_token: data.token |
| TC-AUTH-005 | 登录-手机号为空 | POST | /api/admin/auth/login | Content-Type: application/json | - | `{"phone": "", "code": "123456"}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-AUTH-006 | 登录-验证码为空 | POST | /api/admin/auth/login | Content-Type: application/json | - | `{"phone": "13800000000", "code": ""}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-AUTH-007 | 登录-验证码错误 | POST | /api/admin/auth/login | Content-Type: application/json | - | `{"phone": "13800000000", "code": "000000"}` | P1 | HTTP 200; code:10002; message:验证码错误 | - |
| TC-AUTH-008 | 登录-账号不存在 | POST | /api/admin/auth/login | Content-Type: application/json | - | `{"phone": "13900000000", "code": "123456"}` | P1 | HTTP 200; code:10003; message:管理员账号不存在 | - |
| TC-AUTH-009 | 退出登录 | POST | /api/admin/auth/logout | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:200; message:success | - |
| TC-AUTH-010 | 获取当前用户信息 | GET | /api/admin/auth/userinfo | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-AUTH-011 | 获取当前用户菜单权限 | GET | /api/admin/auth/menus | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-AUTH-012 | 获取当前用户权限标识列表 | GET | /api/admin/auth/permissions | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-AUTH-013 | 获取用户信息-无Token | GET | /api/admin/auth/userinfo | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-AUTH-014 | 获取用户信息-Token无效 | GET | /api/admin/auth/userinfo | Authorization: Bearer invalid_token | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-AUTH-015 | 获取菜单-无Token | GET | /api/admin/auth/menus | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-AUTH-016 | 获取权限标识-无Token | GET | /api/admin/auth/permissions | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |

---

## 商户管理模块

> 基础路径：`/api/admin/merchant`

### 商户审批

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-MCH-001 | 获取商户审批列表-正常 | GET | /api/admin/merchant/approval/list | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-MCH-002 | 获取商户审批列表-带分页 | GET | /api/admin/merchant/approval/list | Authorization: Bearer ${admin_token} | pageNum=1&pageSize=10 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-MCH-003 | 获取商户审批列表-关键词搜索 | GET | /api/admin/merchant/approval/list | Authorization: Bearer ${admin_token} | keyword=测试公司 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-MCH-004 | 获取商户审批列表-状态筛选待审批 | GET | /api/admin/merchant/approval/list | Authorization: Bearer ${admin_token} | approvalStatus=PENDING | - | P1 | HTTP 200; code:200; message:success | - |
| TC-MCH-005 | 获取商户审批列表-状态筛选已通过 | GET | /api/admin/merchant/approval/list | Authorization: Bearer ${admin_token} | approvalStatus=APPROVED | - | P1 | HTTP 200; code:200; message:success | - |
| TC-MCH-006 | 获取商户审批列表-状态筛选已驳回 | GET | /api/admin/merchant/approval/list | Authorization: Bearer ${admin_token} | approvalStatus=REJECTED | - | P1 | HTTP 200; code:200; message:success | - |
| TC-MCH-007 | 获取商户审批列表-无Token | GET | /api/admin/merchant/approval/list | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-MCH-008 | 获取商户审批详情-正常 | GET | /api/admin/merchant/approval/1 | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-MCH-009 | 获取商户审批详情-审批记录不存在 | GET | /api/admin/merchant/approval/999999 | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:10013; message:用户不存在 | - |
| TC-MCH-010 | 审批商户-通过 | POST | /api/admin/merchant/approval/audit | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"id": 1, "approvalStatus": "APPROVED", "rejectReason": ""}` | P0 | HTTP 200; code:200; message:success | - |
| TC-MCH-011 | 审批商户-驳回 | POST | /api/admin/merchant/approval/audit | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"id": 1, "approvalStatus": "REJECTED", "rejectReason": "资质不符合"}` | P0 | HTTP 200; code:200; message:success | - |
| TC-MCH-012 | 审批商户-驳回原因缺失 | POST | /api/admin/merchant/approval/audit | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"id": 1, "approvalStatus": "REJECTED", "rejectReason": ""}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-MCH-013 | 审批商户-审批记录ID缺失 | POST | /api/admin/merchant/approval/audit | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"approvalStatus": "APPROVED"}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-MCH-014 | 审批商户-审批状态非法 | POST | /api/admin/merchant/approval/audit | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"id": 1, "approvalStatus": "INVALID"}` | P2 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-MCH-015 | 审批商户-审批记录不存在 | POST | /api/admin/merchant/approval/audit | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"id": 999999, "approvalStatus": "APPROVED"}` | P1 | HTTP 200; code:10013; message:用户不存在 | - |
| TC-MCH-016 | 审批商户-无Token | POST | /api/admin/merchant/approval/audit | Content-Type: application/json | - | `{"id": 1, "approvalStatus": "APPROVED"}` | P0 | HTTP 200; code:10006; message:无效的 token | - |

### 商户审批记录

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-MCH-021 | 获取商户审批记录列表-正常 | GET | /api/admin/merchant/approval/records | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:200; message:success | - |
| TC-MCH-022 | 获取商户审批记录列表-关键词搜索 | GET | /api/admin/merchant/approval/records | Authorization: Bearer ${admin_token} | keyword=测试 | - | P2 | HTTP 200; code:200; message:success | - |
| TC-MCH-023 | 获取商户审批记录列表-状态筛选 | GET | /api/admin/merchant/approval/records | Authorization: Bearer ${admin_token} | approvalStatus=APPROVED | - | P2 | HTTP 200; code:200; message:success | - |

### 商户列表

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-MCH-031 | 获取商户管理列表-正常 | GET | /api/admin/merchant/list | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-MCH-032 | 获取商户管理列表-带分页 | GET | /api/admin/merchant/list | Authorization: Bearer ${admin_token} | pageNum=1&pageSize=10 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-MCH-033 | 获取商户管理列表-关键词搜索 | GET | /api/admin/merchant/list | Authorization: Bearer ${admin_token} | keyword=测试公司 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-MCH-034 | 获取商户管理列表-无Token | GET | /api/admin/merchant/list | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |

### 商户详情

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-MCH-041 | 获取商户基本信息-正常 | GET | /api/admin/merchant/1 | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | merchant_id: data.id |
| TC-MCH-042 | 获取商户基本信息-商户不存在 | GET | /api/admin/merchant/999999 | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:10014; message:商户不存在 | - |
| TC-MCH-043 | 获取商户本月百分比数据-默认当月 | GET | /api/admin/merchant/1/monthly-distribution | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:200; message:success | - |
| TC-MCH-044 | 获取商户本月百分比数据-指定月份 | GET | /api/admin/merchant/1/monthly-distribution | Authorization: Bearer ${admin_token} | month=2026-03 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-MCH-045 | 获取商户本月百分比数据-商户不存在 | GET | /api/admin/merchant/999999/monthly-distribution | Authorization: Bearer ${admin_token} | - | - | P2 | HTTP 200; code:10014; message:商户不存在 | - |
| TC-MCH-046 | 获取商户每日数据-正常 | GET | /api/admin/merchant/1/daily-stats | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:200; message:success | - |
| TC-MCH-047 | 获取商户每日数据-日期范围 | GET | /api/admin/merchant/1/daily-stats | Authorization: Bearer ${admin_token} | startDate=2026-03-01&endDate=2026-03-31 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-MCH-048 | 获取商户每日数据-商户不存在 | GET | /api/admin/merchant/999999/daily-stats | Authorization: Bearer ${admin_token} | - | - | P2 | HTTP 200; code:10014; message:商户不存在 | - |
| TC-MCH-049 | 获取商户关联应用列表-正常 | GET | /api/admin/merchant/1/apps | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:200; message:success | - |
| TC-MCH-050 | 获取商户关联应用列表-关键词搜索 | GET | /api/admin/merchant/1/apps | Authorization: Bearer ${admin_token} | keyword=测试应用 | - | P2 | HTTP 200; code:200; message:success | - |
| TC-MCH-051 | 获取商户关联应用列表-商户不存在 | GET | /api/admin/merchant/999999/apps | Authorization: Bearer ${admin_token} | - | - | P2 | HTTP 200; code:10014; message:商户不存在 | - |
| TC-MCH-052 | 获取商户关联应用详情-正常 | GET | /api/admin/merchant/1/apps/1 | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:200; message:success | - |
| TC-MCH-053 | 获取商户关联应用详情-商户不存在 | GET | /api/admin/merchant/999999/apps/1 | Authorization: Bearer ${admin_token} | - | - | P2 | HTTP 200; code:10014; message:商户不存在 | - |

---

## 应用管理模块

> 基础路径：`/api/admin/app`

### 应用待审批

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-APP-001 | 获取应用待审批列表-正常 | GET | /api/admin/app/approval/pending/list | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-APP-002 | 获取应用待审批列表-关键词搜索 | GET | /api/admin/app/approval/pending/list | Authorization: Bearer ${admin_token} | keyword=测试应用 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-APP-003 | 获取应用待审批列表-带分页 | GET | /api/admin/app/approval/pending/list | Authorization: Bearer ${admin_token} | pageNum=1&pageSize=10 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-APP-004 | 获取应用待审批列表-无Token | GET | /api/admin/app/approval/pending/list | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-APP-005 | 审批应用-通过 | POST | /api/admin/app/approval/audit | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"id": 1, "approvalStatus": "APPROVED", "rejectReason": "", "reviewComment": "", "attachments": []}` | P0 | HTTP 200; code:200; message:success | - |
| TC-APP-006 | 审批应用-驳回 | POST | /api/admin/app/approval/audit | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"id": 1, "approvalStatus": "REJECTED", "rejectReason": "应用描述不合规", "reviewComment": "", "attachments": []}` | P0 | HTTP 200; code:200; message:success | - |
| TC-APP-007 | 审批应用-测试中 | POST | /api/admin/app/approval/audit | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"id": 1, "approvalStatus": "TESTING", "rejectReason": "", "reviewComment": "需要测试", "attachments": []}` | P1 | HTTP 200; code:200; message:success | - |
| TC-APP-008 | 审批应用-审批ID缺失 | POST | /api/admin/app/approval/audit | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"approvalStatus": "APPROVED"}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-APP-009 | 审批应用-审批状态非法 | POST | /api/admin/app/approval/audit | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"id": 1, "approvalStatus": "INVALID"}` | P2 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-APP-010 | 审批应用-审批记录不存在 | POST | /api/admin/app/approval/audit | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"id": 999999, "approvalStatus": "APPROVED"}` | P1 | HTTP 200; code:10013; message:用户不存在 | - |
| TC-APP-011 | 审批应用-无Token | POST | /api/admin/app/approval/audit | Content-Type: application/json | - | `{"id": 1, "approvalStatus": "APPROVED"}` | P0 | HTTP 200; code:10006; message:无效的 token | - |

### 应用审批记录

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-APP-021 | 获取应用审批记录列表-正常 | GET | /api/admin/app/approval/records/list | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:200; message:success | - |
| TC-APP-022 | 获取应用审批记录列表-关键词搜索 | GET | /api/admin/app/approval/records/list | Authorization: Bearer ${admin_token} | keyword=测试 | - | P2 | HTTP 200; code:200; message:success | - |
| TC-APP-023 | 获取应用审批记录列表-状态筛选 | GET | /api/admin/app/approval/records/list | Authorization: Bearer ${admin_token} | approvalStatus=APPROVED | - | P2 | HTTP 200; code:200; message:success | - |

### 应用待上架

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-APP-031 | 获取应用待上架列表-正常 | GET | /api/admin/app/pending-publish/list | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-APP-032 | 获取应用待上架列表-关键词搜索 | GET | /api/admin/app/pending-publish/list | Authorization: Bearer ${admin_token} | keyword=测试 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-APP-033 | 获取应用待上架列表-无Token | GET | /api/admin/app/pending-publish/list | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-APP-034 | 应用上架-正常 | POST | /api/admin/app/publish/1 | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | app_id: 1 |
| TC-APP-035 | 应用上架-应用不存在 | POST | /api/admin/app/publish/999999 | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:10015; message:应用不存在 | - |
| TC-APP-036 | 应用上架-无Token | POST | /api/admin/app/publish/1 | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |

### 已上架应用

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-APP-041 | 获取已上架应用列表-正常 | GET | /api/admin/app/published/list | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-APP-042 | 获取已上架应用列表-关键词搜索 | GET | /api/admin/app/published/list | Authorization: Bearer ${admin_token} | keyword=测试 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-APP-043 | 获取已上架应用列表-无Token | GET | /api/admin/app/published/list | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |

### 应用详情

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-APP-051 | 获取应用详情-正常 | GET | /api/admin/app/1 | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-APP-052 | 获取应用详情-应用不存在 | GET | /api/admin/app/999999 | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:10015; message:应用不存在 | - |
| TC-APP-053 | 获取应用详情-无Token | GET | /api/admin/app/1 | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |

---

## 财务管理模块

> 基础路径：`/api/admin/finance`

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-FIN-001 | 获取财务列表-正常 | GET | /api/admin/finance/list | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-FIN-002 | 获取财务列表-关键词搜索 | GET | /api/admin/finance/list | Authorization: Bearer ${admin_token} | keyword=测试公司 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-FIN-003 | 获取财务列表-带分页 | GET | /api/admin/finance/list | Authorization: Bearer ${admin_token} | pageNum=1&pageSize=10 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-FIN-004 | 获取财务列表-无Token | GET | /api/admin/finance/list | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-FIN-005 | 获取商户财务应用统计-默认当月 | GET | /api/admin/finance/1/app-stats | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:200; message:success | - |
| TC-FIN-006 | 获取商户财务应用统计-指定月份 | GET | /api/admin/finance/1/app-stats | Authorization: Bearer ${admin_token} | month=2026-03 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-FIN-007 | 获取商户财务应用统计-商户不存在 | GET | /api/admin/finance/999999/app-stats | Authorization: Bearer ${admin_token} | - | - | P2 | HTTP 200; code:10014; message:商户不存在 | - |
| TC-FIN-008 | 获取商户财务应用统计-无Token | GET | /api/admin/finance/1/app-stats | - | - | - | P1 | HTTP 200; code:10006; message:无效的 token | - |
| TC-FIN-009 | 导出商户财务统计-正常 | GET | /api/admin/finance/1/export | Authorization: Bearer ${admin_token} | month=2026-03 | - | P0 | HTTP 200 | - |
| TC-FIN-010 | 导出商户财务统计-月份缺失 | GET | /api/admin/finance/1/export | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-FIN-011 | 导出商户财务统计-商户不存在 | GET | /api/admin/finance/999999/export | Authorization: Bearer ${admin_token} | month=2026-03 | - | P2 | HTTP 200; code:10014; message:商户不存在 | - |
| TC-FIN-012 | 导出商户财务统计-无Token | GET | /api/admin/finance/1/export | - | month=2026-03 | - | P0 | HTTP 200; code:10006; message:无效的 token | - |

---

## 用户管理模块

> 基础路径：`/api/admin/user`

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-USER-001 | 获取用户列表-正常 | GET | /api/admin/user/list | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-USER-002 | 获取用户列表-关键词搜索 | GET | /api/admin/user/list | Authorization: Bearer ${admin_token} | keyword=138 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-USER-003 | 获取用户列表-状态筛选正常 | GET | /api/admin/user/list | Authorization: Bearer ${admin_token} | status=NORMAL | - | P1 | HTTP 200; code:200; message:success | - |
| TC-USER-004 | 获取用户列表-状态筛选停用 | GET | /api/admin/user/list | Authorization: Bearer ${admin_token} | status=DISABLED | - | P1 | HTTP 200; code:200; message:success | - |
| TC-USER-005 | 获取用户列表-角色筛选 | GET | /api/admin/user/list | Authorization: Bearer ${admin_token} | roleId=1 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-USER-006 | 获取用户列表-带分页 | GET | /api/admin/user/list | Authorization: Bearer ${admin_token} | pageNum=1&pageSize=10 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-USER-007 | 获取用户列表-无Token | GET | /api/admin/user/list | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-USER-008 | 新增用户-正常 | POST | /api/admin/user | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"username": "testuser", "email": "test@example.com", "phone": "13800000001", "roleId": 1, "status": "NORMAL"}` | P0 | HTTP 200; code:200; message:success | new_user_id: data.id |
| TC-USER-009 | 新增用户-用户名缺失 | POST | /api/admin/user | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"email": "test@example.com", "phone": "13800000001", "roleId": 1}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-USER-010 | 新增用户-手机号缺失 | POST | /api/admin/user | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"username": "testuser", "email": "test@example.com", "roleId": 1}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-USER-011 | 新增用户-角色ID缺失 | POST | /api/admin/user | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"username": "testuser", "email": "test@example.com", "phone": "13800000001"}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-USER-012 | 新增用户-邮箱格式错误 | POST | /api/admin/user | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"username": "testuser", "email": "invalid-email", "phone": "13800000001", "roleId": 1}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-USER-013 | 新增用户-手机号已存在 | POST | /api/admin/user | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"username": "testuser", "email": "test2@example.com", "phone": "13800000000", "roleId": 1}` | P1 | HTTP 200; code:10003; message:管理员账号不存在 | - |
| TC-USER-014 | 新增用户-无Token | POST | /api/admin/user | Content-Type: application/json | - | `{"username": "testuser", "email": "test@example.com", "phone": "13800000001", "roleId": 1}` | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-USER-015 | 编辑用户-正常 | PUT | /api/admin/user/2 | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"email": "newemail@example.com", "phone": "13800000002", "roleId": 1, "status": "NORMAL"}` | P0 | HTTP 200; code:200; message:success | - |
| TC-USER-016 | 编辑用户-用户不存在 | PUT | /api/admin/user/999999 | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"email": "newemail@example.com"}` | P1 | HTTP 200; code:10013; message:用户不存在 | - |
| TC-USER-017 | 编辑用户-无Token | PUT | /api/admin/user/2 | Content-Type: application/json | - | `{"email": "newemail@example.com"}` | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-USER-018 | 删除用户-正常 | DELETE | /api/admin/user/2 | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-USER-019 | 删除用户-用户不存在 | DELETE | /api/admin/user/999999 | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:10013; message:用户不存在 | - |
| TC-USER-020 | 删除用户-无法删除自己 | DELETE | /api/admin/user/1 | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-USER-021 | 删除用户-无Token | DELETE | /api/admin/user/2 | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |

---

## 角色管理模块

> 基础路径：`/api/admin/role`

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-ROLE-001 | 获取角色列表-正常 | GET | /api/admin/role/list | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-ROLE-002 | 获取角色列表-关键词搜索 | GET | /api/admin/role/list | Authorization: Bearer ${admin_token} | keyword=管理员 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-ROLE-003 | 获取角色列表-状态筛选 | GET | /api/admin/role/list | Authorization: Bearer ${admin_token} | status=NORMAL | - | P1 | HTTP 200; code:200; message:success | - |
| TC-ROLE-004 | 获取角色列表-带分页 | GET | /api/admin/role/list | Authorization: Bearer ${admin_token} | pageNum=1&pageSize=10 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-ROLE-005 | 获取角色列表-无Token | GET | /api/admin/role/list | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-ROLE-006 | 获取角色详情-正常 | GET | /api/admin/role/1 | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-ROLE-007 | 获取角色详情-角色不存在 | GET | /api/admin/role/999999 | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:10016; message:角色不存在 | - |
| TC-ROLE-008 | 获取角色详情-无Token | GET | /api/admin/role/1 | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-ROLE-009 | 新增角色-正常 | POST | /api/admin/role | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"roleName": "测试角色", "roleKey": "test_role", "sort": 1, "menuIds": [1, 2, 3], "status": "NORMAL", "remark": "测试备注"}` | P0 | HTTP 200; code:200; message:success | new_role_id: data.id |
| TC-ROLE-010 | 新增角色-角色名缺失 | POST | /api/admin/role | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"roleKey": "test_role", "sort": 1}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-ROLE-011 | 新增角色-权限字符缺失 | POST | /api/admin/role | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"roleName": "测试角色", "sort": 1}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-ROLE-012 | 新增角色-排序缺失 | POST | /api/admin/role | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"roleName": "测试角色", "roleKey": "test_role"}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-ROLE-013 | 新增角色-角色名已存在 | POST | /api/admin/role | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"roleName": "超级管理员", "roleKey": "admin_duplicate", "sort": 1}` | P1 | HTTP 200; code:10005; message:角色名已存在 | - |
| TC-ROLE-014 | 新增角色-无Token | POST | /api/admin/role | Content-Type: application/json | - | `{"roleName": "测试角色", "roleKey": "test_role", "sort": 1}` | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-ROLE-015 | 编辑角色-正常 | PUT | /api/admin/role/2 | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"roleName": "更新角色", "roleKey": "updated_role", "sort": 2, "menuIds": [1, 2], "status": "NORMAL", "remark": "更新备注"}` | P0 | HTTP 200; code:200; message:success | - |
| TC-ROLE-016 | 编辑角色-角色不存在 | PUT | /api/admin/role/999999 | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"roleName": "更新角色"}` | P1 | HTTP 200; code:10016; message:角色不存在 | - |
| TC-ROLE-017 | 编辑角色-无Token | PUT | /api/admin/role/2 | Content-Type: application/json | - | `{"roleName": "更新角色"}` | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-ROLE-018 | 删除角色-正常 | DELETE | /api/admin/role/2 | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-ROLE-019 | 删除角色-角色不存在 | DELETE | /api/admin/role/999999 | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:10016; message:角色不存在 | - |
| TC-ROLE-020 | 删除角色-超级管理员不可删除 | DELETE | /api/admin/role/1 | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-ROLE-021 | 删除角色-无Token | DELETE | /api/admin/role/2 | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-ROLE-022 | 获取角色下拉列表-正常 | GET | /api/admin/role/options | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:200; message:success | - |
| TC-ROLE-023 | 获取角色下拉列表-无Token | GET | /api/admin/role/options | - | - | - | P1 | HTTP 200; code:10006; message:无效的 token | - |

---

## 菜单管理模块

> 基础路径：`/api/admin/menu`

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-MENU-001 | 获取菜单树-正常 | GET | /api/admin/menu/tree | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-MENU-002 | 获取菜单树-关键词搜索 | GET | /api/admin/menu/tree | Authorization: Bearer ${admin_token} | keyword=用户 | - | P1 | HTTP 200; code:200; message:success | - |
| TC-MENU-003 | 获取菜单树-无Token | GET | /api/admin/menu/tree | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-MENU-004 | 新增菜单-目录类型 | POST | /api/admin/menu | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"parentId": 0, "menuType": "DIR", "menuName": "测试目录", "sort": 1, "visible": true, "refresh": false}` | P0 | HTTP 200; code:200; message:success | new_menu_id: data.id |
| TC-MENU-005 | 新增菜单-菜单类型 | POST | /api/admin/menu | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"parentId": 1, "menuType": "MENU", "menuName": "测试菜单", "sort": 1, "path": "/test", "permission": "test:menu", "visible": true, "refresh": false}` | P0 | HTTP 200; code:200; message:success | - |
| TC-MENU-006 | 新增菜单-按钮类型 | POST | /api/admin/menu | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"parentId": 2, "menuType": "BUTTON", "menuName": "测试按钮", "sort": 1, "permission": "test:button"}` | P1 | HTTP 200; code:200; message:success | - |
| TC-MENU-007 | 新增菜单-上级菜单ID缺失 | POST | /api/admin/menu | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"menuType": "MENU", "menuName": "测试菜单", "sort": 1}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-MENU-008 | 新增菜单-菜单类型缺失 | POST | /api/admin/menu | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"parentId": 0, "menuName": "测试菜单", "sort": 1}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-MENU-009 | 新增菜单-菜单名称缺失 | POST | /api/admin/menu | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"parentId": 0, "menuType": "DIR", "sort": 1}` | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-MENU-010 | 新增菜单-无Token | POST | /api/admin/menu | Content-Type: application/json | - | `{"parentId": 0, "menuType": "DIR", "menuName": "测试目录", "sort": 1}` | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-MENU-011 | 编辑菜单-正常 | PUT | /api/admin/menu/2 | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"parentId": 1, "menuType": "MENU", "menuName": "更新菜单", "sort": 2, "path": "/updated", "permission": "updated:menu", "visible": true, "refresh": false}` | P0 | HTTP 200; code:200; message:success | - |
| TC-MENU-012 | 编辑菜单-菜单不存在 | PUT | /api/admin/menu/999999 | Authorization: Bearer ${admin_token}; Content-Type: application/json | - | `{"menuName": "更新菜单"}` | P1 | HTTP 200; code:10017; message:菜单不存在 | - |
| TC-MENU-013 | 编辑菜单-无Token | PUT | /api/admin/menu/2 | Content-Type: application/json | - | `{"menuName": "更新菜单"}` | P0 | HTTP 200; code:10006; message:无效的 token | - |
| TC-MENU-014 | 删除菜单-正常 | DELETE | /api/admin/menu/2 | Authorization: Bearer ${admin_token} | - | - | P0 | HTTP 200; code:200; message:success | - |
| TC-MENU-015 | 删除菜单-菜单不存在 | DELETE | /api/admin/menu/999999 | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:10017; message:菜单不存在 | - |
| TC-MENU-016 | 删除菜单-有子菜单不可删除 | DELETE | /api/admin/menu/1 | Authorization: Bearer ${admin_token} | - | - | P1 | HTTP 200; code:10001; message:请求参数错误 | - |
| TC-MENU-017 | 删除菜单-无Token | DELETE | /api/admin/menu/2 | - | - | - | P0 | HTTP 200; code:10006; message:无效的 token | - |

---

## 测试数据设计

### 认证测试数据

| 账户类型 | phone | code | 说明 |
|---------|-------|------|------|
| 管理员 | 13800000000 | 123456 | 测试用账号 |
| 无效手机 | 13900000000 | 000000 | 不存在的用户 |

### 通用枚举

**审批状态 (approvalStatus)**

| 值 | 说明 |
|---|---|
| PENDING | 待审批 |
| APPROVED | 已通过 |
| REJECTED | 已驳回 |

**应用上架状态 (publishStatus)**

| 值 | 说明 |
|---|---|
| PENDING | 待上架 |
| PUBLISHED | 已上架 |
| UNPUBLISHED | 已下架 |

**用户/角色状态 (status)**

| 值 | 说明 |
|---|---|
| NORMAL | 正常 |
| DISABLED | 停用 |

**菜单类型 (menuType)**

| 值 | 说明 |
|---|---|
| DIR | 目录 |
| MENU | 菜单 |
| BUTTON | 按钮 |

---

## 测试时间估算

| 模块 | 用例数 | 预计时间(分钟) |
|------|--------|--------------|
| 登录认证 | 16 | 22 |
| 商户管理 | 40 | 55 |
| 应用管理 | 28 | 40 |
| 财务管理 | 12 | 18 |
| 用户管理 | 21 | 30 |
| 角色管理 | 23 | 35 |
| 菜单管理 | 19 | 28 |
| **合计** | **159** | **228 (~3.8小时)** |

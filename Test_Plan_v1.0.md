# 海外算力服务 API 测试计划

## 文档信息

| 属性 | 内容 |
|------|------|
| 项目名称 | 海外算力服务 |
| API版本 | v0.0.1 |
| Swagger版本 | 2.0 |
| Base URL | http://192.168.1.36:8999 |
| 认证方式 | JWT Bearer Token |
| 文档版本 | v1.1 |
| 文档日期 | 2026-04-02 |
| 测试环境 | http://192.168.1.36:8999 |
| 总测试用例 | 105个（原81个+ 新增24个） |

---

## 1. 测试范围与目标
### 1.1 测试范围

本测试计划涵盖以下功能模块的API测试：
| 序号 | 模块 | 路径前缀 | 功能说明 |
|------|------|---------|---------|
| 1 | 认证模块 | /hashrate/admin/auth | 管理员账号密码登录 |
| 2 | 管理员账户 | /hashrate/admin/account | 管理员CRUD、角色权限、MFA管理 |
| 3 | 公告管理 | /hashrate/admin/announcement | 公告CRUD、状态管理 |
| 4 | 算力管理 | /hashrate/admin/v1 | 币值管理、单价档位、锁仓设置、发放记录 |
| 5 | 用户管理 | /hashrate/user/admin | 用户列表、收益管理、算力充值扣除 |
| 6 | 订单管理 | /hashrate/order/admin | 订单列表查询 |
| 7 | 统计模块 | /hashrate/stats/admin | 平台仪表盘统计 |
| 8 | 提现管理 | /hashrate/withdraw/admin | 提现审批、配置管理 |
| 9 | 邀请管理 | /hashrate/invite/admin | 邀请人详情 |
| 10 | 客户端公告 | /hashrate/client/announcement | 客户端获取公告 |
| 11 | 客户端配置 | /hashrate/front/config | 客户端配置聚合 |
| 12 | 系统接口 | /ping | 健康检查 |

### 1.2 测试目标

1. **功能验证**: 验证所有API端点按照接口规格正确响应
2. **参数校验**: 验证必填参数缺失或格式错误时的错误处理
3. **业务逻辑**: 验证业务流程（如币值审核流程、提现审批流程）
4. **数据一致性**: 验证增删改操作对数据一致性的影响
5. **安全验证**: 验证认证机制、权限控制的有效性
---

## 2. API模块与端点清单
### 2.1 认证模块 (admin/auth)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/admin/auth/v1/login/password | POST | VerifyLoginPassword | 账号密码登录 | 否 |

**请求参数 (VerifyLoginPasswordReq)**:
```json
{
  "email": "string (必填) - 登录邮箱",
  "password": "string (必填) - 登录密码",
  "mfa_code": "string (可选) - MFA验证码"
}
```

**响应参数 (VerifyLoginCodeResp)**:
```json
{
  "token": "string - JWT令牌"
}
```

---

### 2.2 管理员账户模块 (admin/account)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/admin/account/v1/users/me | GET | GetMe | 获取当前管理员信息 | 否 |
| /hashrate/admin/account/v1/users | GET | ListAdminUsers | 管理员列表 | 否 |
| /hashrate/admin/account/v1/users/create | POST | CreateAdminUser | 新增管理员 | 否 |
| /hashrate/admin/account/v1/users/enable | POST | EnableAdminUser | 启用管理员 | 否 |
| /hashrate/admin/account/v1/users/disable | POST | DisableAdminUser | 禁用管理员 | 否 |
| /hashrate/admin/account/v1/users/password/change | POST | ChangeAdminPassword | 修改管理员密码 | 否 |
| /hashrate/admin/account/v1/admins/roles/get | GET | GetAdminRoles | 查询管理员角色 | 否 |
| /hashrate/admin/account/v1/admins/roles/set | POST | SetAdminRoles | 设置管理员角色 | 否 |
| /hashrate/admin/account/v1/roles/list | GET | ListRoles | 角色列表 | 否 |
| /hashrate/admin/account/v1/roles/create | POST | CreateRole | 创建角色 | 否 |
| /hashrate/admin/account/v1/roles/update | POST | UpdateRole | 更新角色 | 否 |
| /hashrate/admin/account/v1/roles/delete | POST | DeleteRole | 删除角色 | 否 |
| /hashrate/admin/account/v1/roles/perms/tree | GET | GetRolePermTree | 获取角色权限树 | 否 |
| /hashrate/admin/account/v1/perms/list | GET | ListPerms | 权限列表 | 否 |
| /hashrate/admin/account/v1/perms/me | GET | GetMyPerms | 获取当前管理员权限（树形） | 否 |
| /hashrate/admin/account/v1/perms/init | POST | InitPermissions | 全量新增权限 | 否 |
| /hashrate/admin/account/v1/mfa/generate | GET | GenerateMFA | 生成MFA密钥 | 否 |
| /hashrate/admin/account/v1/mfa/enable | POST | EnableMFA | 开启MFA | 否 |
| /hashrate/admin/account/v1/mfa/disable | POST | DisableMFA | 关闭MFA | 否 |

---

### 2.3 公告管理模块 (admin/announcement)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/admin/announcement/v1/list | GET | ListAnnouncement | 公告列表 | 否 |
| /hashrate/admin/announcement/v1/create | POST | CreateAnnouncement | 新增公告 | 否 |
| /hashrate/admin/announcement/v1/update | POST | UpdateAnnouncement | 修改公告 | 否 |
| /hashrate/admin/announcement/v1/delete | POST | DeleteAnnouncement | 删除公告 | 否 |
| /hashrate/admin/announcement/v1/status/update | POST | UpdateAnnouncementStatus | 修改公告开关状态 | 否 |

---

### 2.4 算力管理模块 (admin/hashrate)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/admin/v1/coin/value/list | GET | ListCoinValue | 算力币种列表 | 否 |
| /hashrate/admin/v1/coin/value/upsert | POST | UpsertCoinValue | 算力币种新增或保存 | 否 |
| /hashrate/admin/v1/coin/value/delete | POST | DeleteCoinValue | 算力币种删除 | 否 |
| /hashrate/admin/v1/coin/value/audit/list | GET | ListCoinValueAudit | 算力币值审核记录列表 | 否 |
| /hashrate/admin/v1/coin/value/audit/apply | POST | ApplyCoinValueAudit | 申请修改算力币值 | 否 |
| /hashrate/admin/v1/coin/value/audit/approve | POST | ApproveCoinValueAudit | 审核算力币值修改 | 否 |
| /hashrate/admin/v1/coin/value/audit/revoke | POST | RevokeCoinValueAudit | 撤销算力币值修改申请 | 否 |
| /hashrate/admin/v1/power/unitprice/grade/list | GET | ListPowerUnitPriceGrade | 查询算力单价档位列表 | 否 |
| /hashrate/admin/v1/power/unitprice/grade/upsert | POST | UpsertPowerUnitPriceGrade | 新增或保存算力单价档位 | 否 |
| /hashrate/admin/v1/power/unitprice/grade/delete | POST | DeletePowerUnitPriceGrade | 删除算力单价档位 | 否 |
| /hashrate/admin/v1/lock/setting/get | GET | GetLockSetting | 查询锁仓设置 | 否 |
| /hashrate/admin/v1/lock/setting/set | POST | SetLockSetting | 锁仓设置 | 否 |
| /hashrate/admin/v1/recharge/release/list | GET | ListRechargeReleaseRecords | 算力发放记录列表 | 否 |
| /hashrate/admin/v1/asset/release/list | GET | ListAssetReleaseRecords | 用户USDT和Point发放记录列表 | 否 |

---

### 2.5 用户管理模块 (admin/user)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/user/admin/v1/list | GET | ListUsers | 用户列表 | 否 |
| /hashrate/user/admin/v1/income/detail | GET | GetIncomeDetail | 收益详情 | 否 |
| /hashrate/user/admin/v1/release/history | GET | ListReleaseHistory | 每日发放记录 | 否 |
| /hashrate/user/admin/v1/recharge/hashrate | POST | RechargeHashrate | 为用户发放算力 | 否 |
| /hashrate/user/admin/v1/recharge/hashrate/any | POST | RechargeHashrateAny | 用户充值任意算力 | 否 |
| /hashrate/user/admin/v1/recharge/coupon | POST | RechargeCoupon | 用户发放点券 | 否 |
| /hashrate/user/admin/v1/deduct/hashrate | POST | DeductHashrate | 扣除算力 | 否 |
| /hashrate/user/admin/v1/status/update | POST | UpdateUserStatus | 算力收益开关 | 否 |

---

### 2.6 订单管理模块 (admin/order)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/order/admin/v1/orders | GET | ListHashrateOrders | 订单列表 | 否 |

---

### 2.7 统计模块 (admin/stats)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/stats/admin/v1/dashboard | GET | GetDashboard | 平台仪表盘统计 | 否 |

---

### 2.8 提现管理模块 (admin/withdraw)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/withdraw/admin/v1/apply/list | GET | ListApplyWithdrawOrders | 提现申请列表 | 否 |
| /hashrate/withdraw/admin/v1/apply/agree | POST | AgreeApplyWithdraw | 同意提现 | 否 |
| /hashrate/withdraw/admin/v1/apply/freeze | POST | FreezeApplyWithdraw | 冻结提现 | 否 |
| /hashrate/withdraw/admin/v1/apply/unfreeze | POST | UnfreezeApplyWithdraw | 解冻提现 | 否 |
| /hashrate/withdraw/admin/v1/config/list | GET | ListWithdrawConfig | 查询提现配置列表 | 否 |
| /hashrate/withdraw/admin/v1/config/set | POST | SetWithdrawConfig | 设置币种提现配置 | 否 |

---

### 2.9 邀请管理模块 (admin/invite)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/invite/admin/v1/details | GET | ListInviteDetails | 邀请人详情列表 | 否 |

---

### 2.10 客户端模块 (client)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/client/announcement/v1/list | GET | ClientListAnnouncement | 获取所有公告 | 否 |
| /hashrate/front/config/v1/config | GET | GetClientConfig | 客户端配置聚合 | 否 |

---

### 2.11 系统接口

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /ping | GET | ping | 健康检查 | 否 |

---

## 3. 测试策略

### 3.1 测试类型

| 测试类型 | 说明 | 覆盖模块 |
|---------|------|---------|
| 功能测试 | 验证API端点的功能正确性 | 所有模块 |
| 参数校验测试 | 验证必填参数缺失或格式错误时的错误处理 | 所有模块 |
| 业务逻辑测试 | 验证业务流程的正确性 | 币值审核、提现审批 |
| 分页测试 | 验证分页参数的正确性 | 列表类API |
| 筛选测试 | 验证筛选参数的正确性 | 列表类API |
| 边界值测试 | 验证边界条件的处理 | 数值类参数 |
| 安全测试 | 验证认证和权限控制 | 需要认证的API |

### 3.2 测试优先级定义
| 优先级 | 定义 | 说明 |
|-------|------|------|
| P0 | 核心功能 | 必须通过的测试用例，阻塞业务流程 |
| P1 | 重要功能 | 高优先级，应在P0之后执行 |
| P2 | 一般功能 | 中等优先级，验证非核心功能 |
| P3 | 低优先级 | 验证边界条件、异常情况 |

### 3.3 准入准出标准

**准入标准**:
- 测试环境可用
- API文档齐全
- 测试用例已评估
- 测试数据已准备
**准出标准**:
- 所有P0用例通过
- 所有P1用例通过率≥95%
- 无阻塞性缺陷
---

## 4. 测试用例设计

### 4.1 认证模块测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-AUTH-001 | 正常登录-邮箱密码正确 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "{{auth.email}}", "password": "{{auth.password}}"}` | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"token": "eyJ..."}}` | auth_token: data.token |
| TC-AUTH-002 | 登录失败-密码错误 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "{{auth.email}}", "password": "WrongPassword123"}` | P0 | HTTP 200; 响应体 `{"code": 3002, "message": "验证码无效", "data": null}` | - |
| TC-AUTH-003 | 登录失败-用户不存在 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "nonexistent@example.com", "password": "AnyPassword123"}` | P1 | HTTP 200; 响应体 `{"code": 1008, "message": "common.notfound", "data": null}` | - |
| TC-AUTH-004 | 登录失败-邮箱为空 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "", "password": "admin123"}` | P1 | HTTP 200; 响应体 `{"code": 3001, "message": "邮箱格式不正确", "data": null}` | - |
| TC-AUTH-005 | 登录失败-密码为空 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "{{auth.email}}", "password": ""}` | P1 | HTTP 200; 响应体 `{"code": 6001, "message": "param.invalid", "data": null}` | - |
| TC-AUTH-006 | 登录失败-邮箱格式错误 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "not-an-email", "password": "admin123"}` | P2 | HTTP 200; 响应体 `{"code": 3001, "message": "邮箱格式不正确", "data": null}` | - |
| TC-AUTH-007 | MFA登录-验证码正确 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "{{auth.email}}", "password": "{{auth.password}}", "mfa_code": "123456"}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"token": "eyJ..."}}` | auth_token: data.token |
| TC-AUTH-008 | MFA登录-验证码错误 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "{{auth.email}}", "password": "{{auth.password}}", "mfa_code": "000000"}` | P1 | HTTP 200; 响应体 `{"code": 3002, "message": "验证码无效", "data": null}` | - |
| TC-AUTH-009 | Token过期后访问需认证API | GET | /hashrate/admin/account/v1/users/me | Authorization: Bearer expired_token_here | - | - | P0 | HTTP 401; 响应体 `{"code": 401, "message": "token无效", "data": null}` | - |
| TC-AUTH-010 | 无Token访问需认证接口 | GET | /hashrate/admin/account/v1/users/me | - | - | - | P0 | HTTP 401; 响应体 `{"code": 401, "message": "未授权", "data": null}` | - |
| TC-AUTH-011 | 连续5次密码错误后登录 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "{{auth.email}}", "password": "WrongPass1"}` (重复5次) | P1 | HTTP 200; 响应体 `{"code": 3002, "message": "验证码无效", "data": null}` | - |

### 4.2 管理员账户模块测试用例
| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-ACCT-001 | 获取当前管理员信息 | GET | /hashrate/admin/account/v1/users/me | X-Admin-Token: ${auth_token} | - | - | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"id": 1, "email": "admin@admin.com", "name": "管理员", "status": 1, "mfa_enabled": 0, "roles": [...]}}` | - |
| TC-ACCT-002 | 获取管理员列表-无参数 | GET | /hashrate/admin/account/v1/users | X-Admin-Token: ${auth_token} | - | - | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [{"id": 1, "email": "...", "name": "...", "status": 1, "mfa_enabled": 0, "roles": [...]}, ...]}}` | - |
| TC-ACCT-003 | 获取管理员列表-邮箱筛选 | GET | /hashrate/admin/account/v1/users | X-Admin-Token: ${auth_token} | email=admin@admin.com | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [...]}}`; list中所有email为admin@admin.com | - |
| TC-ACCT-004 | 获取管理员列表-分页 | GET | /hashrate/admin/account/v1/users | X-Admin-Token: ${auth_token} | page=1&size=10 | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [...]}}`; list.length≤10 | - |
| TC-ACCT-005 | 新增管理员-正常 | POST | /hashrate/admin/account/v1/users/create | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"email": "newadmin@admin.com", "name": "新管理员", "password": "Newadmin123", "role_ids": [1]}` | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"id": N}}` | - |
| TC-ACCT-006 | 新增管理员-邮箱重复 | POST | /hashrate/admin/account/v1/users/create | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"email": "existing@example.com", "name": "重复管理员", "password": "admin123", "role_ids": [1]}` | P1 | HTTP 200; 响应体 `{"code": 3001, "message": "邮箱格式不正确", "data": null}` | - |
| TC-ACCT-007 | 新增管理员-参数缺失 | POST | /hashrate/admin/account/v1/users/create | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"email": "incomplete@example.com"}` | P1 | HTTP 200; 响应体 `{"code": 6001, "message": "param.invalid", "data": null}` | - |
| TC-ACCT-008 | 启用管理员 | POST | /hashrate/admin/account/v1/users/enable | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": 2}` | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-ACCT-009 | 禁用管理员 | POST | /hashrate/admin/account/v1/users/disable | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": 2}` | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-ACCT-010 | 修改密码-正常 | POST | /hashrate/admin/account/v1/users/password/change | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"email": "{{auth.email}}", "old_password": "{{auth.password}}", "new_password": "NewPass@123"}` | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-ACCT-011 | 修改密码-旧密码错误 | POST | /hashrate/admin/account/v1/users/password/change | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"email": "{{auth.email}}", "old_password": "WrongOldPass", "new_password": "NewPass@123"}` | P1 | HTTP 200; 响应体 `{"code": 3002, "message": "验证码无效", "data": null}` | - |
| TC-ACCT-012 | 查询管理员角色 | GET | /hashrate/admin/account/v1/admins/roles/get | X-Admin-Token: ${auth_token} | admin_id=2 | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"role_ids": [...]}}` | - |
| TC-ACCT-013 | 设置管理员角色 | POST | /hashrate/admin/account/v1/admins/roles/set | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"admin_id": 2, "role_ids": [1, 2]}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-ACCT-014 | 获取角色列表 | GET | /hashrate/admin/account/v1/roles/list | X-Admin-Token: ${auth_token} | - | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"list": [{"id": 1, "name": "...", "description": "..."}, ...]}}` | - |
| TC-ACCT-015 | 创建角色-正常 | POST | /hashrate/admin/account/v1/roles/create | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"name": "新角色", "description": "测试角色", "perms": ["user:view", "user:edit"]}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"id": N}}` | - |
| TC-ACCT-016 | 更新角色 | POST | /hashrate/admin/account/v1/roles/update | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": 5, "name": "更新角色", "description": "更新描述", "perms": ["user:view"]}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-ACCT-017 | 删除角色 | POST | /hashrate/admin/account/v1/roles/delete | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": 5}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-ACCT-018 | 获取角色权限树 | GET | /hashrate/admin/account/v1/roles/perms/tree | X-Admin-Token: ${auth_token} | role_id=1 | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"perms": [...]}}` | - |
| TC-ACCT-019 | 获取权限列表 | GET | /hashrate/admin/account/v1/perms/list | X-Admin-Token: ${auth_token} | - | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"list": [{"key": "...", "title": "..."}, ...]}}` | - |
| TC-ACCT-020 | 获取当前管理员权限树 | GET | /hashrate/admin/account/v1/perms/me | X-Admin-Token: ${auth_token} | - | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"perms": [...]}}` | - |
| TC-ACCT-021 | 全量新增权限 | POST | /hashrate/admin/account/v1/perms/init | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"list": [{"key": "/new/path", "title": "新权限", "perms": "new:perm"}]}` | P2 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-ACCT-022 | 生成MFA密钥 | GET | /hashrate/admin/account/v1/mfa/generate | X-Admin-Token: ${auth_token} | - | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"otpauth_url": "...", "secret": "..."}}` | - |
| TC-ACCT-023 | 开启MFA | POST | /hashrate/admin/account/v1/mfa/enable | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"code": "123456"}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-ACCT-024 | 关闭MFA | POST | /hashrate/admin/account/v1/mfa/disable | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"code": "123456"}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-ACCT-025 | 普通管理员访问超管API | POST | /hashrate/admin/account/v1/users/create | Authorization: Bearer ${user_token}; Content-Type: application/json | - | `{"email": "newadmin@admin.com", "name": "新管理员", "password": "admin123", "role_ids": [1]}` | P0 | HTTP 403; 响应体 `{"code": 5001, "message": "permission.denied", "data": null}` | - |
| TC-ACCT-026 | Token刷新机制测试 | GET | /hashrate/admin/account/v1/users/me | Authorization: Bearer ${refreshed_token} | - | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"id": ..., "email": "..."}}` | - |
| TC-ACCT-027 | 分页参数page=0 | GET | /hashrate/admin/account/v1/users | X-Admin-Token: ${auth_token} | page=0 | - | P1 | HTTP 200; 响应体 `{"code": 6001, "message": "param.invalid", "data": null}` | - |
| TC-ACCT-028 | 分页参数page=-1 | GET | /hashrate/admin/account/v1/users | X-Admin-Token: ${auth_token} | page=-1 | - | P1 | HTTP 200; 响应体 `{"code": 6001, "message": "param.invalid", "data": null}` | - |
| TC-ACCT-029 | 分页参数size=0 | GET | /hashrate/admin/account/v1/users | X-Admin-Token: ${auth_token} | size=0 | - | P1 | HTTP 200; 响应体 `{"code": 6001, "message": "param.invalid", "data": null}` | - |
| TC-ACCT-030 | 分页参数size超限(99999) | GET | /hashrate/admin/account/v1/users | X-Admin-Token: ${auth_token} | size=99999 | - | P2 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [...]}}` | - |
| TC-ACCT-031 | 删除已分配用户的角色 | POST | /hashrate/admin/account/v1/roles/delete | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": 1}` | P1 | HTTP 200; 响应体 `{"code": 6001, "message": "param.invalid", "data": null}` | - |
| TC-ACCT-032 | 创建密码为空的管理员 | POST | /hashrate/admin/account/v1/users/create | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"email": "empty@example.com", "name": "空密码管理员", "password": "", "role_ids": [1]}` | P1 | HTTP 200; 响应体 `{"code": 6001, "message": "param.invalid", "data": null}` | - |
| TC-ACCT-033 | 创建密码过短(3字符)的管理员 | POST | /hashrate/admin/account/v1/users/create | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"email": "short@example.com", "name": "短密码管理员", "password": "abc", "role_ids": [1]}` | P2 | HTTP 200; 响应体 `{"code": 6001, "message": "param.invalid", "data": null}` | - |
| TC-ACCT-034 | 创建密码强度为纯数字的管理员 | POST | /hashrate/admin/account/v1/users/create | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"email": "weak@example.com", "name": "弱密码管理员", "password": "12345678", "role_ids": [1]}` | P2 | HTTP 200; 响应体 `{"code": 6001, "message": "param.invalid", "data": null}` | - |

### 4.3 公告管理模块测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-ANN-001 | 获取公告列表 | GET | /hashrate/admin/announcement/v1/list | X-Admin-Token: ${auth_token} | page=1&size=20 | - | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [{"id": 1, "title": "...", "content": "...", "is_open": 1, "create_at": "...", "update_at": "..."}, ...]}}` | - |
| TC-ANN-002 | 创建公告-正常 | POST | /hashrate/admin/announcement/v1/create | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"title": "测试公告", "content": "这是一条测试公告内容", "is_open": 1}` | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"id": N}}` | - |
| TC-ANN-003 | 创建公告-参数缺失 | POST | /hashrate/admin/announcement/v1/create | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"title": "缺少内容"}` | P1 | HTTP 200; 响应体 `{"code": 6001, "message": "param.invalid", "data": null}` | - |
| TC-ANN-004 | 修改公告 | POST | /hashrate/admin/announcement/v1/update | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": 1, "title": "更新标题", "content": "更新内容", "is_open": 1}` | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-ANN-005 | 删除公告 | POST | /hashrate/admin/announcement/v1/delete | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": 1}` | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-ANN-006 | 修改公告开关状态 | POST | /hashrate/admin/announcement/v1/status/update | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": 1, "is_open": 0}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-ANN-007 | 创建公告-内容超长(>10000字符) | POST | /hashrate/admin/announcement/v1/create | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"title": "超长公告", "content": "{'a':1}".repeat(5000)}` | P2 | HTTP 200; 响应体 `{"code": 6001, "message": "param.invalid", "data": null}` | - |

### 4.4 算力管理模块测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-HASH-001 | 获取算力币值列表 | GET | /hashrate/admin/v1/coin/value/list | X-Admin-Token: ${auth_token} | - | - | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"list": [{"coin": "...", "amount": ...}, ...]}}` | - |
| TC-HASH-002 | 新增/保存算力币值 | POST | /hashrate/admin/v1/coin/value/upsert | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"seq": 1, "coin": "ETH", "amount": 2500.00}` | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-HASH-003 | 删除算力币值 | POST | /hashrate/admin/v1/coin/value/delete | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"coin": "ETH"}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-HASH-004 | 获取币值审核列表 | GET | /hashrate/admin/v1/coin/value/audit/list | X-Admin-Token: ${auth_token} | coin=ETH&status=-1&page=1&size=20 | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [{"id": 1, "coin": "...", "amount": ..., "status": ...}, ...]}}` | - |
| TC-HASH-005 | 申请修改币值 | POST | /hashrate/admin/v1/coin/value/audit/apply | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"coin": "ETH", "amount": 2600.00}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"id": N, "status": 0}}` | - |
| TC-HASH-006 | 审核通过币值修改 | POST | /hashrate/admin/v1/coin/value/audit/approve | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": 1, "status": 1, "remark": "审核通过"}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-HASH-007 | 审核拒绝币值修改 | POST | /hashrate/admin/v1/coin/value/audit/approve | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": 2, "status": 2, "remark": "币值不合理"}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-HASH-008 | 撤销币值修改申请 | POST | /hashrate/admin/v1/coin/value/audit/revoke | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": 3}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-HASH-009 | 获取算力单价档位列表 | GET | /hashrate/admin/v1/power/unitprice/grade/list | X-Admin-Token: ${auth_token} | - | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"list": [{"level": 1, "usdt_amount": ..., "power_amount": ...}, ...]}}` | - |
| TC-HASH-010 | 新增/保存算力单价档位 | POST | /hashrate/admin/v1/power/unitprice/grade/upsert | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"level": 1, "usdt_amount": 100.00, "power_amount": 10.00}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-HASH-011 | 删除算力单价档位 | POST | /hashrate/admin/v1/power/unitprice/grade/delete | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"level": 1}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-HASH-012 | 获取锁仓设置 | GET | /hashrate/admin/v1/lock/setting/get | X-Admin-Token: ${auth_token} | coin=ETH | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"coin": "...", "days": ..., "lock_ratio": ...}}` | - |
| TC-HASH-013 | 设置锁仓 | POST | /hashrate/admin/v1/lock/setting/set | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"coin": "ETH", "days": 30, "lock_ratio": 0.3}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-HASH-014 | 获取算力发放记录列表 | GET | /hashrate/admin/v1/recharge/release/list | X-Admin-Token: ${auth_token} | user_id=10001&page=1&size=20&coin=Hashrate | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [{"user_id": ..., "wallet_address": "...", "coin": "...", "amount": ..., "release_time": "..."}, ...]}}` | - |
| TC-HASH-015 | 获取USDT和Point发放记录 | GET | /hashrate/admin/v1/asset/release/list | X-Admin-Token: ${auth_token} | user_id=10001&coin=Usdt&page=1&size=20 | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [{"user_id": ..., "coin": "...", "amount": ..., "release_time": "..."}, ...]}}` | - |
| TC-HASH-016 | 审核状态-重复审核已通过记录 | POST | /hashrate/admin/v1/coin/value/audit/approve | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": 1, "status": 1, "remark": "重复审核"}` | P1 | HTTP 200; 响应体 `{"code": 4001, "message": "订单状态不可操作", "data": null}` | - |
| TC-HASH-017 | 审核状态-审核已拒绝记录 | POST | /hashrate/admin/v1/coin/value/audit/approve | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": 2, "status": 1, "remark": "重新通过"}` | P1 | HTTP 200; 响应体 `{"code": 4001, "message": "订单状态不可操作", "data": null}` | - |

### 4.5 用户管理模块测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-USER-001 | 获取用户列表 | GET | /hashrate/user/admin/v1/list | X-Admin-Token: ${auth_token} | page=1&size=20 | - | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [{"user_id": 10001, "wallet_address": "0x...", ...}, ...]}}` | - |
| TC-USER-002 | 用户列表-UID搜索 | GET | /hashrate/user/admin/v1/list | X-Admin-Token: ${auth_token} | key=10001 | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [...]}}` | - |
| TC-USER-003 | 用户列表-钱包地址搜索 | GET | /hashrate/user/admin/v1/list | X-Admin-Token: ${auth_token} | key=0x1234567890abcdef1234567890abcdef12345678 | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [...]}}` | - |
| TC-USER-004 | 获取用户收益详情 | GET | /hashrate/user/admin/v1/income/detail | X-Admin-Token: ${auth_token} | user_id=10001 | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total_income": ..., "daily_income": ...}}` | - |
| TC-USER-005 | 获取每日发放记录 | GET | /hashrate/user/admin/v1/release/history | X-Admin-Token: ${auth_token} | user_id=10001&page=1&size=20 | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [{"release_time": "...", "amount": ..., "source": "..."}, ...]}}` | - |
| TC-USER-006 | 为用户发放算力 | POST | /hashrate/user/admin/v1/recharge/hashrate | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"walletAddress": "0x1234567890abcdef1234567890abcdef12345678", "amount": 100}` | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-USER-007 | 用户充值任意算力 | POST | /hashrate/user/admin/v1/recharge/hashrate/any | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"walletAddress": "0x1234567890abcdef1234567890abcdef12345678", "amount": 50, "desc": "测试充值"}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-USER-008 | 用户发放点券 | POST | /hashrate/user/admin/v1/recharge/coupon | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"walletAddress": "0x1234567890abcdef1234567890abcdef12345678", "amount": 100, "desc": "点券发放"}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-USER-009 | 扣除用户算力 | POST | /hashrate/user/admin/v1/deduct/hashrate | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"walletAddress": "0x1234567890abcdef1234567890abcdef12345678", "amount": 10}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-USER-010 | 扣除算力-余额不足 | POST | /hashrate/user/admin/v1/deduct/hashrate | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"walletAddress": "0x1234567890abcdef1234567890abcdef12345678", "amount": 999999}` | P1 | HTTP 200; 响应体 `{"code": 1007, "message": "收益数量必须为正数", "data": null}` | - |
| TC-USER-011 | 冻结用户收益 | POST | /hashrate/user/admin/v1/status/update | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"userId": "10001", "status": 1}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-USER-012 | 解冻用户收益 | POST | /hashrate/user/admin/v1/status/update | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"userId": "10001", "status": 0}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-USER-013 | 钱包地址格式错误-过短 | GET | /hashrate/user/admin/v1/list | X-Admin-Token: ${auth_token} | key=0x1234 | - | P1 | HTTP 200; 响应体 `{"code": 6001, "message": "param.invalid", "data": null}` | - |
| TC-USER-014 | 钱包地址格式错误-非法字符 | GET | /hashrate/user/admin/v1/list | X-Admin-Token: ${auth_token} | key=0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ | - | P1 | HTTP 200; 响应体 `{"code": 6001, "message": "param.invalid", "data": null}` | - |
| TC-USER-015 | user_id不存在时查询收益 | GET | /hashrate/user/admin/v1/income/detail | X-Admin-Token: ${auth_token} | user_id=99999999 | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total_income": 0, "daily_income": 0}}` | - |
| TC-USER-016 | 用户列表-key参数多条件组合 | GET | /hashrate/user/admin/v1/list | X-Admin-Token: ${auth_token} | key=10001&page=1&size=10 | - | P2 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [...]}}` | - |
| TC-USER-017 | 发放算力-金额为负数 | POST | /hashrate/user/admin/v1/recharge/hashrate | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"walletAddress": "0x1234567890abcdef1234567890abcdef12345678", "amount": -50}` | P2 | HTTP 200; 响应体 `{"code": 1002, "message": "算力值必须为非负数", "data": null}` | - |
| TC-USER-018 | 发放点券-金额为负数 | POST | /hashrate/user/admin/v1/recharge/coupon | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"walletAddress": "0x1234567890abcdef1234567890abcdef12345678", "amount": -100, "desc": "负数点券"}` | P2 | HTTP 200; 响应体 `{"code": 1007, "message": "收益数量必须为正数", "data": null}` | - |

### 4.6 订单管理模块测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-ORDER-001 | 获取订单列表 | GET | /hashrate/order/admin/v1/orders | X-Admin-Token: ${auth_token} | page=1&size=20 | - | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [{"order_id": "...", "user_id": 10001, "coin": "ETH", "amount": 100.00, "status": 0, ...}, ...]}}` | - |
| TC-ORDER-002 | 订单列表-用户筛选 | GET | /hashrate/order/admin/v1/orders | X-Admin-Token: ${auth_token} | user_id=10001 | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [...]}}` | - |
| TC-ORDER-003 | 订单列表-分页 | GET | /hashrate/order/admin/v1/orders | X-Admin-Token: ${auth_token} | page=2&size=10 | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [...]}}` | - |

### 4.7 统计模块测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-STATS-001 | 获取平台仪表盘统计 | GET | /hashrate/stats/admin/v1/dashboard | X-Admin-Token: ${auth_token} | - | - | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total_users": N, "total_orders": N, "total_hashrate": "...", "daily_income": ...}}` | - |

### 4.8 提现管理模块测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-WD-001 | 获取提现申请列表 | GET | /hashrate/withdraw/admin/v1/apply/list | X-Admin-Token: ${auth_token} | page=1&size=20 | - | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [{"order_id": "...", "user_id": 10001, "address": "0x...", "coin": "ETH", "amount": 100.00, "fee": 1.00, "status": 0, "submit_time": "...", ...}, ...]}}` | - |
| TC-WD-002 | 提现申请列表-状态筛选 | GET | /hashrate/withdraw/admin/v1/apply/list | X-Admin-Token: ${auth_token} | status=0 | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [...]}}` | - |
| TC-WD-003 | 提现申请列表-日期范围 | GET | /hashrate/withdraw/admin/v1/apply/list | X-Admin-Token: ${auth_token} | start_date=2024-01-01&end_date=2024-01-31 | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [...]}}` | - |
| TC-WD-004 | 同意提现申请 | POST | /hashrate/withdraw/admin/v1/apply/agree | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": "withdraw_123"}` | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-WD-005 | 冻结提现申请 | POST | /hashrate/withdraw/admin/v1/apply/freeze | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": "withdraw_123"}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-WD-006 | 解冻提现申请 | POST | /hashrate/withdraw/admin/v1/apply/unfreeze | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": "withdraw_123"}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-WD-007 | 获取提现配置列表 | GET | /hashrate/withdraw/admin/v1/config/list | X-Admin-Token: ${auth_token} | - | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"list": [{"coin": "...", "fee_amount": ..., "min_amount": ...}, ...]}}` | - |
| TC-WD-008 | 设置提现配置 | POST | /hashrate/withdraw/admin/v1/config/set | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"coin": "ETH", "fee_amount": 1.00, "min_amount": 10.00}` | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"success": true}}` | - |
| TC-WD-009 | 提现-重复同意已完成的提现 | POST | /hashrate/withdraw/admin/v1/apply/agree | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": "withdraw_completed_123"}` | P0 | HTTP 200; 响应体 `{"code": 4001, "message": "订单状态不可操作", "data": null}` | - |
| TC-WD-010 | 提现-修改已完成提现状态 | POST | /hashrate/withdraw/admin/v1/apply/freeze | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"id": "withdraw_completed_123"}` | P0 | HTTP 200; 响应体 `{"code": 4001, "message": "订单状态不可操作", "data": null}` | - |
| TC-WD-011 | 提现列表-status+coin组合筛选 | GET | /hashrate/withdraw/admin/v1/apply/list | X-Admin-Token: ${auth_token} | status=0&coin=ETH | - | P2 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [...]}}` | - |
| TC-WD-012 | 提现列表-无效日期范围(start>end) | GET | /hashrate/withdraw/admin/v1/apply/list | X-Admin-Token: ${auth_token} | start_date=2024-01-31&end_date=2024-01-01 | - | P2 | HTTP 200; 响应体 `{"code": 6001, "message": "param.invalid", "data": null}` | - |
| TC-WD-013 | 设置提现配置-不支持的币种 | POST | /hashrate/withdraw/admin/v1/config/set | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"coin": "UNSUPPORTED", "fee_amount": 1.00, "min_amount": 10.00}` | P2 | HTTP 200; 响应体 `{"code": 4004, "message": "币种不支持", "data": null}` | - |
| TC-WD-014 | 提现-手续费率超限 | POST | /hashrate/withdraw/admin/v1/config/set | X-Admin-Token: ${auth_token}; Content-Type: application/json | - | `{"coin": "ETH", "fee_amount": 2.00, "min_amount": 10.00}` | P2 | HTTP 200; 响应体 `{"code": 1004, "message": "手续费率必须在0-1之间", "data": null}` | - |

### 4.9 邀请管理模块测试用例
| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-INV-001 | 获取邀请人详情列表 | GET | /hashrate/invite/admin/v1/details | X-Admin-Token: ${auth_token} | inviter_id=10001&page=1&size=20 | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"total": N, "list": [{"inviter_id": 10001, "invitee_id": 10002, "invite_time": "...", ...}, ...]}}` | - |

### 4.10 客户端模块测试用例
| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-CLIENT-001 | 获取所有公告 | GET | /hashrate/client/announcement/v1/list | - | - | - | P1 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"list": [{"id": 1, "title": "...", "content": "...", "is_open": 1, "create_at": "..."}, ...]}}` | - |
| TC-CLIENT-002 | 获取客户端配置 | GET | /hashrate/front/config/v1/config | - | - | - | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"version": "...", "download_url": "...", "customer_service_url": "..."}}` | - |

### 4.11 系统接口测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |
|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|
| TC-SYS-001 | 健康检查 | GET | /ping | - | - | - | P0 | HTTP 200; 响应体 `{"code": 0, "message": "SUCCESS", "data": {"status": "ok"}}` | - |

---

## 5. 测试数据设计

### 5.1 认证测试数据

| 账户类型 | email | password | 说明 |
|---------|-------|----------|------|
| 管理员 | admin@admin.com | admin123 | 测试用账号 |
| 无效用户 | nonexistent@example.com | AnyPass123! | 不存在的用户 |

### 5.2 币种枚举
| 币种代码 | 名称 |
|--------|------|
| ETH | Ethereum |
| DOGE | Dogecoin |
| LTC | Litecoin |
| RWA | Real World Asset |
| CSY | CSY币 |

### 5.3 状态枚举
| 状态类型 | 值 | 说明 |
|--------|---|------|
| 用户状态 | 0 | 禁用 |
| 用户状态 | 1 | 启用 |
| 公告开关 | 0 | 关闭 |
| 公告开关 | 1 | 开启 |
| 收益状态 | 0 | 正常 |
| 收益状态 | 1 | 冻结 |
| 提现状态 | -1 | 全部 |
| 提现状态 | 0 | 审核中 |
| 提现状态 | 1 | 已完成 |
| 提现状态 | 2 | 已拒绝 |
| 审核状态 | -1 | 全部 |
| 审核状态 | 0 | 待审核 |
| 审核状态 | 1 | 通过 |
| 审核状态 | 2 | 拒绝 |
| 审核状态 | 3 | 撤销 |

### 5.4 边界值测试数据
| 参数类型 | 最小值 | 正常值 | 最大值 | 超限测试 |
|---------|-------|--------|-------|---------|
| page | 1 | 1 | - | 0, -1 |
| size | 1 | 20 | - | 0, -1, 1000 |
| lock_ratio | 0 | 0.5 | 1 | -0.1, 1.1 |
| amount | 0 | 100 | - | -1, 999999999 |

---

## 6. 风险评估

### 6.1 高风险项

| 风险项 | 风险描述 | 影响 | 缓解措施 |
|-------|---------|------|---------|
| 财务操作 | 算力充值扣除、提现审批涉及资金 | 高 | P0级别测试，优先执行 |
| 权限控制 | MFA、角色权限控制不严可能导致安全问题 | 高 | 安全测试用例覆盖 |
| 数据一致性 | 币值修改、锁仓设置影响用户收益计算 | 中 | 业务逻辑测试覆盖 |

### 6.2 中风险项

| 风险项 | 风险描述 | 影响 | 缓解措施 |
|-------|---------|------|---------|
| 分页参数 | 分页参数校验不严可能导致数据泄露 | 中 | 边界值测试覆盖 |
| 筛选参数 | SQL注入风险 | 中 | 参数格式校验测试 |
| 审核流程 | 币值审核、提现审批流程不完整 | 中 | 业务逻辑测试覆盖 |

### 6.3 低风险项

| 风险项 | 风险描述 | 影响 | 缓解措施 |
|-------|---------|------|---------|
| 公告管理 | 非核心功能，影响较小 | 低 | 标准功能测试 |
| 邀请管理 | 非核心功能，影响较小 | 低 | 标准功能测试 |

---

## 7. 测试时间估算
### 7.1 估算依据

| 模块 | API数量 | 原用例数 | 新增用例数 | 补充后用例数 | 预计时间(分钟) |
|-----|-------|---------|---------|------------|--------------|
| 认证模块 | 1 | 8 | 3 | 11 | 15 |
| 管理员账户 | 19 | 24 | 10 | 34 | 50 |
| 公告管理 | 5 | 6 | 1 | 7 | 12 |
| 算力管理 | 14 | 15 | 2 | 17 | 28 |
| 用户管理 | 8 | 12 | 4 | 16 | 26 |
| 订单管理 | 1 | 3 | 0 | 3 | 5 |
| 统计模块 | 1 | 1 | 0 | 1 | 3 |
| 提现管理 | 6 | 8 | 4 | 12 | 22 |
| 邀请管理 | 1 | 1 | 0 | 1 | 3 |
| 客户端模块 | 2 | 2 | 0 | 2 | 5 |
| 系统接口 | 1 | 1 | 0 | 1 | 2 |
| **合计** | **59** | **81** | **24** | **105** | **171** |

### 7.2 测试阶段安排

| 阶段 | 内容 | 用例数 | 预计时间 |
|------|------|--------|---------|
| 阶段一 | 认证模块 + 系统接口 | 12 | 18分钟 |
| 阶段二 | 管理员账户模块 | 34 | 50分钟 |
| 阶段三 | 公告管理 + 客户端模块 | 9 | 17分钟 |
| 阶段四 | 算力管理模块 | 17 | 28分钟 |
| 阶段五 | 用户管理 + 订单管理 | 19 | 31分钟 |
| 阶段六 | 统计 + 提现 + 邀请模块 | 14 | 27分钟 |
| **总计** | | **105** | **171分钟 (~2.9小时)** |

---

## 8. 测试环境要求

### 8.1 环境配置

| 环境 | URL | 说明 |
|------|-----|------|
| 测试环境 | http://192.168.1.36:8999 | API服务地址 |
| 本地 | localhost | 开发测试 |

### 8.2 认证配置

- **认证方式**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **获取方式**: 通过登录接口获取

### 8.3 Content-Type

- **请求**: `application/json`
- **响应**: `application/json`

---

## 9. 附录

### 9.1 响应状态码说明

| 状态码 | 说明 |
|-------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，认证失败 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 422 | 请求格式正确但语义错误 |
| 500 | 服务器内部错误 |

### 9.2 错误响应格式

```json
{
  "error": "错误描述",
  "code": "错误码"
}
```

### 9.3 分页响应格式

```json
{
  "total": 100,
  "list": [...]
}
```

---

## 10. 文档变更记录

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|---------|
| 1.0 | 2026-04-02 | 测试经理 | 初始版本 |
| 1.1 | 2026-04-02 | 测试审核员 | 补充审核报告中的22个遗漏用例，新增安全测试、边界值测试、业务逻辑测试 |

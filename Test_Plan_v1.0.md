# 海外算力服务 API 测试计划

## 文档信息

| 属�?| 内容 |
|------|------|
| 项目名称 | 海外算力服务 |
| API版本 | v0.0.1 |
| Swagger版本 | 2.0 |
| Base URL | http://192.168.1.36:8999 |
| 认证方式 | JWT Bearer Token |
| 文档版本 | v1.1 |
| 文档日期 | 2026-04-02 |
| 测试环境 | http://192.168.1.36:8999 |
| 总测试用�?| 105个（�?1�?+ 新增24个） |

---

## 1. 测试范围与目�?
### 1.1 测试范围

本测试计划涵盖以下功能模块的API测试�?
| 序号 | 模块 | 路径前缀 | 功能说明 |
|------|------|---------|---------|
| 1 | 认证模块 | /hashrate/admin/auth | 管理员账号密码登�?|
| 2 | 管理员账�?| /hashrate/admin/account | 管理员CRUD、角色权限、MFA管理 |
| 3 | 公告管理 | /hashrate/admin/announcement | 公告CRUD、状态管�?|
| 4 | 算力管理 | /hashrate/admin/v1 | 币值管理、单价档位、锁仓设置、发放记�?|
| 5 | 用户管理 | /hashrate/user/admin | 用户列表、收益管理、算力充�?扣除 |
| 6 | 订单管理 | /hashrate/order/admin | 订单列表查询 |
| 7 | 统计模块 | /hashrate/stats/admin | 平台仪表盘统�?|
| 8 | 提现管理 | /hashrate/withdraw/admin | 提现审批、配置管�?|
| 9 | 邀请管�?| /hashrate/invite/admin | 邀请人详情 |
| 10 | 客户端公�?| /hashrate/client/announcement | 客户端获取公�?|
| 11 | 客户端配�?| /hashrate/front/config | 客户端配置聚�?|
| 12 | 系统接口 | /ping | 健康检�?|

### 1.2 测试目标

1. **功能验证**: 验证所有API端点按照接口规格正确响应
2. **参数校验**: 验证必填参数缺失或格式错误时的错误处�?3. **业务逻辑**: 验证业务流程（如币值审核流程、提现审批流程）
4. **数据一致�?*: 验证增删改操作对数据一致性的影响
5. **安全验证**: 验证认证机制、权限控制的有效�?
---

## 2. API模块与端点清�?
### 2.1 认证模块 (admin/auth)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/admin/auth/v1/login/password | POST | VerifyLoginPassword | 账号密码登录 | �?|

**请求参数 (VerifyLoginPasswordReq)**:
```json
{
  "email": "string (必填) - 登录邮箱",
  "password": "string (必填) - 登录密码",
  "mfa_code": "string (可�? - MFA验证�?
}
```

**响应参数 (VerifyLoginCodeResp)**:
```json
{
  "token": "string - JWT令牌"
}
```

---

### 2.2 管理员账户模�?(admin/account)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/admin/account/v1/users/me | GET | GetMe | 获取当前管理员信�?| �?|
| /hashrate/admin/account/v1/users | GET | ListAdminUsers | 管理员列�?| �?|
| /hashrate/admin/account/v1/users/create | POST | CreateAdminUser | 新增管理�?| �?|
| /hashrate/admin/account/v1/users/enable | POST | EnableAdminUser | 启用管理�?| �?|
| /hashrate/admin/account/v1/users/disable | POST | DisableAdminUser | 禁用管理�?| �?|
| /hashrate/admin/account/v1/users/password/change | POST | ChangeAdminPassword | 修改管理员密�?| �?|
| /hashrate/admin/account/v1/admins/roles/get | GET | GetAdminRoles | 查询管理员角�?| �?|
| /hashrate/admin/account/v1/admins/roles/set | POST | SetAdminRoles | 设置管理员角�?| �?|
| /hashrate/admin/account/v1/roles/list | GET | ListRoles | 角色列表 | �?|
| /hashrate/admin/account/v1/roles/create | POST | CreateRole | 创建角色 | �?|
| /hashrate/admin/account/v1/roles/update | POST | UpdateRole | 更新角色 | �?|
| /hashrate/admin/account/v1/roles/delete | POST | DeleteRole | 删除角色 | �?|
| /hashrate/admin/account/v1/roles/perms/tree | GET | GetRolePermTree | 获取角色权限�?| �?|
| /hashrate/admin/account/v1/perms/list | GET | ListPerms | 权限列表 | �?|
| /hashrate/admin/account/v1/perms/me | GET | GetMyPerms | 获取当前管理员权限（树形�?| �?|
| /hashrate/admin/account/v1/perms/init | POST | InitPermissions | 全量新增权限 | �?|
| /hashrate/admin/account/v1/mfa/generate | GET | GenerateMFA | 生成MFA密钥 | �?|
| /hashrate/admin/account/v1/mfa/enable | POST | EnableMFA | 开启MFA | �?|
| /hashrate/admin/account/v1/mfa/disable | POST | DisableMFA | 关闭MFA | �?|

---

### 2.3 公告管理模块 (admin/announcement)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/admin/announcement/v1/list | GET | ListAnnouncement | 公告列表 | �?|
| /hashrate/admin/announcement/v1/create | POST | CreateAnnouncement | 新增公告 | �?|
| /hashrate/admin/announcement/v1/update | POST | UpdateAnnouncement | 修改公告 | �?|
| /hashrate/admin/announcement/v1/delete | POST | DeleteAnnouncement | 删除公告 | �?|
| /hashrate/admin/announcement/v1/status/update | POST | UpdateAnnouncementStatus | 修改公告开关状�?| �?|

---

### 2.4 算力管理模块 (admin/hashrate)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/admin/v1/coin/value/list | GET | ListCoinValue | 算力币�?列表 | �?|
| /hashrate/admin/v1/coin/value/upsert | POST | UpsertCoinValue | 算力币�?新增或保�?| �?|
| /hashrate/admin/v1/coin/value/delete | POST | DeleteCoinValue | 算力币�?删除 | �?|
| /hashrate/admin/v1/coin/value/audit/list | GET | ListCoinValueAudit | 算力币值审核记录列�?| �?|
| /hashrate/admin/v1/coin/value/audit/apply | POST | ApplyCoinValueAudit | 申请修改算力币�?| �?|
| /hashrate/admin/v1/coin/value/audit/approve | POST | ApproveCoinValueAudit | 审核算力币值修�?| �?|
| /hashrate/admin/v1/coin/value/audit/revoke | POST | RevokeCoinValueAudit | 撤销算力币值修改申�?| �?|
| /hashrate/admin/v1/power/unitprice/grade/list | GET | ListPowerUnitPriceGrade | 查询算力单价档位列表 | �?|
| /hashrate/admin/v1/power/unitprice/grade/upsert | POST | UpsertPowerUnitPriceGrade | 新增或保存算力单价档�?| �?|
| /hashrate/admin/v1/power/unitprice/grade/delete | POST | DeletePowerUnitPriceGrade | 删除算力单价档位 | �?|
| /hashrate/admin/v1/lock/setting/get | GET | GetLockSetting | 查询锁仓设置 | �?|
| /hashrate/admin/v1/lock/setting/set | POST | SetLockSetting | 锁仓设置 | �?|
| /hashrate/admin/v1/recharge/release/list | GET | ListRechargeReleaseRecords | 算力发放记录列表 | �?|
| /hashrate/admin/v1/asset/release/list | GET | ListAssetReleaseRecords | 用户USDT和Point发放记录列表 | �?|

---

### 2.5 用户管理模块 (admin/user)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/user/admin/v1/list | GET | ListUsers | 用户列表 | �?|
| /hashrate/user/admin/v1/income/detail | GET | GetIncomeDetail | 收益详情 | �?|
| /hashrate/user/admin/v1/release/history | GET | ListReleaseHistory | 每日发放记录 | �?|
| /hashrate/user/admin/v1/recharge/hashrate | POST | RechargeHashrate | 为用户发放算�?| �?|
| /hashrate/user/admin/v1/recharge/hashrate/any | POST | RechargeHashrateAny | 用户充值任意算�?| �?|
| /hashrate/user/admin/v1/recharge/coupon | POST | RechargeCoupon | 用户发放点券 | �?|
| /hashrate/user/admin/v1/deduct/hashrate | POST | DeductHashrate | 扣除算力 | �?|
| /hashrate/user/admin/v1/status/update | POST | UpdateUserStatus | 算力收益开�?| �?|

---

### 2.6 订单管理模块 (admin/order)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/order/admin/v1/orders | GET | ListHashrateOrders | 订单列表 | �?|

---

### 2.7 统计模块 (admin/stats)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/stats/admin/v1/dashboard | GET | GetDashboard | 平台仪表盘统�?| �?|

---

### 2.8 提现管理模块 (admin/withdraw)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/withdraw/admin/v1/apply/list | GET | ListApplyWithdrawOrders | 提现申请列表 | �?|
| /hashrate/withdraw/admin/v1/apply/agree | POST | AgreeApplyWithdraw | 同意提现 | �?|
| /hashrate/withdraw/admin/v1/apply/freeze | POST | FreezeApplyWithdraw | 冻结提现 | �?|
| /hashrate/withdraw/admin/v1/apply/unfreeze | POST | UnfreezeApplyWithdraw | 解冻提现 | �?|
| /hashrate/withdraw/admin/v1/config/list | GET | ListWithdrawConfig | 查询提现配置列表 | �?|
| /hashrate/withdraw/admin/v1/config/set | POST | SetWithdrawConfig | 设置币种提现配置 | �?|

---

### 2.9 邀请管理模�?(admin/invite)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/invite/admin/v1/details | GET | ListInviteDetails | 邀请人详情列表 | �?|

---

### 2.10 客户端模�?(client)

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /hashrate/client/announcement/v1/list | GET | ClientListAnnouncement | 获取所有公�?| �?|
| /hashrate/front/config/v1/config | GET | GetClientConfig | 客户端配置聚�?| �?|

---

### 2.11 系统接口

| 端点 | 方法 | 操作ID | 功能描述 | 认证 |
|------|------|--------|---------|------|
| /ping | GET | ping | 健康检�?| �?|

---

## 3. 测试策略

### 3.1 测试类型

| 测试类型 | 说明 | 覆盖模块 |
|---------|------|---------|
| 功能测试 | 验证API端点的功能正确�?| 所有模�?|
| 参数校验测试 | 验证必填参数缺失或格式错误时的错误处�?| 所有模�?|
| 业务逻辑测试 | 验证业务流程的正确�?| 币值审核、提现审�?|
| 分页测试 | 验证分页参数的正确�?| 列表类API |
| 筛选测�?| 验证筛选参数的正确�?| 列表类API |
| 边界值测�?| 验证边界条件的处�?| 数值类参数 |
| 安全测试 | 验证认证和权限控�?| 需要认证的API |

### 3.2 测试优先级定�?
| 优先�?| 定义 | 说明 |
|-------|------|------|
| P0 | 核心功能 | 必须通过的测试用例，阻塞业务流程 |
| P1 | 重要功能 | 高优先级，应在P0之后执行 |
| P2 | 一般功�?| 中等优先级，验证非核心功�?|
| P3 | 低优先级 | 验证边界条件、异常情�?|

### 3.3 准入准出标准

**准入标准**:
- 测试环境可用
- API文档齐全
- 测试用例已评�?- 测试数据已准�?
**准出标准**:
- 所有P0用例通过
- 所有P1用例通过率≥95%
- 无阻塞性缺�?
---

## 4. 测试用例设计

### 4.1 认证模块测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先�?|
|-------|---------|------|------|---------|--------------|--------------|-------|
| TC-AUTH-001 | 正常登录-邮箱密码正确 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "{{auth.email}}", "password": "{{auth.password}}"}` | P0 |
| TC-AUTH-002 | 登录失败-密码错误 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "{{auth.email}}", "password": "WrongPassword123"}` | P0 |
| TC-AUTH-003 | 登录失败-用户不存�?| POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "nonexistent@example.com", "password": "AnyPassword123"}` | P1 |
| TC-AUTH-004 | 登录失败-邮箱为空 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "", "password": "admin123"}` | P1 |
| TC-AUTH-005 | 登录失败-密码为空 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "{{auth.email}}", "password": ""}` | P1 |
| TC-AUTH-006 | 登录失败-邮箱格式错误 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "not-an-email", "password": "admin123"}` | P2 |
| TC-AUTH-007 | MFA登录-验证码正�?| POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "{{auth.email}}", "password": "{{auth.password}}", "mfa_code": "123456"}` | P1 |
| TC-AUTH-008 | MFA登录-验证码错�?| POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "{{auth.email}}", "password": "{{auth.password}}", "mfa_code": "000000"}` | P1 |
| TC-AUTH-009 | Token过期后访问需认证API | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json; Authorization: Bearer expired_token_here | - | `{"email": "{{auth.email}}", "password": "{{auth.password}}"}` | P0 |
| TC-AUTH-010 | 无Token访问需认证接口 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "{{auth.email}}", "password": "{{auth.password}}"}` | P0 |
| TC-AUTH-011 | 连续5次密码错误后登录 | POST | /hashrate/admin/auth/v1/login/password | Content-Type: application/json | - | `{"email": "{{auth.email}}", "password": "WrongPass1"}` (重复5次) | P1 |

### 4.2 管理员账户模块测试用�?
| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先�?|
|-------|---------|------|------|---------|--------------|--------------|-------|
| TC-ACCT-001 | 获取当前管理员信�?| GET | /hashrate/admin/account/v1/users/me | Authorization: Bearer {token} | - | - | P0 |
| TC-ACCT-002 | 获取管理员列�?无参�?| GET | /hashrate/admin/account/v1/users | Authorization: Bearer {token} | - | - | P0 |
| TC-ACCT-003 | 获取管理员列�?邮箱筛�?| GET | /hashrate/admin/account/v1/users | Authorization: Bearer {token} | email=admin@admin.com | - | P1 |
| TC-ACCT-004 | 获取管理员列�?分页 | GET | /hashrate/admin/account/v1/users | Authorization: Bearer {token} | page=1&size=10 | - | P1 |
| TC-ACCT-005 | 新增管理�?正常 | POST | /hashrate/admin/account/v1/users/create | Authorization: Bearer {token}; Content-Type: application/json | - | `{"email": "newadmin@admin.com", "name": "新管理员", "password": "Newadmin123", "role_ids": [1]}` | P0 |
| TC-ACCT-006 | 新增管理�?邮箱重复 | POST | /hashrate/admin/account/v1/users/create | Authorization: Bearer {token}; Content-Type: application/json | - | `{"email": "existing@example.com", "name": "重复管理�?, "password": "admin123", "role_ids": [1]}` | P1 |
| TC-ACCT-007 | 新增管理�?参数缺失 | POST | /hashrate/admin/account/v1/users/create | Authorization: Bearer {token}; Content-Type: application/json | - | `{"email": "incomplete@example.com"}` | P1 |
| TC-ACCT-008 | 启用管理�?| POST | /hashrate/admin/account/v1/users/enable | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": 2}` | P0 |
| TC-ACCT-009 | 禁用管理�?| POST | /hashrate/admin/account/v1/users/disable | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": 2}` | P0 |
| TC-ACCT-010 | 修改密码-正常 | POST | /hashrate/admin/account/v1/users/password/change | Authorization: Bearer {token}; Content-Type: application/json | - | `{"email": "{{auth.email}}", "old_password": "{{auth.password}}", "new_password": "NewPass@123"}` | P0 |
| TC-ACCT-011 | 修改密码-旧密码错�? | POST | /hashrate/admin/account/v1/users/password/change | Authorization: Bearer {token}; Content-Type: application/json | - | `{"email": "{{auth.email}}", "old_password": "WrongOldPass", "new_password": "NewPass@123"}` | P1 |
| TC-ACCT-012 | 查询管理员角�?| GET | /hashrate/admin/account/v1/admins/roles/get | Authorization: Bearer {token} | admin_id=2 | - | P1 |
| TC-ACCT-013 | 设置管理员角�?| POST | /hashrate/admin/account/v1/admins/roles/set | Authorization: Bearer {token}; Content-Type: application/json | - | `{"admin_id": 2, "role_ids": [1, 2]}` | P1 |
| TC-ACCT-014 | 获取角色列表 | GET | /hashrate/admin/account/v1/roles/list | Authorization: Bearer {token} | - | - | P1 |
| TC-ACCT-015 | 创建角色-正常 | POST | /hashrate/admin/account/v1/roles/create | Authorization: Bearer {token}; Content-Type: application/json | - | `{"name": "新角�?, "description": "测试角色", "perms": ["user:view", "user:edit"]}` | P1 |
| TC-ACCT-016 | 更新角色 | POST | /hashrate/admin/account/v1/roles/update | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": 5, "name": "更新角色", "description": "更新描述", "perms": ["user:view"]}` | P1 |
| TC-ACCT-017 | 删除角色 | POST | /hashrate/admin/account/v1/roles/delete | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": 5}` | P1 |
| TC-ACCT-018 | 获取角色权限�?| GET | /hashrate/admin/account/v1/roles/perms/tree | Authorization: Bearer {token} | role_id=1 | - | P1 |
| TC-ACCT-019 | 获取权限列表 | GET | /hashrate/admin/account/v1/perms/list | Authorization: Bearer {token} | - | - | P1 |
| TC-ACCT-020 | 获取当前管理员权限树 | GET | /hashrate/admin/account/v1/perms/me | Authorization: Bearer {token} | - | - | P1 |
| TC-ACCT-021 | 全量新增权限 | POST | /hashrate/admin/account/v1/perms/init | Authorization: Bearer {token}; Content-Type: application/json | - | `{"list": [{"key": "/new/path", "title": "新权�?, "perms": "new:perm"}]}` | P2 |
| TC-ACCT-022 | 生成MFA密钥 | GET | /hashrate/admin/account/v1/mfa/generate | Authorization: Bearer {token} | - | - | P1 |
| TC-ACCT-023 | 开启MFA | POST | /hashrate/admin/account/v1/mfa/enable | Authorization: Bearer {token}; Content-Type: application/json | - | `{"code": "123456"}` | P1 |
| TC-ACCT-024 | 关闭MFA | POST | /hashrate/admin/account/v1/mfa/disable | Authorization: Bearer {token}; Content-Type: application/json | - | `{"code": "123456"}` | P1 |
| TC-ACCT-025 | 普通管理员访问超管API | POST | /hashrate/admin/account/v1/users/create | Authorization: Bearer {user_token}; Content-Type: application/json | - | `{"email": "newadmin@admin.com", "name": "新管理员", "password": "admin123", "role_ids": [1]}` | P0 |
| TC-ACCT-026 | Token刷新机制测试 | GET | /hashrate/admin/account/v1/users/me | Authorization: Bearer {refreshed_token} | - | - | P1 |
| TC-ACCT-027 | 分页参数page=0 | GET | /hashrate/admin/account/v1/users | Authorization: Bearer {token} | page=0 | - | P1 |
| TC-ACCT-028 | 分页参数page=-1 | GET | /hashrate/admin/account/v1/users | Authorization: Bearer {token} | page=-1 | - | P1 |
| TC-ACCT-029 | 分页参数size=0 | GET | /hashrate/admin/account/v1/users | Authorization: Bearer {token} | size=0 | - | P1 |
| TC-ACCT-030 | 分页参数size超限(99999) | GET | /hashrate/admin/account/v1/users | Authorization: Bearer {token} | size=99999 | - | P2 |
| TC-ACCT-031 | 删除已分配用户的角色 | POST | /hashrate/admin/account/v1/roles/delete | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": 1}` | P1 |
| TC-ACCT-032 | 创建密码为空的管理员 | POST | /hashrate/admin/account/v1/users/create | Authorization: Bearer {token}; Content-Type: application/json | - | `{"email": "empty@example.com", "name": "空密码管理员", "password": "", "role_ids": [1]}` | P1 |
| TC-ACCT-033 | 创建密码过短(3字符)的管理员 | POST | /hashrate/admin/account/v1/users/create | Authorization: Bearer {token}; Content-Type: application/json | - | `{"email": "short@example.com", "name": "短密码管理员", "password": "abc", "role_ids": [1]}` | P2 |
| TC-ACCT-034 | 创建密码强度�?纯数�?的管理员 | POST | /hashrate/admin/account/v1/users/create | Authorization: Bearer {token}; Content-Type: application/json | - | `{"email": "weak@example.com", "name": "弱密码管理员", "password": "12345678", "role_ids": [1]}` | P2 |

### 4.3 公告管理模块测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先�?|
|-------|---------|------|------|---------|--------------|--------------|-------|
| TC-ANN-001 | 获取公告列表 | GET | /hashrate/admin/announcement/v1/list | Authorization: Bearer {token} | page=1&size=20 | - | P0 |
| TC-ANN-002 | 创建公告-正常 | POST | /hashrate/admin/announcement/v1/create | Authorization: Bearer {token}; Content-Type: application/json | - | `{"title": "测试公告", "content": "这是一条测试公告内�?, "is_open": 1}` | P0 |
| TC-ANN-003 | 创建公告-参数缺失 | POST | /hashrate/admin/announcement/v1/create | Authorization: Bearer {token}; Content-Type: application/json | - | `{"title": "缺少内容"}` | P1 |
| TC-ANN-004 | 修改公告 | POST | /hashrate/admin/announcement/v1/update | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": 1, "title": "更新标题", "content": "更新内容", "is_open": 1}` | P0 |
| TC-ANN-005 | 删除公告 | POST | /hashrate/admin/announcement/v1/delete | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": 1}` | P0 |
| TC-ANN-006 | 修改公告开关状�?| POST | /hashrate/admin/announcement/v1/status/update | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": 1, "is_open": 0}` | P1 |
| TC-ANN-007 | 创建公告-内容超长(>10000字符) | POST | /hashrate/admin/announcement/v1/create | Authorization: Bearer {token}; Content-Type: application/json | - | `{"title": "超长公告", "content": "{'a':1}".repeat(5000)}` | P2 |

### 4.4 算力管理模块测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先�?|
|-------|---------|------|------|---------|--------------|--------------|-------|
| TC-HASH-001 | 获取算力币值列�?| GET | /hashrate/admin/v1/coin/value/list | Authorization: Bearer {token} | - | - | P0 |
| TC-HASH-002 | 新增/保存算力币�?| POST | /hashrate/admin/v1/coin/value/upsert | Authorization: Bearer {token}; Content-Type: application/json | - | `{"seq": 1, "coin": "ETH", "amount": 2500.00}` | P0 |
| TC-HASH-003 | 删除算力币�?| POST | /hashrate/admin/v1/coin/value/delete | Authorization: Bearer {token}; Content-Type: application/json | - | `{"coin": "ETH"}` | P1 |
| TC-HASH-004 | 获取币值审核列�?| GET | /hashrate/admin/v1/coin/value/audit/list | Authorization: Bearer {token} | coin=ETH&status=-1&page=1&size=20 | - | P1 |
| TC-HASH-005 | 申请修改币�?| POST | /hashrate/admin/v1/coin/value/audit/apply | Authorization: Bearer {token}; Content-Type: application/json | - | `{"coin": "ETH", "amount": 2600.00}` | P1 |
| TC-HASH-006 | 审核通过币值修�?| POST | /hashrate/admin/v1/coin/value/audit/approve | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": 1, "status": 1, "remark": "审核通过"}` | P1 |
| TC-HASH-007 | 审核拒绝币值修�?| POST | /hashrate/admin/v1/coin/value/audit/approve | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": 2, "status": 2, "remark": "币值不合理"}` | P1 |
| TC-HASH-008 | 撤销币值修改申�?| POST | /hashrate/admin/v1/coin/value/audit/revoke | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": 3}` | P1 |
| TC-HASH-009 | 获取算力单价档位列表 | GET | /hashrate/admin/v1/power/unitprice/grade/list | Authorization: Bearer {token} | - | - | P1 |
| TC-HASH-010 | 新增/保存算力单价档位 | POST | /hashrate/admin/v1/power/unitprice/grade/upsert | Authorization: Bearer {token}; Content-Type: application/json | - | `{"level": 1, "usdt_amount": 100.00, "power_amount": 10.00}` | P1 |
| TC-HASH-011 | 删除算力单价档位 | POST | /hashrate/admin/v1/power/unitprice/grade/delete | Authorization: Bearer {token}; Content-Type: application/json | - | `{"level": 1}` | P1 |
| TC-HASH-012 | 获取锁仓设置 | GET | /hashrate/admin/v1/lock/setting/get | Authorization: Bearer {token} | coin=ETH | - | P1 |
| TC-HASH-013 | 设置锁仓 | POST | /hashrate/admin/v1/lock/setting/set | Authorization: Bearer {token}; Content-Type: application/json | - | `{"coin": "ETH", "days": 30, "lock_ratio": 0.3}` | P1 |
| TC-HASH-014 | 获取算力发放记录列表 | GET | /hashrate/admin/v1/recharge/release/list | Authorization: Bearer {token} | user_id=10001&page=1&size=20&coin=Hashrate | - | P1 |
| TC-HASH-015 | 获取USDT和Point发放记录 | GET | /hashrate/admin/v1/asset/release/list | Authorization: Bearer {token} | user_id=10001&coin=Usdt&page=1&size=20 | - | P1 |
| TC-HASH-016 | 审核状�?重复审核已通过记录 | POST | /hashrate/admin/v1/coin/value/audit/approve | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": 1, "status": 1, "remark": "重复审核"}` | P1 |
| TC-HASH-017 | 审核状�?审核已拒绝记�?| POST | /hashrate/admin/v1/coin/value/audit/approve | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": 2, "status": 1, "remark": "重新通过"}` | P1 |

### 4.5 用户管理模块测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先�?|
|-------|---------|------|------|---------|--------------|--------------|-------|
| TC-USER-001 | 获取用户列表 | GET | /hashrate/user/admin/v1/list | Authorization: Bearer {token} | page=1&size=20 | - | P0 |
| TC-USER-002 | 用户列表-UID搜索 | GET | /hashrate/user/admin/v1/list | Authorization: Bearer {token} | key=10001 | - | P1 |
| TC-USER-003 | 用户列表-钱包地址搜索 | GET | /hashrate/user/admin/v1/list | Authorization: Bearer {token} | key=0x1234567890abcdef1234567890abcdef12345678 | - | P1 |
| TC-USER-004 | 获取用户收益详情 | GET | /hashrate/user/admin/v1/income/detail | Authorization: Bearer {token} | user_id=10001 | - | P1 |
| TC-USER-005 | 获取每日发放记录 | GET | /hashrate/user/admin/v1/release/history | Authorization: Bearer {token} | user_id=10001&page=1&size=20 | - | P1 |
| TC-USER-006 | 为用户发放算�?| POST | /hashrate/user/admin/v1/recharge/hashrate | Authorization: Bearer {token}; Content-Type: application/json | - | `{"walletAddress": "0x1234567890abcdef1234567890abcdef12345678", "amount": 100}` | P0 |
| TC-USER-007 | 用户充值任意算�?| POST | /hashrate/user/admin/v1/recharge/hashrate/any | Authorization: Bearer {token}; Content-Type: application/json | - | `{"walletAddress": "0x1234567890abcdef1234567890abcdef12345678", "amount": 50, "desc": "测试充�?}` | P1 |
| TC-USER-008 | 用户发放点券 | POST | /hashrate/user/admin/v1/recharge/coupon | Authorization: Bearer {token}; Content-Type: application/json | - | `{"walletAddress": "0x1234567890abcdef1234567890abcdef12345678", "amount": 100, "desc": "点券发放"}` | P1 |
| TC-USER-009 | 扣除用户算力 | POST | /hashrate/user/admin/v1/deduct/hashrate | Authorization: Bearer {token}; Content-Type: application/json | - | `{"walletAddress": "0x1234567890abcdef1234567890abcdef12345678", "amount": 10}` | P1 |
| TC-USER-010 | 扣除算力-余额不足 | POST | /hashrate/user/admin/v1/deduct/hashrate | Authorization: Bearer {token}; Content-Type: application/json | - | `{"walletAddress": "0x1234567890abcdef1234567890abcdef12345678", "amount": 999999}` | P1 |
| TC-USER-011 | 冻结用户收益 | POST | /hashrate/user/admin/v1/status/update | Authorization: Bearer {token}; Content-Type: application/json | - | `{"userId": "10001", "status": 1}` | P1 |
| TC-USER-012 | 解冻用户收益 | POST | /hashrate/user/admin/v1/status/update | Authorization: Bearer {token}; Content-Type: application/json | - | `{"userId": "10001", "status": 0}` | P1 |
| TC-USER-013 | 钱包地址格式错误-过短 | GET | /hashrate/user/admin/v1/list | Authorization: Bearer {token} | key=0x1234 | - | P1 |
| TC-USER-014 | 钱包地址格式错误-非法字符 | GET | /hashrate/user/admin/v1/list | Authorization: Bearer {token} | key=0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ | - | P1 |
| TC-USER-015 | user_id不存在时查询收益 | GET | /hashrate/user/admin/v1/income/detail | Authorization: Bearer {token} | user_id=99999999 | - | P1 |
| TC-USER-016 | 用户列表-key参数多条件组�?| GET | /hashrate/user/admin/v1/list | Authorization: Bearer {token} | key=10001&page=1&size=10 | - | P2 |

### 4.6 订单管理模块测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先�?|
|-------|---------|------|------|---------|--------------|--------------|-------|
| TC-ORDER-001 | 获取订单列表 | GET | /hashrate/order/admin/v1/orders | Authorization: Bearer {token} | page=1&size=20 | - | P0 |
| TC-ORDER-002 | 订单列表-用户筛�?| GET | /hashrate/order/admin/v1/orders | Authorization: Bearer {token} | user_id=10001 | - | P1 |
| TC-ORDER-003 | 订单列表-分页 | GET | /hashrate/order/admin/v1/orders | Authorization: Bearer {token} | page=2&size=10 | - | P1 |

### 4.7 统计模块测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先�?|
|-------|---------|------|------|---------|--------------|--------------|-------|
| TC-STATS-001 | 获取平台仪表盘统�?| GET | /hashrate/stats/admin/v1/dashboard | Authorization: Bearer {token} | - | - | P0 |

### 4.8 提现管理模块测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先�?|
|-------|---------|------|------|---------|--------------|--------------|-------|
| TC-WD-001 | 获取提现申请列表 | GET | /hashrate/withdraw/admin/v1/apply/list | Authorization: Bearer {token} | page=1&size=20 | - | P0 |
| TC-WD-002 | 提现申请列表-状态筛�?| GET | /hashrate/withdraw/admin/v1/apply/list | Authorization: Bearer {token} | status=0 | - | P1 |
| TC-WD-003 | 提现申请列表-日期范围 | GET | /hashrate/withdraw/admin/v1/apply/list | Authorization: Bearer {token} | start_date=2024-01-01&end_date=2024-01-31 | - | P1 |
| TC-WD-004 | 同意提现申请 | POST | /hashrate/withdraw/admin/v1/apply/agree | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": "withdraw_123"}` | P0 |
| TC-WD-005 | 冻结提现申请 | POST | /hashrate/withdraw/admin/v1/apply/freeze | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": "withdraw_123"}` | P1 |
| TC-WD-006 | 解冻提现申请 | POST | /hashrate/withdraw/admin/v1/apply/unfreeze | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": "withdraw_123"}` | P1 |
| TC-WD-007 | 获取提现配置列表 | GET | /hashrate/withdraw/admin/v1/config/list | Authorization: Bearer {token} | - | - | P1 |
| TC-WD-008 | 设置提现配置 | POST | /hashrate/withdraw/admin/v1/config/set | Authorization: Bearer {token}; Content-Type: application/json | - | `{"coin": "ETH", "fee_amount": 1.00, "min_amount": 10.00}` | P1 |
| TC-WD-009 | 提现-重复同意已完成的提现 | POST | /hashrate/withdraw/admin/v1/apply/agree | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": "withdraw_completed_123"}` | P0 |
| TC-WD-010 | 提现-修改已完成提现状�?| POST | /hashrate/withdraw/admin/v1/apply/freeze | Authorization: Bearer {token}; Content-Type: application/json | - | `{"id": "withdraw_completed_123"}` | P0 |
| TC-WD-011 | 提现列表-status+coin组合筛�?| GET | /hashrate/withdraw/admin/v1/apply/list | Authorization: Bearer {token} | status=0&coin=ETH | - | P2 |
| TC-WD-012 | 提现列表-无效日期范围(start>end) | GET | /hashrate/withdraw/admin/v1/apply/list | Authorization: Bearer {token} | start_date=2024-01-31&end_date=2024-01-01 | - | P2 |

### 4.9 邀请管理模块测试用�?
| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先�?|
|-------|---------|------|------|---------|--------------|--------------|-------|
| TC-INV-001 | 获取邀请人详情列表 | GET | /hashrate/invite/admin/v1/details | Authorization: Bearer {token} | inviter_id=10001&page=1&size=20 | - | P1 |

### 4.10 客户端模块测试用�?
| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先�?|
|-------|---------|------|------|---------|--------------|--------------|-------|
| TC-CLIENT-001 | 获取所有公�?| GET | /hashrate/client/announcement/v1/list | - | - | - | P1 |
| TC-CLIENT-002 | 获取客户端配�?| GET | /hashrate/front/config/v1/config | - | - | - | P0 |

### 4.11 系统接口测试用例

| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先�?|
|-------|---------|------|------|---------|--------------|--------------|-------|
| TC-SYS-001 | 健康检�?| GET | /ping | - | - | - | P0 |

---

## 5. 测试数据设计

### 5.1 认证测试数据

| 账户类型 | email | password | 说明 |
|---------|-------|----------|------|
| 管理�?| admin@admin.com | admin123 | 测试用账�?|
| 无效用户 | nonexistent@example.com | AnyPass123! | 不存在的用户 |

### 5.2 币种枚举�?
| 币种代码 | 名称 |
|--------|------|
| ETH | Ethereum |
| DOGE | Dogecoin |
| LTC | Litecoin |
| RWA | Real World Asset |
| CSY | CSY�?|

### 5.3 状态枚举�?
| 状态类�?| �?| 说明 |
|--------|---|------|
| 用户状�?| 0 | 禁用 |
| 用户状�?| 1 | 启用 |
| 公告开�?| 0 | 关闭 |
| 公告开�?| 1 | 开�?|
| 收益状�?| 0 | 正常 |
| 收益状�?| 1 | 冻结 |
| 提现状�?| -1 | 全部 |
| 提现状�?| 0 | 审核�?|
| 提现状�?| 1 | 已完�?|
| 提现状�?| 2 | 已拒�?|
| 审核状�?| -1 | 全部 |
| 审核状�?| 0 | 待审�?|
| 审核状�?| 1 | 通过 |
| 审核状�?| 2 | 拒绝 |
| 审核状�?| 3 | 撤销 |

### 5.4 边界值测试数�?
| 参数类型 | 最小�?| 正常�?| 最大�?| 超限测试 |
|---------|-------|--------|-------|---------|
| page | 1 | 1 | - | 0, -1 |
| size | 1 | 20 | - | 0, -1, 1000 |
| lock_ratio | 0 | 0.5 | 1 | -0.1, 1.1 |
| amount | 0 | 100 | - | -1, 999999999 |

---

## 6. 风险评估

### 6.1 高风险项

| 风险�?| 风险描述 | 影响 | 缓解措施 |
|-------|---------|------|---------|
| 财务操作 | 算力充�?扣除、提现审批涉及资�?| �?| P0级别测试，优先执�?|
| 权限控制 | MFA、角色权限控制不严可能导致安全问�?| �?| 安全测试用例覆盖 |
| 数据一致�?| 币值修改、锁仓设置影响用户收益计�?| �?| 业务逻辑测试覆盖 |

### 6.2 中风险项

| 风险�?| 风险描述 | 影响 | 缓解措施 |
|-------|---------|------|---------|
| 分页参数 | 分页参数校验不严可能导致数据泄露 | �?| 边界值测试覆�?|
| 筛选参�?| SQL注入风险 | �?| 参数格式校验测试 |
| 审核流程 | 币值审核、提现审批流程不完整 | �?| 业务逻辑测试覆盖 |

### 6.3 低风险项

| 风险�?| 风险描述 | 影响 | 缓解措施 |
|-------|---------|------|---------|
| 公告管理 | 非核心功能，影响较小 | �?| 标准功能测试 |
| 邀请管�?| 非核心功能，影响较小 | �?| 标准功能测试 |

---

## 7. 测试时间�?
### 7.1 估算依据

| 模块 | API数量 | 原用例数 | 新增用例�?| 补充后用例数 | 预计时间(分钟) |
|-----|-------|---------|---------|------------|--------------|
| 认证模块 | 1 | 8 | 3 | 11 | 15 |
| 管理员账�?| 19 | 24 | 10 | 34 | 50 |
| 公告管理 | 5 | 6 | 1 | 7 | 12 |
| 算力管理 | 14 | 15 | 2 | 17 | 28 |
| 用户管理 | 8 | 12 | 4 | 16 | 26 |
| 订单管理 | 1 | 3 | 0 | 3 | 5 |
| 统计模块 | 1 | 1 | 0 | 1 | 3 |
| 提现管理 | 6 | 8 | 4 | 12 | 22 |
| 邀请管�?| 1 | 1 | 0 | 1 | 3 |
| 客户端模�?| 2 | 2 | 0 | 2 | 5 |
| 系统接口 | 1 | 1 | 0 | 1 | 2 |
| **合计** | **59** | **81** | **24** | **105** | **171** |

### 7.2 测试阶段安排

| 阶段 | 内容 | 用例�?| 预计时间 |
|------|------|--------|---------|
| 阶段一 | 认证模块 + 系统接口 | 12 | 18分钟 |
| 阶段�?| 管理员账户模�?| 34 | 50分钟 |
| 阶段�?| 公告管理 + 客户端模�?| 9 | 17分钟 |
| 阶段�?| 算力管理模块 | 17 | 28分钟 |
| 阶段�?| 用户管理 + 订单管理 | 19 | 31分钟 |
| 阶段�?| 统计 + 提现 + 邀请模�?| 14 | 27分钟 |
| **总计** | | **105** | **171分钟 (~2.9小时)** |

---

## 8. 测试环境要求

### 8.1 环境配置

| 环境 | URL | 说明 |
|------|-----|------|
| 测试环境 | http://192.168.1.36:8999 | API服务地址 |
| 本地 | localhost | 开发测�?|

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
| 401 | 未授�?认证失败 |
| 403 | 权限不足 |
| 404 | 资源不存�?|
| 422 | 请求格式正确但语义错�?|
| 500 | 服务器内部错�?|

### 9.2 错误响应格式

```json
{
  "error": "错误描述",
  "code": "错误�?
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

| 版本 | 日期 | 修改�?| 修改内容 |
|------|------|--------|---------|
| 1.0 | 2026-04-02 | 测试经理 | 初始版本 |
| 1.1 | 2026-04-02 | 测试审核�?| 补充审核报告中的22个遗漏用例，新增安全测试、边界值测试、业务逻辑测试 |

# PayFields 集成指南

## 1. 目标

本文档用于向接手的研发工程师说明 PayFields 的通用接入方式、初始化顺序、安全边界、错误处理和测试建议。

本文档刻意不依赖任何具体仓库结构，适合作为交接材料或独立技术说明。

## 2. 什么是 PayFields

PayFields 是支付平台提供的前端安全输入组件，通常以跨域 iframe 的方式承载以下敏感字段：

- 卡号
- 有效期
- CVV

这些敏感字段由 PayFields 直接提交到支付平台，不经过业务服务端，因此可以降低 PCI 合规压力。

## 3. 核心原则

- 敏感卡数据不能经过业务后端。
- 后端只负责创建短时有效的会话，例如 `txnSession`。
- 前端负责加载 SDK、渲染输入容器、初始化 SDK、处理成功和失败回调。
- 支付成功后的业务逻辑，例如订单更新、订阅绑定、发票生成，应放在支付完成之后处理。
- 不要依赖前端自行推断支付结果，必须以 SDK 回调或支付平台返回结果为准。

## 4. SDK 地址

PayFields SDK 的常用地址如下：

### 测试环境

```html
<script src="https://test-api.payrix.com/payFieldsScript"></script>
```

### 生产环境

```html
<script src="https://api.payrix.com/payFieldsScript"></script>
```

如果你的页面需要单页应用模式，通常会使用带 `?spa=1` 的形式：

### 测试环境（SPA）

```html
<script src="https://test-api.payrix.com/payFieldsScript?spa=1"></script>
```

### 生产环境（SPA）

```html
<script src="https://api.payrix.com/payFieldsScript?spa=1"></script>
```

## 5. 整体接入流程

标准接入流程如下：

1. 用户打开支付或存卡页面。
2. 前端请求业务后端创建 `txnSession`。
3. 业务后端调用支付平台接口创建短时 session。
4. 后端返回 `txnSessionKey`、商户信息及必要上下文。
5. 前端加载 PayFields SDK。
6. 前端配置 `PayFields.config`。
7. 前端渲染卡号、有效期、CVV 的 iframe 容器。
8. 前端调用 `PayFields.ready()` 初始化。
9. 用户填写卡信息并点击提交。
10. PayFields 直接向支付平台提交敏感数据。
11. 前端在 `onSuccess` / `onFailure` 中处理结果。
12. 如果成功，前端或后端继续完成订单、订阅、发票等业务动作。

## 6. 前后端职责划分

### 后端职责

- 创建 `txnSession`
- 校验发起支付或存卡的权限
- 返回 merchant、login、invoice、order、subscription 等业务上下文
- 在支付成功后执行后续业务逻辑
- 记录日志与审计信息

### 后端不应做的事

- 接收卡号、CVV、有效期明文
- 自己拼装卡信息调用 tokenization 接口
- 让前端直接控制核心支付权限而不经过后端约束

### 前端职责

- 动态加载 SDK
- 确保 iframe 容器已挂载到 DOM
- 配置 `PayFields.config`
- 调用 `PayFields.ready()`
- 触发 `PayFields.submit()`
- 展示加载状态、成功状态和失败状态
- 处理成功或失败回调

## 7. 初始化顺序

PayFields 最容易出错的地方就是初始化顺序。推荐顺序如下：

1. 获取 `txnSessionKey`
2. 加载依赖脚本，例如 jQuery（如果 SDK 仍依赖）
3. 加载 PayFields SDK
4. 确认卡号、有效期、CVV 的容器元素已经在 DOM 中
5. 设置 `PayFields.config`
6. 设置 `PayFields.fields`
7. 注册 `onSuccess` / `onFailure`
8. 在页面完成一次渲染后调用 `PayFields.ready()`

建议：

- `ready()` 只调用一次
- 不要在 DOM 容器未出现时调用 `ready()`
- 不要在 SDK 还未加载完成时提前写入初始化逻辑

## 8. 常见配置项

通常至少需要以下配置：

- `apiKey`
- `txnSessionKey`
- `merchant`
- `mode`

常见附加配置：

- `txnType`
- `amount`
- `invoiceResult`
- `orderResult`
- `customer`

示例：

```js
window.PayFields.config.apiKey = apiKey;
window.PayFields.config.txnSessionKey = txnSessionKey;
window.PayFields.config.merchant = merchantId;
window.PayFields.config.mode = "token";
```

支付场景通常还会增加：

```js
window.PayFields.config.txnType = "sale";
window.PayFields.config.amount = String(amountInCents);
```

## 9. 常见模式

### 存卡模式

```js
window.PayFields.config.mode = "token";
```

适用于：

- 仅保存支付卡
- 不立即发起扣款

### 支付模式

```js
window.PayFields.config.mode = "txn";
window.PayFields.config.txnType = "sale";
window.PayFields.config.amount = String(amountInCents);
```

适用于：

- 立即发起支付

### 支付并保存卡

某些系统会有类似 `txnToken` 的扩展模式，语义通常是：

- 发起交易
- 同时保存 token

是否支持该模式取决于具体平台和当前业务实现，必须以平台文档和实际回调结果为准。

## 10. 字段容器要求

PayFields 通常会自动将以下容器替换为安全 iframe：

```html
<div id="payFields-ccnumber"></div>
<div id="payFields-ccexp"></div>
<div id="payFields-cvv"></div>
```

字段配置通常类似：

```js
window.PayFields.fields = [
  { type: "number", element: "#payFields-ccnumber" },
  { type: "expiration", element: "#payFields-ccexp" },
  { type: "cvv", element: "#payFields-cvv" },
];
```

要求：

- 容器元素必须已经存在于 DOM
- 容器应有明确尺寸
- 初始化前不要隐藏或销毁这些容器

## 11. Customer 处理建议

Customer 的处理方式取决于 SDK 能力和平台文档。

如果 SDK 明确支持通过对象自动创建 customer，可以在提交前设置：

```js
window.PayFields.config.customer = {
  first: firstName,
  last: lastName,
  email: email,
};
```

如果文档没有明确说明支持对象写法，建议使用更保守的方式：

1. 后端先创建 customer
2. 前端只把 customer ID 传给 PayFields

例如：

```js
window.PayFields.config.customer = customerId;
```

交接时必须写清楚当前项目采用的是哪一种方案，不要让后续工程师猜。

## 12. 回调处理

### 成功回调

```js
window.PayFields.onSuccess = function (response) {
  console.log(response);
};
```

成功回调建议只做以下事情：

- 提取 token、transaction 或 payment 结果
- 更新页面状态
- 调用后端完成后续业务写入
- 跳转到确认页或成功页

### 前端成功后如何获取 token

这是交接时最容易混淆的点之一：`onSuccess` 返回的内容是否直接包含 token，取决于当前使用的 `mode`。

#### 情况 1：存卡模式 `mode = "token"`

在纯存卡模式下，成功回调通常直接返回 token 结果。前端应优先从 `response.data[0]` 中读取 token 对象。

示例：

```js
window.PayFields.onSuccess = function (response) {
  const token = response?.data?.[0];
  if (!token) {
    throw new Error("No token returned from PayFields");
  }

  console.log("token id:", token.id);
  console.log("token hash:", token.token);
};
```

此时通常可以直接获得：

- `token.id`
- `token.token`
- 卡品牌、末四位、有效期等附加信息

建议做法：

- 前端立即保存 `token.id` 作为后续跳转或展示使用
- 如果后端后续逻辑依赖 token，可将 `token.id` 或 `token.token` 传给后端
- 不要假设返回结构永远稳定，接入时要打印一次完整 response 样例

#### 情况 2：支付模式 `mode = "txn"`

在支付模式下，成功回调返回的通常是交易结果，不一定直接返回 token 对象。

此时前端不能默认认为 `response.data[0]` 就是 token，而应该先判断它是否是 transaction。

常见做法是：

1. 从成功回调中拿到 transaction id 或 transaction 数据
2. 从 transaction 中读取 token 相关字段，例如 token hash 或 token 引用
3. 如有必要，再调用后端或平台接口去查询对应 token

示例：

```js
window.PayFields.onSuccess = async function (response) {
  const txn = response?.data?.[0];
  if (!txn) {
    throw new Error("No transaction returned from PayFields");
  }

  const txnId = txn.id;
  const tokenRef = txn.token;

  console.log("txn id:", txnId);
  console.log("token ref:", tokenRef);
};
```

如果支付平台返回的是：

- transaction id
- token hash
- token reference

而不是完整 token 对象，那么推荐做法是：

1. 前端把 transaction id 或 token reference 传给后端
2. 后端调用平台查询接口
3. 后端解析并返回标准化 token 信息

不建议前端直接写死“通过某个字段一定能拿到完整 token”，因为不同模式和不同平台返回结构可能不同。

#### 情况 3：支付并保存卡

如果当前模式是“支付并同时保存卡”，成功回调通常仍然以交易结果为主，而不是直接给完整 token。

推荐处理方式与支付模式一致：

- 先拿 transaction
- 再从 transaction 中解析 token 引用
- 再查询 token 详情

#### 推荐的统一处理策略

为了减少歧义，建议团队统一采用以下规则：

- 如果是 `mode = "token"`，将成功结果按 token 处理
- 如果是交易类模式，将成功结果按 transaction 处理
- token 是否存在、如何取到，不要靠字段名猜测，必须根据实际 response 样例确认
- 如果业务链路后面必须依赖完整 token 信息，优先由后端补查并标准化返回

#### 推荐的数据流

推荐前端在成功后只做轻量处理：

1. 识别当前 mode
2. 提取 `token.id` 或 `txn.id`
3. 跳转到确认页，携带必要参数
4. 在确认页或后端接口中补查完整 token

这样做的好处是：

- 降低前端对第三方返回结构的耦合
- 避免把 transaction 当 token
- 便于后端统一兜底处理不同环境、不同模式下的返回差异

### 失败回调

```js
window.PayFields.onFailure = function (response) {
  console.error(response);
};
```

失败回调建议：

- 展示平台返回的错误消息
- 恢复按钮状态
- 允许用户重试
- 如果是 session 过期，提示重新创建 session

## 13. 提交前校验

在调用 `PayFields.submit()` 之前，建议至少校验：

- SDK 已经加载完成
- `PayFields.ready()` 已执行完成
- 页面业务必填字段已填写，例如 email
- 当前 session 未过期

同时，提交按钮应在以下情况禁用：

- SDK 未 ready
- 当前正在提交
- 必填业务信息不完整

## 14. 安全注意事项

- `txnSessionKey` 必须短时有效
- 应限制 session 的使用次数和成功次数
- 不要在日志里记录完整卡号、CVV、有效期
- 不要把前端回调中的敏感信息直接持久化
- 前端页面应明确说明卡数据由安全支付组件直接处理

需要特别说明的一点是：

- `txnSessionKey` 不是长期凭证
- `apiKey` 也不是 `txnSessionKey` 的替代品
- 在某些平台里，前端可能需要同时使用 `apiKey` 和 `txnSessionKey`

这类设计是否可接受，取决于你的系统定位。如果是内部测试工具，风险通常可接受；如果是面向公众的大规模生产系统，应额外评估暴露面和权限边界。

## 15. 常见故障点

最常见的问题包括：

- SDK 地址写错
- 使用了错误环境的 SDK 地址
- SDK 未加载完成就开始初始化
- `ready()` 调用太早
- `ready()` 重复调用
- DOM 容器不存在或尺寸异常
- `txnSession` 已过期
- 金额单位错误，把元当成分或把分当成元
- 把交易结果误当 token
- 把 token 结果误当交易结果
- `mode` 与后续业务处理逻辑不一致

## 16. 错误处理建议

建议按三类错误处理：

### 会话错误

例如：

- `txnSession` 创建失败
- `txnSession` 过期
- `txnSession` 使用次数超限

处理方式：

- 提示重新创建 session
- 阻止继续提交

### SDK 错误

例如：

- SDK 脚本加载失败
- 初始化失败
- iframe 未 ready

处理方式：

- 提示刷新页面或重新初始化
- 打印详细日志，便于定位

### 业务错误

例如：

- 支付成功，但订单更新失败
- 支付成功，但订阅绑定失败
- 支付成功，但发票生成失败

处理方式：

- 不要重复扣款
- 保留支付成功结果
- 将失败限制在后续业务步骤里
- 使用补偿机制或人工处理

## 17. 测试建议

不要把真实跨域 iframe 的自动化输入当作主测试手段。更合理的测试分层如下：

### 单元测试

- 测试前端状态切换
- 测试参数组装
- 测试回调处理逻辑

### 集成测试

- 测试后端 `txnSession` 创建接口
- 测试 session 参数是否合法

### E2E 测试

- 验证支付页面是否可进入
- 验证容器是否渲染
- 验证 SDK 加载状态
- 验证按钮 enable/disable 逻辑
- 验证成功和失败页面跳转

### 手工测试

- 真实卡录入流程
- 存卡流程
- 支付流程
- session 过期后的恢复流程

由于 PayFields 往往是跨域 iframe，自动化框架通常无法稳定操作其内部字段，所以真实支付链路仍需要手工验证或 mock 回调补充覆盖。

## 18. 交接时必须写清楚的内容

建议在项目交接文档中明确以下信息：

- SDK 地址
- 测试环境与生产环境地址
- 是否使用 `?spa=1`
- `txnSession` 的创建接口
- `txnSession` 的有效期和次数限制
- 当前支持哪些 `mode`
- 成功回调返回的是 token 还是 transaction
- 金额单位约定
- customer 是前置创建还是由 SDK 自动创建
- 支付成功后的后置业务动作
- 哪些链路依赖手工验证

## 19. 推荐的一句话规范

建议统一采用以下原则：

> 后端只创建短时 session，前端只负责加载 PayFields 和处理回调，卡数据永远不进入业务服务端，支付成功后的业务处理放在支付完成之后进行。

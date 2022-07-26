# alipay-qrcode-get-cookies
支付宝扫码登录获取cookie

### 启动服务
- **执行命令：** node .
- **默认服务地址：** http://127.0.0.1:3005


### 1.1 获取二维码
- **接口说明：** 生成任务
- **接口地址：** /api/create

#### 1.1.1 返回结果

参数名称					|类型		|描述  
:----						|:---			|:---	
code						|int			|响应码
image							|string			|二维码图片
id						|string			|任务id
tasks				|int		|后台任务数量

示例：

```
{
    "code": 1,
    "image": "data:image/png;base64,xxxx",
    "id": "efbd3415-d2db-14cd-4dbf-3b72f6c483ff",
    "tasks": 1
}
```


### 1.2 获取Cookie
- **接口说明：** 获取状态
- **接口地址：** /api/status/:id

#### 1.2.1 请求参数
  
参数名称						|类型			|描述  
:----						|:---			|:---	
id						|string		|任务id

#### 1.2.2 返回结果

参数名称					|类型		|描述  
:----						|:---			|:---	
code						|int			|响应码
state							|string			|二维码状态
cookies						|string			|cookies
tasks				|int		|后台任务数量

示例：

```
{
    "code": 1,
    "state": "confirmed",
    "cookies": "ALIPAYJSESSIONID=xxxx;ctoken=xxx;",
    "tasks": 0
}
```

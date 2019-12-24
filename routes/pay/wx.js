let express = require('express')
let request = require('request');
let config =  require('./config')
let common = require('./../common/index')
let util = require('./../../util/index')
let createHash = require('create-hash') // 加密算法
let cache =require('memory-cache')
let dao = require('./../common/db1')
let wxpay = require('./../common/wxpay')
let xml = require('xml2js') // xml 转 json

config = config.wx
let router = express.Router();

router.get('/test', function(req, res) {
  res.json({
    code:0,
    data:'test',
    message:''
  })
})

router.get('/redirect', function(req, res) {
  let redirectUrl = req.query.url // 前端传递过来的回调地址
  let scope = req.query.scope // 前端传递过来的scope
  let callback = 'http%3A%2F%2Fwww.hongshanit.cn/api/wechat/getOpenId'; // 授权回调地址
  cache.put('redirectUrl', redirectUrl);// 存储回调地址
  // 获取code
  let authorizeUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${config.appId}&redirect_uri=${callback}&response_type=code&scope=${scope}&state=STATE#wechat_redirect`;
  res.redirect(authorizeUrl); // 重定向
})

// 根据code获取用户的 openId
router.get('/getOpenId',async function(req, res) {
  let code = req.query.code // 获取微信返回的code码
  if(!code) {
    res.json(util.handleFail('当前未获取到授权code码'))
  }else {
    let result = await common.getAccessToken(code)
    if(result.code == 0){
      let data = result.data
      let expire_time = 1000 * 60 * 60 *2
      cache.put('access_token', data.access_token, expire_time);// 存储access_token
      cache.put('openId', data.openid, expire_time);// 存储 openid
      res.cookie('openId',data.openid, {maxAge:expire_time})
      // 查询数据是否有改该 openId
      let userRes = await dao.Find({openid:`${data.openid}`},'Users')
      // console.log(userRes)
      if (userRes.code == 0){
        if (userRes.data.length>0){
          // 取回调地址
          let redirectUrl = cache.get('redirectUrl');
          res.redirect(redirectUrl);
        }else{
          // 获取用户信息
          let userData = await common.getUserInfo(data.access_token, data.openId);
          // console.log(userData.data)
          // 向数据库中插入用户信息
          let insertData = await dao.Insert(userData.data,'Users')
          if (insertData.code == 0){
            let redirectUrl = cache.get('redirectUrl');
            res.redirect(redirectUrl);
          }else{
            res.json(insertData);
          }
        }
      }else{
        res.json(userRes);
      }
    }else {
      res.json(result)
    }
  }
})
// 获取用户信息
router.get('/getUserInfo',async function(req,res){
  let access_token = cache.get('access_token')
  let openId = cache.get('openId')
  let result = await common.getUserInfo(access_token,openId)
  res.json(result)
})

// 分享
router.get('/jssdk',async function(req,res) {
  let url = req.query.url
  // console.log(url)
  let result = await common.getToken()
  if(result.code == 0){
    let token = result.data.access_token
    cache.put('token',token)
    let result2 = await common.getTicket(token)
    if(result2.code == 0){
      let data = result2.data
      let params = {
        noncestr: util.createNonceStr(), // 随机字符串
        jsapi_ticket: data.ticket,  // ticket
        timestamp: util.createTimeStamp(), // 时间戳
        url
      }
      // 排序
      let str = util.raw(params)
      // console.log(str)
      let sign = createHash('sha1').update(str).digest('hex')// 创建 sha1 加密算法 并进行加密
      // console.log(sign)
      res.json(util.handleSuc({
          appId: config.appId, // 必填，公众号的唯一标识
          timestamp: params.timestamp, // 必填，生成签名的时间戳
          nonceStr: params.noncestr, // 必填，生成签名的随机串
          signature: sign,// 必填，签名
          jsApiList: [
            'updateAppMessageShareData', // 自定义“分享给朋友”及“分享到QQ”按钮的分享内容
            'updateTimelineShareData', // 自定义“分享到朋友圈”及“分享到QQ空间”按钮的分享内容
            'chooseWXPay' // 发起一个微信支付请求
          ] // 必填，需要使用的JS接口列表
      }))
    }else{
      res.json(result2)
    }
  }else{
    res.json(result)
  }
})

// h5 预支付 
router.get('/pay/payWallet',function(req,res){
  let openId = req.cookies.openId // 用户的 openid
  let attach = 'h5支付体验' // 附加数据
  let body = '欢迎体验猫南北网络工作室支付' // 支付主体内容
  let total_fee = req.query.money // 支付总金额  单位 分
  let notify_url = 'http://www.hongshanit.cn/api/wechat/pay/callback' // 异步接收微信支付结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数。
  let ip = '132.232.78.101'
  let appId = config.appId // 应用的 id
  // 调用公共的字符函数
  wxpay.order(appId,attach,body,openId,total_fee,notify_url,ip).then((result)=>{
    res.json(util.handleSuc(result))// 成功返回
  }).catch((result)=>{
    res.json(util.handleFail(result))// 失败返回
  })
})

// 此接口主要用来接收微信支付成功后的回调
 router.post('/pay/callback',function(req,res){
  // 微信传过来的参数 为 xml 格式   //https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=9_7&index=8
  xml.parseString(req.rawBody.toString('utf-8'),async function(error,res){
    if(error){
      res.send('fail')
      return
    }
    let data = res.xml
    let order = {
      openId: data.openid[0],
      total_fee: data.total_fee[0],
      isSubscribe: data.is_subscribe[0],
      orderId: data.out_trade_no[0],
      transactionId: data.transaction_id[0],
      tradeType: data.trade_type[0],
      timeEnd: data.time_end[0]
    }
    // 保存交易的订单信息
    let result = await dao.Insert(order,'orders')
    if(result.code == 0){
      let data ='<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>'
      res.send(data) // 返回给微信 
    }else{
      res.send('fail')
    }
  })
 })

module.exports = router
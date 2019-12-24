// 小程序后端支持接口
let express= require('express')
let router = express.Router()
let request = require('request')
let config = require('./config')
let util = require('./../../util/index')
let dao = require('./../common/db1')
let wxpay = require('./../common/wxpay')
config = config.mp

// 获取session 接口 得到openid
router.get('/getSession',function(req,res) {
  let code = req.query.code
  if(!code){
    res.json(util.handleFail('code不能为空',10001))
  }else{
    let sessionUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.appId}&secret=${config.appSecret}&js_code=${code}&grant_type=authorization_code`
    request.get(sessionUrl,function(err,response,body){
      let result = util.handleResponse(err,response,body)
      // console.log(result)
      res.json(result)
    })
  }
})
// 小程序授权登录
router.get('/login',async function(req,res) {
  let userInfo = JSON.parse(req.query.userInfo)
  if(!userInfo){
    res.json(util.handleFail('用户信息不能为空',10002))
  }else{
    // 查询当前用户是否已经存在
    let userRes = await dao.Find({openid:`${userInfo.openid}`},'Users_mp')
    if(userRes.code == 0){ // 判断是否查询成功
      if(userRes.data.length > 0){ // 有注册
        res.json(util.handleSuc({
          userId: userRes.data[0]._id
        }))
      }else{// 如果没有注册 ，进行用户数据存储
        let insertData = await dao.Insert(userInfo,'Users_mp')
        if(insertData.code == 0){// 存储成功，然后然后给前端id
          let result = await dao.Find({openid:`${userInfo.openid}`}, 'Users_mp')
          res.json(util.handleSuc({
            userId: result.data[0]._id
          }))
        }else{ // 存储不成功,输出报错信息
          res.json(insertData)
        }
      }
    }else{ // 查询不成功
      res.json(userRes)
    }
  }
})

// 支付回调通知
router.get('/pay/callback',function(req,res){
  res.json(util.handleSuc())
})

// 小程序支付
router.get('/pay/payWallet', function(req,res){
  let openId = req.query.openId // 用户的 openid
  let attach = '小程序支付体验' // 附加数据
  let body = '欢迎体验猫南北网络工作室支付' // 支付主体内容
  let total_fee = req.query.money // 支付总金额  单位 分
  let notify_url = 'http://localhost:3000/api/wechat/pay/callback' // 异步接收微信支付结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数。
  let ip = '132.232.78.101'
  let appId = config.appId // 应用的 id
  // 调用公共的字符函数
  wxpay.order(appId,attach,body,openId,total_fee,notify_url,ip).then((result)=>{
    res.json(util.handleSuc(result))// 成功返回
  }).catch((result)=>{
    res.json(util.handleFail(result))// 失败返回
  })
})

module.exports = router
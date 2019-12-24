/* 
* 微信接口统一封装处理
*/
let request = require('request')
let config = require('./../pay/config')
let util = require('./../../util/index')
config = config.wx
exports.getAccessToken = function(code) { // 获取网页授权的token
  // 根据 code 码 获取 token
  let token_url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${config.appId}&secret=${config.appSecret}&code=${code}&grant_type=authorization_code`
  return new Promise((resolve,reject) => {
    request.get(token_url, function(err,response,body) {
      let result = util.handleResponse(err,response,body)
        resolve(result)
    })
  })
}
// 获取用户信息
exports.getUserInfo = function(access_token,openId) {
  let userinfo = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openId}&lang=zh_CN`
  return new Promise ((resolve,reject) => {
    request.get(userinfo, function(err,response,body) {
      let result = util.handleResponse(err,response,body)
        resolve(result)
    })
  })
}

// 获取基础接口的token
exports.getToken = function () {
  let token = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`
  return new Promise((resolve,reject) => {
    request.get(token,function(err,response,body){
      let result = util.handleResponse(err,response,body)
      resolve(result)
    })
  })
}

// 根据 token 获取 Ticket
exports.getTicket = function (token) {
  let ticket = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`
  return new Promise((resolve,reject) => {
    request.get(ticket,function(err,response,body){
      let result = util.handleResponse(err,response,body)
      resolve(result)
    })
  })
}

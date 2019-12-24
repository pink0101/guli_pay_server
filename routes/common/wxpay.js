/**
 * 微信小程序、h5通用支付封装
 */
let config = require('./../pay/config')
let request = require('request')
let util = require('./../../util/index')
let createHash = require('create-hash') // 加密算法
let xml = require('xml2js') // xml 转 js
config= config.mch
module.exports = {
  order:function(appid,attach,body,openid,total_fee,notify_url,ip) {
    return new Promise((resolve,reject) => {
      let nonce_str = util.createNonceStr() // 随机数
      let out_trade_no = util.getTradeId('mp') // 系统交易订单号
      // 支付前需要先获取支付签名信息
      let sign = this.getPrePaySign(appid,attach,body,openid,total_fee,notify_url,ip,nonce_str,out_trade_no)
      // 通过参数和签名组装xml数据，用以调用统一下单接口
      let sendData = this.wxSendData(appid,attach,body,openid,total_fee,notify_url,ip,nonce_str,out_trade_no,sign)
      // console.log('sendData' + sendData)
      let self = this
      // 商户在小程序中先调用该接口在微信支付服务后台生成预支付交易单，返回正确的预支付交易后调起支付。
      let url = 'https://api.mch.weixin.qq.com/pay/unifiedorder' // 接口地址
      request({
        url,
        method:'POST',
        body:sendData
      },function(err,response,body){
        if(!err && response.statusCode == 200){ // 请求成功
          // 将 xml 转为 json
          xml.parseString(body.toString('utf-8'),(error,res) => {
            if(!error){
              let data = res.xml
              // console.log('data::' + JSON.stringify(data))
              if(data.return_code[0] == 'SUCCESS' && data.result_code[0] == 'SUCCESS'){
                // 获取预支付的id
                let prepay_id = data.prepay_id || []
                // 返回小程序调用支付api 需要的参数
                let payResult = self.getPayParams(appid,prepay_id[0])
                resolve(payResult)
              }
            }
          })
        }else{ // 请求失败
          resolve(util.handleFail(err))
        }
      })
    })
  },
  // 生成预支付的签名
  getPrePaySign:function(appid,attach,body,openid,total_fee,notify_url,ip,nonce_str,out_trade_no){
    let params = {
      appid,
      attach,
      body,
      mch_id: config.mch_id,
      nonce_str,
      notify_url,
      openid,
      out_trade_no,
      spbill_create_ip:ip,
      total_fee,
      trade_type:'JSAPI'
    }
    // 调用签名公共函数
    let sign = util.getSign(params,config.key)
    return sign
    
  },
  // 签名成功后，根据参数拼接组装XML格式的数据, 调用下单接口
  wxSendData:function(appid,attach,body,openid,total_fee,notify_url,ip,nonce_str,out_trade_no,sign){
    let data = '<xml>'+
      '<appid><![CDATA[' + appid + ']]></appid>' +
      '<attach><![CDATA[' + attach + ']]></attach>' +
      '<body><![CDATA[' + body + ']]></body>' +
      '<mch_id><![CDATA[' + config.mch_id + ']]></mch_id>' +
      '<nonce_str><![CDATA[' + nonce_str + ']]></nonce_str>' +
      '<notify_url><![CDATA[' + notify_url + ']]></notify_url>' +
      '<openid><![CDATA[' + openid + ']]></openid>' +
      '<out_trade_no><![CDATA[' + out_trade_no + ']]></out_trade_no>' +
      '<spbill_create_ip><![CDATA[' + ip + ']]></spbill_create_ip>' +
      '<total_fee><![CDATA[' + total_fee + ']]></total_fee>' +
      '<trade_type><![CDATA[JSAPI]]></trade_type>' +
      '<sign><![CDATA[' + sign + ']]></sign>' +
    '</xml>'
    return data
  },
  // 返回小程序调用支付api 需要的参数
  getPayParams:function(appId,prepay_id) {
    let params = {
      appId,
      timeStamp:util.createTimeStamp(),
      nonceStr: util.createNonceStr(),
      package:'prepay_id=' + prepay_id,
      signType:'MD5'
    }
    // 调用签名公共函数
    let paySign = util.getSign(params,config.key)
    params.paySign = paySign
    return params
  }
}
/**
 * 公共函数定义
 */
const createHash = require('create-hash') // 加密算法

module.exports = {
  // 生成随机数
  createNonceStr() {
    return Math.random().toString(36).substr(2,15)
  },
  // 生成时间戳
  createTimeStamp(){
    return parseInt(new Date().getTime() / 1000) + ''
  },
  // 生成系统的交易订单号
  getTradeId(type = 'wx') {
    const date = new Date().getTime().toString()
    const text = ''
    const possible = '0123456789'
    for(const i =0 ; i< 5 ;i++){
      text += possible.charAt(Math.floor(Math.random()*possible.length))
    }
    return (type == 'wx'?'MNBWx':'MNBMp') + date + text
  },
  // 生成签名
  getSign(params,key) {
    // 得到 key=value的格式 并拼接 api 密钥
    const str = this.raw(params)+ '&key=' + key
    // 通过加密算法 得到签名
    const sign = createHash('md5').update(str).digest('hex')
    return sign.toUpperCase() // 转大写
  },
  // Object 转换成 json 并排序
  raw(args) {
    // Object.keys() 将对象里面的键的值 返回一个数组  sort() 排序
    const keys = Object.keys(args).sort()
    const obj = {}
    keys.forEach((key) =>{
      obj[key] = args[key]
    })
    // 将对象转换成为&分隔的参数
    const val = ''
    for(const k in obj){
      val += '&' + k + '=' + obj[k]
    }
    return val.substr(1)
  },
  // 对请求结果统一封装处理
  handleResponse(err,response,body) {
    if(!err && response.statusCode == '200'){
      const data = JSON.parse(body)
      if(data && !data.errcode){ // 请求成功
        return this.handleSuc(data)
      }else { // 请求失败
        return this.handleFail(data.errmsg,data.errcode)
      }
    }else{ // 网络请求失败
      return this.handleFail(err,10009)
    }
  },
  handleSuc(data = ''){
    return {
      code:0,
      data,
      message:''
    }
  },
  handleFail(message = '', code = 10001){
    return {
      code,
      data:'',
      message
    }
  }
}
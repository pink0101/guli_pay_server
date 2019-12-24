const util = require('./../../util/index')
// 引入mongoose第三方模块 用来操作数据库
const mongoose = require('mongoose');
// 数据库连接
mongoose.connect('mongodb://localhost/imooc_pay', { useNewUrlParser: true})
	// 连接成功
	.then(() => console.log('数据库连接成功'))
	// 连接失败
	.catch(err => console.log(err, '数据库连接失败'));

// 创建h5集合规则
const userSchema = new mongoose.Schema({ 
	openid: String,
	nickname: String,
	sex: Number,
	language: String,
	city: String,
	province: String,
	country: String,
	headimgurl:String,
	privilege: Array
});

// 使用h5规则创建集合
const Users = mongoose.model('users', userSchema);

// 创建h5集合规则
const userSchema1 = new mongoose.Schema({ 
	nickName:String,
  gender: Number,
  language: String,
  city: String,
  province: String,
  country: String,
  avatarUrl:String,
  openid: String
});
// 使用小程序规则创建集合
const Users_mp = mongoose.model('users_mp', userSchema1);

// 创建h5集合规则
const userSchema2 = new mongoose.Schema({ 
	nickName:String,
  gender: Number,
  language: String,
  city: String,
  province: String,
  country: String,
  avatarUrl:String,
  openid: String
});
// 使用小程序规则创建集合
const orders = mongoose.model('orders', userSchema2);

const ccc= {
	Users: Users, // h5的用户表
	Users_mp: Users_mp, // 小程序的用户表
	orders: orders
}


// 查询
exports.Find = function(data,tables) {
	const Table = ccc[tables]
	return new Promise((resolve,reject)=>{
    Table.find(data).then(result=> {
			resolve(util.handleSuc(result))
		},err => {
			throw err
		})
  })
}

// 插入
exports.Insert = function(data,tables) {
	const Table = ccc[tables]
	return new Promise((resolve,reject)=>{
    Table.create(data).then(result=> {
			resolve(util.handleSuc(result))
		},err => {
			throw err
		})
  })
}



// 查询用户集合中的所有文档
// User.find().then(result => console.log(result));

// 通过_id字段查找文档
// User.find({id: '1'}).then(result => console.log(result))

// findOne方法返回一条文档 默认返回当前集合中的第一条文档
// User.findOne({name: '李四'}).then(result => console.log(result))
// 查询用户集合中年龄字段大于20并且小于40的文档
// User.find({age: {$gt: 20, $lt: 40}}).then(result => console.log(result))
// 查询用户集合中hobbies字段值包含足球的文档
// User.find({hobbies: {$in: ['足球']}}).then(result => console.log(result))
// 选择要查询的字段
// User.find().select('name email -_id').then(result => console.log(result))
// 根据年龄字段进行升序排列
// User.find().sort('age').then(result => console.log(result))
// 根据年龄字段进行降序排列
// User.find().sort('-age').then(result => console.log(result))
// 查询文档跳过前两条结果 限制显示3条结果
// User.find().skip(2).limit(3).then(result => console.log(result))


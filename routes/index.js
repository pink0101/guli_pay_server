var express = require('express');
var router = express.Router();
var dao = require('./common/db1')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/query',function() {
  // dao.find({id: '1'}).then(result => console.log(result))
})

module.exports = router;

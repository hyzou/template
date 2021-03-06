var kry = angular.module('kry', [
	'ngRoute',
	'ngCookies',
	'ngSanitize',
	'ngDialog'
]);
kry.constant('config', {
		cookie: {
			id: 'KRYID',
			token: 'KRYTOKEN'
		},
		host: '../../',
		login: '/index.html',
		noop: function() {}
	})
	/**
	 * 配置app
	 */
kry.config([
	'$routeProvider',
	'ngDialogProvider',
	function(
		$routeProvider,
		ngDialogProvider
	) {
		ngDialogProvider.setDefaults({
			closeByDocument: false,
			closeByEscape: false
		});
		/**
		 * 注册路由表
		 */
		var prefix = routes.prefix,
			map = routes.map,
			namespace = routes.namespace;
		angular.forEach(map, function(str, key) {
			$routeProvider.when(key, {
				templateUrl: prefix + str + '.htm',
				controller: namespace + str
			})
		});
		$routeProvider.when('/404', {
			templateUrl: prefix + '404.htm'
		});
		$routeProvider.otherwise({
			redirectTo: '/404'
		});
	}
])
kry.run([
	'$rootScope',
	'$cookies',
	'$templateCache',
	'$window',
	'config',
	function(
		$root,
		$cookies,
		$templateCache,
		$window,
		config
	) {
		$root.$on('$viewContentLoaded', function() {
			$templateCache.removeAll();
		});
		$root.$on('$routeChangeStart', function() {
			$root.loading = true;
		})
		$root.$on('$routeChangeSuccess', function() {
				$root.loading = false;
			})
			/*
			$root.$on('loginState', function() {
				loginCheck();
			})
			function loginCheck() {
				var id = $cookies.get(config.cookie.id),
					token = $cookies.get(config.cookie.token);
				$root.loginData = {};
				if(!id || !token) {
					$root.login = false;
				} else {
					$root.login = true;
					$root.loginData = {
						id: id,
						token: token
					};
					$http.defaults.headers.common["Authorization"] = 'Basic ' + btoa(id + ':' + token);
				}	
			}
			loginCheck();
			*/
		function initHeight() {
			var ch = document.documentElement.clientHeight;
			angular.element('body').css({
				height: ch
			});
			angular.element('.navigator').css({
				height: ch - 50
			});
		}

		angular.element($window).on('resize', function() {
			initHeight();
		})
	}
])
kry.directive('contenteditable', function() {
	return {
		restrict: 'A',
		require: '?ngModel',
		link: function(scope, element, attr, ngModel) {
			var read;
			if (!ngModel) {
				return;
			}
			ngModel.$render = function() {
				return element.html(ngModel.$viewValue);
			};
			element.bind('blur', function() {
				if (ngModel.$viewValue !== $.trim(element.html())) {
					return scope.$apply(read);
				}
			});
			return read = function() {

				return ngModel.$setViewValue($.trim(element.html()));
			};
		}
	};
});
/**
 * ng-repeat循环结束之后触发事件
 */
kry.directive('endRepeat', ['$timeout', function($timeout) {
	return {
		restrict: 'A',
		link: function(scope, ele, attr) {
			if (scope.$last === true) {
				$timeout(function() {
					scope.$emit('ngRepeatFinished');
				})
			}
		}
	}
}])
kry.directive('flexTable', function() {
	return {
		restrict: 'A',
		scope: {
			cols: '='
		},
		link: function(scope, ele, attr) {
			var cols = scope.cols,
				arr = [],
				count = 0;
			arr.push('<table class="console-table">');
			for (var key in cols) {
				value = cols[key];
				if (count % 3 == 0) {
					if (count > 0) arr.push('</tr>')
					arr.push('<tr>');
				}
				arr.push('<td class="table-title">');
				arr.push(key);
				arr.push('</td>');
				arr.push('<td>');
				arr.push(value);
				arr.push('</td>');
				count++;
			}
			if (count > 0) {
				arr.push('</table>');
				ele.html(arr.join(''));
			}
		}
	}
})
kry.directive('pageNav', function() {
	return {
		restrict: 'E',
		link: function(scope, ele, attr) {
			scope.pageNav = {
				total: attr['pageTotal'],
				idx: attr['pageIdx'],
				size: attr['pageSize']
			}
			var trigger = attr['pageTrigger'],
				copy = {};

			function build() {
				copy = angular.copy(scope.pageNav);
				if (copy.total == 0) return;
				if (copy.total < copy.size) {
					ele.html('<span class="page-nav-item page-nav-current">1</span>');
				}
			}


			scope.$watch(function() {
				return scope.pageNav;
			}, function(val) {
				if (val.total != copy.total || val.idx != copy.idx || val.size != copy.size) {
					copy = angular.copy(val);
					build();
				}
			});
		}
	}
})
kry.directive('ngUploadfile', [
	'$rootScope',
	'base',
	function(
		$root,
		base
	) {
		return {
			restrict: 'A',
			link: function(scope, ele, attr) {
				var uploadSuccess = attr['uploadSuccess'],
					uploadType = attr['uploadType'],
					flag = attr["uploadFlag"] || 2,
					isocr = attr["uploadOcr"] || 0,
					key = attr['uploadKey'],
					order = attr['uploadOrder'],
					noop = function() {}
				try {
					if (uploadSuccess) uploadSuccess = scope.$eval(uploadSuccess);
					else uploadSuccess = noop;
				} catch (err) {
					uploadSuccess = noop;
				}
				ele.on('change', function() {
					var that = this,
						target = scope.$eval(attr['uploadTarget']);
					if (that.files.length <= 0) return;
					if (!$root.uploading) {
						$root.uploading = {}
					}
					$root.uploading[key] = true;
					$root.upload(order, flag, isocr, uploadType, key, that.files[0], function(xhr) {
						delete $root.uploading[key];
						if (!xhr) return;
						if (!xhr.code || xhr.code == -1) {
							if (xhr.code == -1) {
								base.alert(xhr.msg);
							}
							var config = {
								flag: flag,
								key: key,
								isocr: isocr,
								uploadType: uploadType,
								file: that.files[0]
							}
							uploadSuccess(xhr, config, target);
						} else {
							base.alert(xhr.msg);
						}
					});
					ele.val('');
				})
			}
		}
	}
])
/** 公告*/
kry.factory('api', function() {
	var debug = {
		user: 'user',
		nav: 'nav',
		new: 'customer/new',
		newcheck: '',
		cancelorder: '',
		order: 'order',
		orderinfo: 'orderinfo',
		upload: 'upload',
		updateUser: 'update',
		deletefile: 'deletefile',
		qa: "qa",
		image: 'image',
		credit: 'credit',
		deletecredit: 'deletefile',
		querycredit: 'querycredit',
		execution: "execution",
		pushexec: 'pushexec',
		pushcredit: 'pushexec',
		repush: 'repush',
		city: "city",
		area: "area",
		fund: "fund",
		creditOrder: 'creditorder',
		loan: 'loan',
		material: 'material',
		info: 'info',
		tiper: 'tiper',
		queryBank: 'querybank',
		carShop: 'carshop',
		muser: 'muser',
		carBrands: 'carBrands',
		carSeries: 'carSeries',
		carSpecs: 'carSpec',
		carApr: 'carApr',
		updBasic: 'update',
		updStage: 'update',
		updCar: 'update',
		updLoanUser: 'update',
		updMate: 'update',
		updGuarantor: 'update',
		updContact: 'update',
		updFee: 'update',
		updLoanOrgn: 'update',
		files: 'files',
		presend: 'presend',
		sendorder: 'sendorder',
		auth: 'auth',
		customer: 'customer',
		nodes: 'nodes',
		fileInfo: 'loaninfo',
		orderStatus: 'orderstatus',
		carinfo: 'carinfo',
		loginout: 'loginOut',
		execdetail: 'execdetail',
		execresult: 'execuresult',
		password: 'password',
		getaudit: 'getaudit',
		queryAgencyBank: 'queryAgencyBank',
		updateOrderBank: 'updateOrderBank',
		getOrderBank: 'getOrderBank',
		getAgencyBankByOrderNo: 'getAgencyBankByOrderNo',
		getResidentType: "getResidentType"
	}
	var api = {
		//获取用户信息
		user: 'desktop/getUserInfoById.html',
		//获取菜单消息srv.pushcredit
		nav: 'desktop/getLoginMenu.html',
		//绑定客户--主地址
		new: '',
		newcheck: 'loanOrder/queryByIdCard.html',
		cancelorder: 'loanOrder/deleteOrder.html',
		//获取订单号
		order: 'loanOrder/initLoanNo.html',
		//获取订单信息
		orderinfo: '',
		//上传图片
		upload: 'file/uploadFile.html',
		//更新实名信息
		updateUser: 'loanUser/updateCreditByOrderNo.html',
		//删除文件
		deletefile: 'service/deleteByOrderNoMaterId.html',
		//获取问卷
		qa: "loanUser/getLoanUserByOrderNo.html",
		//获取图片
		image: 'materials/queryCreditMaterials.html',
		//提交问卷信息
		credit: 'lenderDependent/updateLenderDependent.html',
		//删除征信
		deletecredit: 'loanOrder/deleteOrder.html',
		//查询征信结果
		querycredit: 'loanUser/queryCredit.html',
		//法院查询结果
		execution: "execution/queryExecutionResult.html",
		//发起法院请求
		pushexec: 'execution/pushExecution.html',
		//重新发起查询
		repush: 'execution/againSendQuery.html',
		//法院执行记录详情
		execdetail: 'execution/queryCourtDetailList.html',
		//失信记录单条详情
		execresult: 'execution/getCourtDetail.html',
		//发起征信查询
		pushcredit: 'approval/commitCredit.html',
		//获取城市列表
		city: "providentConfig/queryCitys.html",
		//获取区域
		area: "providentConfig/queryProvidentArea.html",
		//获取区域公积金参数
		fund: 'providentConfig/queryProvidentConfig.html',
		//获取征信用户列表
		creditOrder: 'loanOrder/creditOrderList.html',
		//贷款材料列表
		loan: 'loanOrder/loanMaterialList.html',
		//其他材料列表
		material: 'loanOrder/materialList.html',
		//获取待操作的记录数
		tiper: 'loanOrder/getCount.html',
		//获取信息汇总
		info: 'loanUser/getInformationSummaryByOrderNo.html',
		//银行列表
		queryBank: 'bank/bankList.html',
		//4s店列表
		carShop: 'carShop/list.html',
		//主办人列表
		muser: 'desktop/getManagerUser.html',
		//汽车品牌
		carBrands: 'car/carBrandList.html',
		//车系列
		carSeries: 'car/carSeries.html',
		//车型
		carSpecs: 'car/carSpecs.html',
		//贴息
		carApr: 'car/carDiscount.html',
		//更新基本信息
		updBasic: 'loanUser/updateBasicInformation.html',
		//更新分期信息
		updStage: 'loanUserStage/updateLoanUserStage.html',
		//更新购车信息
		updCar: 'loanUserCar/updateLoanUserCar.html',
		//更新贷款人信息
		updLoanUser: 'loanUser/updateLoanUser.html',
		//更新配偶信息
		updMate: 'lenderDependent/replaceLender.html',
		//更新反担保人信息
		updGuarantor: 'lenderDependent/replaceLender.html',
		//更新紧急联系人信息
		updContact: 'loanUser/updateUserEmergency.html',
		//更新担保公司费用
		updFee: 'loanOrgnStage/saveOrupdateStage.html',
		//
		updLoanorgn: 'loanOrgnStage/saveOrupdateStage.html',
		//获取所需上传的图片文件列表
		files: 'materials/getFlowMaterialInfo.html',
		//提交订单前置查询
		presend: 'approval/checkVisit.html',
		//提交订单
		sendorder: 'approval/commitOrder.html',
		//审核意见
		auth: 'approval/initAuditOpinionToJson.html',
		//查询未操作记录数
		querycount: 'loanOrder/queryCountByMenu.html',
		//我的客户列表
		customer: 'loanOrder/orderList.html',
		//节点状态
		nodes: 'flowNode/getFlowNodeList.html',
		//贷款信息详情
		fileInfo: 'materials/viewLoanMaterialsInfo.html',
		//提车信息
		carinfo: 'materials/viewLoanMaterialsInfo.html',
		//订单状态
		orderStatus: 'loanOrder/getLoanOrderDetail.html',
		//登出
		loginout: 'login/loginOut.html',
		//修改密码
		password: 'user/changePassword.html',
		getaudit: 'approval/getAuditByOrderNo.html',

		//选择银行接口 wq 2016-01-17
		queryAgencyBank: 'agencyBank/queryAgencyBankList.html',
		//更新订单的银行信息 wq 2016-01-19
		updateOrderBank: 'agencyBank/updateOrderBankInfo.html',
		//根据订单得到已选银行 wq 2016-01-19
		getOrderBank: 'agencyBank/getOrderBank.html',
		//根据订单号得到已选银行(详细列表) wq 2016-01-20
		getAgencyBankByOrderNo: 'agencyBank/getAgencyBankByOrderNo.html',
		getResidentType: 'basicData/getResidentType.html?basicType=4',
		//获取用户信息
		getUserInfo:'user/queryUserInfo.html',
		//是否是4S店订单
		is4SOrder:'loanOrder/is4SOrder.html',
		//获取分公司
		getBranchDept:'deptManager/queryDeptList.html',
		//获取用户
		getUserList:'user/queryUserList.html'
	}
	return api;
})
kry.factory('base', [
	'ngDialog',
	function(
		dialog
	) {
		var rules = {
			phone: /^1[3|4|5|7|8][0-9]{9}$/,
			idc: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
			pwd: /^(?=.*?[a-zA-Z])(?=.*?[0-9])[a-zA-Z0-9]{6,20}$/,
			code: /^[0-9]{4}$/,
			number: /^\d{1,}$/,
			bankcard: {
				test: function(v) {
					if (v.length != 16 && v.length != 19) return false;
					var arr = v.split('').reverse(),
						result = [];
					for (var i in arr) {
						result.push(i % 2 ? arr[i] * 2 : arr[i]);
					}
					return eval(result.join('').split('').join('+')) % 10 == 0;
				}
			}
		}

		return {
			imgPath: 'http://112.124.61.196/',
			//imgPath: 'http://192.168.0.186:8082/image/',
			imgType: ['idcfront', 'idcback', 'sign', 'auth'],
			isPhone: function(phone) {
				return rules.phone.test(phone);
			},
			isPwd: function(pwd) {
				return rules.pwd.test(pwd);
			},
			isIdc: function(idc) {
				return rules.idc.test(idc);
			},
			isBankcard: function(card) {
				return rules.bankcard.test(card);
			},
			isDefined: function(v) {
				if (v == null || v == undefined || $.trim(v) == '') return false;
				return true;
			},
			onCommit: false,
			/**
			 * 弹框
			 */
			alert: function(msg) {
				return dialog.open({
					template: msg,
					plain: true,
					closeByDocument: false,
					closeByEscape: false,
					className: 'ngdialog-theme-alert'
				});
			},
			confirm: function(msg) {
				return dialog.open({
					templateUrl: 'templates/dialog/dialog.confirm.htm',
					data: {
						msg: msg
					},
					closeByDocument: false,
					closeByEscape: false,
					className: 'ngdialog-theme-confirm'
				});
			},
			ajaxLoading: function() {

			},
			closeAjaxLoading: function() {

			}
		}
	}
])
kry.factory('customerInterceptor', [
	'$window',
	'$injector',
	function(
		$win,
		$injector
	) {
		return {
			'request': function(config) {
				return config;
			},
			'response': function(response) {
				if (angular.isString(response.data)) return response;
				var base = $injector.get('base');
				if (!response.data || response.data.code == '401') {
					var diag = base.alert('你未登录，或授权已过期，请重新登录');
					diag.closePromise.then(function() {
						$win.location.href = '/';
						return false;
					})
				} else
					return response;
			}
		}
	}
])
kry.config(['$httpProvider', function($httpProvider) {
	$httpProvider.interceptors.push('customerInterceptor');
}])
kry.factory('navs', function() {
	return {
		"经办人": {
			srv: {
				"createCustomer": {
					"icon": "&#xe608;",
					"route": '/'
				},
				"creditConfig": {
					"icon": "&#xe607;",
					"code": 1,
					"route": "/credit"
				},
				"loanMaterialConfig": {
					"icon": "&#xe604;",
					"code": 2,
					"route": "/loan"
				},
				"visitsMaterialConfig": {
					"icon": "&#xe606;",
					"code": 0,
					"route": "/family"
				},
				"SignMaterialConfig": {
					"icon": "&#xe603;",
					"code": 5,
					"route": "/contract"
				},
				"mentionCarConfig": {
					"icon": "&#xe601;",
					"code": 8,
					"route": "/car"
				},
				"vehicleConfig": {
					"icon": "&#xe600;",
					"code": 10,
					"route": "/register"
				},
				"myCustomer": {
					"icon": "&#xe605;",
					"route": "/customer"
				}
			},
			user: [{
				"name": "消息中心",
				"icon": "&#xe60d;",
				"key": "key_msg",
				"route": "/msg"
			}, {
				"name": "我的日志",
				"icon": "&#xe602;",
				"key": "key_log",
				"route": "/log"
			}, {
				"name": "个人信息管理",
				"icon": "&#xe60c;",
				"key": "key_setting",
				"route": "/setting"
			}, {
				"name": "通讯录",
				"icon": "&#xe60b;",
				"key": "key_contact",
				"route": "/contact"
			}, {
				"name": "签到",
				"icon": "&#xe609;",
				"key": "key_sign",
				"route": "/sign"
			}]
		},
		"初审": {

		},
		"复审": {

		},
		"终审": {

		},
		"财务": {

		}
	}
})
kry.factory('srv', [
	'$http',
	'config',
	'api',
	'base',
	function(
		$http,
		config,
		api,
		base
	) {
		/**
		 * 将json对象转化为参数字符串
		 * @params {object} o
		 * @returns {string} a=1&b=2
		 */
		function toParam(o) {
			var arr = [];
			for (var i in o) {
				var s = o[i];
				if (typeof s == 'object') {
					s = JSON.stringify(s);
				}
				if (s != null && s != undefined)
					arr.push(i + '=' + s);
			}
			return arr.join('&');
		}
		/**
		 * http请求
		 * @params {object} options 请求参数
		 * 		{
		 *			url: '',
		 *			data: '',
		 *			params: '',
		 * 			method: ''
		 *		}
		 */
		function ajax(options, cb) {
			if (typeof options == 'string') {
				options = {
					url: options
				}
			}
			if (!options.method) options.method = 'GET';
			if (options.method && /^(post|put|patch)$/.test(options.method.toLowerCase())) {
				options['headers'] = {
					'Content-Type': 'application/x-www-form-urlencoded'
				};
			}
			if (options.data && typeof options.data == "object") {
				options.data = toParam(options.data);
			}
			if (!cb || typeof cb != "function") {
				cb = config.noop;
			}
			options.url = config.host + options.url;
			/*
			$.ajax({
				url: options.url,
				dataType: 'json',
				success: cb,
				error: function(xhr, status, err) {
					cb({
						code: -1,
						msg: err.message
					})
				}
			});
			*/
			$http(options)
				.success(cb)
				.error(function(data, status, headers, config) {
					if (!status) status = -1;
					cb({
						code: status,
						msg: '系统异常'
					})
				});
		}

		function upload(url, filedata, callback) {
			$http.post(config.host + url, filedata, {
					headers: {
						'Content-Type': undefined
					},
					transformRequest: angular.identity
				})
				.success(callback)
				.error(function(data, status, headers, cfg) {
					callback({
						code: -1
					});
				})
		}
		var srv = {}
			/**
			 * 获取操作员信息
			 */
		srv.getUser = function(cb) {
				ajax(api.user, cb);
			}
			/*
			 * 获取菜单
			 */
		srv.nav = function(cb) {
				ajax(api.nav, cb);
			}
			/**
			 * 初始化订单
			 */
		srv.order = function(cb) {
				ajax(api.order, cb);
			}
			/**
			 * 上传图片
			 * @params {int} orderNo
			 * @params {int} flag
			 * @params {int} isocr
			 * @params {string} key 材料所属类型
			 * @params {str} imgType 图片类型
			 * @params {formdata} fd
			 */
		srv.upload = function(orderNo, flag, isocr, key, imgType, fd, cb) {
				var p = '?flag=1&isocr=' + isocr + "&imgType=" + imgType + '&flowId=' + key + "&orderNo=" + orderNo;
				upload(api.upload + p, fd, cb);
			}
			/**
			 * 删除文件
			 * @params {string} orderNo
			 * @params {int} type
			 */
		srv.deletefile = function(orderNo, type, cb) {
				ajax({
					url: api.deletefile,
					params: {
						orderNo: orderNo,
						materialsId: type
					}
				}, cb);
			}
			/**
			 * 提交新客户信息
			 * @params {int} cid 订单编号
			 * @params {string} imgurl 身份证图片地址
			 * @params {string} name 真实姓名
			 * @params {string} idc 身份证号码
			 */
		srv.newCustomer = function(cid, imgurl, name, idc, cb) {
				ajax({
					url: api.new,
					data: {
						id: cid,
						name: name,
						idc: idc,
						imgurl: imgurl
					},
					method: 'post'
				}, cb)
			}
			/**
			 * 更新用户信息
			 * @params {string} orderNo
			 * @params {string} name
			 * @params {string} idc
			 */
		srv.updateUser = function(orderNo, name, idc, type, cb) {
				ajax({
					url: api.updateUser,
					data: {
						'type': type,
						'loanUser.orderNo': orderNo,
						'loanUser.idCard': idc,
						'loanUser.userName': name
					},
					method: 'post'
				}, cb)
			}
			/**
			 * 上传客户问卷
			 * @params {object} o 问卷对象
			 */
		srv.customerQA = function(o, cb) {
				ajax({
					url: api.credit,
					data: o,
					method: 'post'
				}, cb);
			}
			/**
			 * 获取城市列表
			 */
		srv.city = function(cb) {
				ajax(api.city, cb);
			}
			/**
			 * 获取区域列表
			 * @params {int} id
			 */
		srv.area = function(id, cb) {
				ajax({
					url: api.area,
					params: {
						cityId: id
					}
				}, cb);
			}
			/**
			 * 获取地区公积金查询内容
			 * @params {int} id 区域id
			 */
		srv.fund = function(id, cb) {
				ajax({
					url: api.fund,
					params: {
						areaId: id
					}
				}, cb)
			}
			/**
			 * 获取问题
			 */
		srv.qa = function(orderNo, cb) {
				ajax({
					url: api.qa,
					params: {
						orderNo: orderNo
					}
				}, cb);
			}
			/**
			 * 获取上传的材料
			 * @params {string} orderNo 订单编号
			 * @params {int} imgType 图片类型
			 *	imgType =2 //征信人材料
			 *	imgType =3 //配偶材料
			 *	imgType =4 //担保人材料
			 */
		srv.image = function(orderNo, imgType, cb) {
				ajax({
					url: api.image,
					params: {
						orderNo: orderNo,
						sign: imgType
					}
				}, cb);
			}
			/**
			 * 查询征信结果
			 */
		srv.queryCredit = function(orderNo, cb) {
				ajax({
					url: api.querycredit,
					params: {
						orderNo: orderNo
					}
				}, cb);
			}
			/**
			 * 法院查询结果
			 */
		srv.execution = function(orderNo, cb) {
				ajax({
					url: api.execution,
					params: {
						orderNo: orderNo
					}
				}, cb);
			}
			/**
			 * 发起法院请求
			 * @params {string} orderNo
			 * @params {int} dependentId
			 */
		srv.pushExec = function(orderNo, dependentId, cb) {
			ajax({
				url: api.pushexec,
				params: {
					orderNo: orderNo,
					dependentId: dependentId
				}
			}, cb);
		}
		srv.repush = function(orderNo, execId, cb) {
				ajax({
					url: api.repush,
					params: {
						orderNo: orderNo,
						executionId: execId
					}
				}, cb);
			}
			/**
			 * 获取法院记录列表
			 */
		srv.execdetail = function(execId, cb) {
				ajax({
					url: api.execdetail,
					params: {
						executionId: execId
					}
				}, cb)
			}
			/**
			 * 获取执行记录详情
			 */
		srv.execResult = function(detailId, cb) {
				ajax({
					url: api.execresult,
					params: {
						detailId: detailId
					}
				}, cb);
			}
			//提交征信查询
		srv.pushcredit = function(orderNo, dependentId, ctn, loanUserCredit, ldToBank, cb) {
				ajax({
					url: api.pushcredit,
					method: 'POST',
					data: {
						orderNo: orderNo,
						dependentId: dependentId,
						'loanUserCredit.loanCrdtot':loanUserCredit.loanCrdtot,
						'loanUserCredit.cardCrdtot':loanUserCredit.cardCrdtot,
						'loanUserCredit.leftNumot':loanUserCredit.leftNumot,
						'loanUserCredit.leftAmountot':loanUserCredit.leftAmountot,
						'loanUserCredit.creditLevel':loanUserCredit.creditLevel,
						'ldToBank':ldToBank,
						creditResult: encodeURI(encodeURI(ctn))

					}
				}, cb);
			}
			/**
			 * 获取征信管理列表
			 * @params {object} params
			 */
		srv.creditList = function(params, cb) {
				var p = {
					url: api.creditOrder,
					data: params,
					method: 'post'
				}
				ajax(p, cb);
			}
			/**
			 * 删除征信
			 */
		srv.deletecredit = function(orderNo, cb) {
				ajax({
					url: api.deletecredit,
					params: {
						orderNo: orderNo
					}
				}, cb);
			}
			/**
			 * 获取贷款材料管理列表
			 * @params {object} search
			 * 	{
			 * 		type:'',    类型
			 *		page:'',	分页
			 *		orderNo: '', 订单号
			 * 		name: '',
			 *		idc: ''
			 *	} 
			 */
		srv.loan = function(search, cb) {
			ajax({
				url: api.loan,
				data: search,
				method: 'post'
			}, cb);
		}
		srv.material = function(flowId, search, cb) {
				ajax({
					url: api.material,
					params: {
						flowId: flowId
					},
					data: search,
					method: 'post'
				}, cb)
			}
			/**
			 * 获取信息汇总表
			 * @params {string} orderNo
			 */
		srv.info = function(orderNo, cb) {
				ajax({
					url: api.info,
					data: {
						'loanUser.orderNo': orderNo
					},
					method: 'post'
				}, cb)
			}
			/**
			 * 获取银行列表
			 */
		srv.queryBank = function(cb) {
				ajax(api.queryBank, cb);
			}
			/**
			 * 获取4S店列表
			 */
		srv.carShop = function(cb) {
				ajax(api.carShop, cb);
			}
			/**
			 * 获取主办人列表
			 */
		srv.muser = function(cb) {
				ajax(api.muser, cb)
			}
			/**
			 * 获取汽车品牌
			 */
		srv.carBrands = function(cb) {
				ajax(api.carBrands, cb);
			}
			/**
			 * 获取车系列
			 * @params {int} brandid
			 */
		srv.carSeries = function(brandid, cb) {
				ajax({
					url: api.carSeries,
					params: {
						brandId: brandid
					}
				}, cb);
			}
			/**
			 * 获取车型列表
			 * @params {int} serieId 车系列id
			 */
		srv.carSpecs = function(serieId, cb) {
				ajax({
					url: api.carSpecs,
					params: {
						serieId: serieId
					}
				}, cb);
			}
			/**
			 * 获取车贴息利率
			 * @prams {int} specId
			 */
		srv.carApr = function(specId, cb) {
				ajax({
					url: api.carApr,
					params: {
						specId: specId
					}
				}, cb);
			}
			/**
			* 更新基本信息
			* @params {object} data
				loanUser.orderNo= (订单ID)
			  	loanUser.regFrom= (业务来源)
			  	loanUser.businessModel= (业务模式 0:标准 1:资产管理)
			 	loanUser.bankId= (经办银行ID)
			  	loanUser.licenseCategory= (牌照类型)
			  	loanOrder.surveyId= (调查人ID)
			  	loanOrder.sponsorId= (主办人)
			  	loanOrder.assistId= (辅办人)
			  	loanOrder.signId= (签单人)
			*/
		srv.updBasic = function(data, cb) {
				ajax({
					url: api.updBasic,
					data: data,
					method: 'post'
				}, cb);
			}
			/**
			 * 更新分期信息
			 */
		srv.updStage = function(data, cb) {
			ajax({
				url: api.updStage,
				data: data,
				method: 'post'
			}, cb);
		}
		srv.updCar = function(data, cb) {
			ajax({
				url: api.updCar,
				data: data,
				method: 'post'
			}, cb);
		}
		srv.updLoanUser = function(data, cb) {
			ajax({
				url: api.updLoanUser,
				data: data,
				method: 'post'
			}, cb);
		}
		srv.updMate = function(data, cb) {
			ajax({
				url: api.updMate,
				data: data,
				method: 'post'
			}, cb);
		}
		srv.updGuarantor = function(data, cb) {
			ajax({
				url: api.updGuarantor,
				data: data,
				method: 'post'
			}, cb)
		}
		srv.updContact = function(data, cb) {
			ajax({
				url: api.updContact,
				data: data,
				method: 'post'
			}, cb)
		}
		srv.updFee = function(data, cb) {
			ajax({
				url: api.updFee,
				data: data,
				method: 'post'
			}, cb)
		}
		srv.updLoanOrgn = function(data, cb) {
				ajax({
					url: api.updLoanorgn,
					data: data,
					method: 'post'
				}, cb);
			}
			/**
			 * 获取材料列表
			 * @params {int} flowId 流程code
			 * @params {string} orderNo 订单编号
			 */
		srv.files = function(flowId, orderNo, cb) {
				ajax({
					url: api.files,
					params: {
						flowId: flowId,
						orderNo: orderNo,
						type: 0
					}
				}, cb);
			}
			/**
			 * 提交订单前置判断查询
			 */
		srv.presend = function(orderNo, cb) {
				ajax({
					url: api.presend,
					params: {
						orderNo: orderNo
					}
				}, cb);
			}
			/**
			 * 提交订单
			 * @params {string} orderNo
			 */
		srv.sendorder = function(orderNo, approvalIdea, audit, flowId, cb) {
				if (typeof flowId == 'function') {
					cb = flowId;
					flowId = undefined;
				}
				if (typeof audit == 'function') {
					cb = audit;
					audit = undefined;
				}
				var data = {
					orderNo: orderNo,
					approvalIdea: encodeURI(encodeURI(approvalIdea)),
					reviewId: audit
				}
				if (flowId != undefined) {
					data.flowId = flowId;
				}
				//TODO 暂时先将业务放这里
				var callback_fn = function(xhr) {
					if (!xhr.code) {
						var diag = base.alert('订单已成功提交给 ' + xhr.data.roleName + ':' + xhr.data.operateName);
						diag.closePromise.then(function() {
							cb(xhr);
						})
					}
				}
				ajax({
					url: api.sendorder,
					data: data,
					method: 'post'
				}, callback_fn);
			}
			/**
			 * 获取审核意见
			 */
		srv.auth = function(orderNo, cb) {
				ajax({
					url: api.auth,
					params: {
						orderNo: orderNo
					}
				}, cb);
			}
			/**
			 * 获取待处理消息数量
			 * @params {int} flowId 流程编号
			 */
		srv.tiper = function(flowId, cb) {
				ajax({
					url: api.tiper,
					params: {
						flowId: flowId
					}
				}, cb);
			}
			/**
			 * 获取我的客户列表
			 */
		srv.customer = function(params, cb) {
				ajax({
					url: api.customer,
					data: params,
					method: 'post'
				}, cb);
			}
			/**
			 * 获取节点
			 */
		srv.nodes = function(cb) {
				ajax(api.nodes, cb)
			}
			/**
			 * 获取订单贷款详情
			 * @params {int} 订单
			 * @params {int} flowId
			 */
		srv.fileInfo = function(orderNo, flowId, cb) {
			ajax({
				url: api.fileInfo,
				params: {
					type: 1,
					flowId: flowId,
					orderNo: orderNo
				}
			}, cb);
		}
		srv.carInfo = function(orderNo, flowId, cb) {
				ajax({
					url: api.carinfo,
					params: {
						type: 1,
						flowId: flowId,
						orderNo: orderNo
					}
				}, cb);
			}
			/**
			 * 订单状态
			 */
		srv.orderStatus = function(orderNo, cb) {
			ajax({
				url: api.orderStatus,
				params: {
					orderNo: orderNo
				}
			}, cb);
		}

		srv.loginOut = function(cb) {
			ajax(api.loginout, cb);
		}

		srv.password = function(opwd, pwd, cb) {
				ajax({
					url: api.password,
					data: {
						password: pwd,
						oldPassword: opwd
					},
					method: 'post'
				}, cb);
			}
			/**
			 * 检查是否已经申办
			 * @params {string} idcard 身份证号码
			 */
		srv.newcheck = function(idcard, cb) {
				ajax({
					url: api.newcheck,
					params: {
						idCard: idcard
					}
				}, cb);
			}
			/**
			 * 取消订单
			 * @params {orderNo} 订单编号
			 */
		srv.cancelorder = function(orderNo, cb) {
			ajax({
				url: api.cancelorder,
				params: {
					orderNo: orderNo
				}
			}, cb);
		}
		srv.getAudit = function(orderNo, cb) {
				ajax({
					url: api.getaudit,
					params: {
						orderNo: orderNo
					}
				}, cb);
			}
			//查询银行信息 wq 2016-01-17
		srv.queryAgencyBank = function(map, cb) {
				ajax({
					url: api.queryAgencyBank,
					params: {
						'agencyCode': map.agencyCode,
						'agencyId': map.agencyId,
						'agencyName': map.agencyName,
						'agencyParentId': map.agencyParentId,
						'agencyBank.agencyParentId': map.agencyParentId
					},
					async: false
				}, cb)
			}
			//更新订单的银行信息 wq 2016-01-19
		srv.updateOrderBank = function(orderNo, bankAreaCode, bankCode, cb) {
				ajax({
					url: api.updateOrderBank,
					params: {
						orderNo: orderNo,
						bankAreaCode: bankAreaCode,
						bankCode: bankCode
					}
				}, cb)
			}
			//根据订单得到已选银行 wq 2016-01-19
		srv.getOrderBank = function(orderNo, cb) {
				ajax({
					url: api.getOrderBank,
					params: {
						orderNo: orderNo
					}
				}, cb)
			}
			//根据订单号查询已选银行(详细列表) wq 2016-01-20
		srv.getAgencyBankByOrderNo = function(orderNo, cb) {
				ajax({
					url: api.getAgencyBankByOrderNo,
					params: {
						orderNo: orderNo
					},
					async: false
				}, cb)
			}
		srv.getUserCount = function(myMenuList, $scope) {
			for (var i = 0; i < myMenuList.length; i++) {
				var myKey = myMenuList[i].key;
				$.ajax({
					url: '../approval/getDataCount.html',
					type: 'POST',
					data: {
						myKey: myKey
					},
					dataType: 'JSON',
					async: false,
					success: function(datas) {
						if (datas.code == 0 && datas.data != null) {
							var myData = datas.data;
							$scope.navRoute.user[i]["count"] = myData.count;
						}
					}
				})
			}
		}
		//查询本地常驻类型 @author wq 2016-02-18
		srv.getResidentType = function(cb) {
			ajax({
				url: api.getResidentType
			}, cb)
		}
		//获取提车材料的flowId wengdy 2016/02/22
		srv.flowId = function(orderNo, cb) {
			ajax({
				url: '../loanOrder/getLoanOrderByOrderNo.html',
				params: {
					orderNo: orderNo
				}
			}, cb)
		}
		//获取用户信息
		srv.getUserInfo = function(cb){
			ajax({
				url:api.getUserInfo
			},cb)
		}
		//检查是否是4S店订单
		srv.is4SOrder = function(orderNo,cb){
			ajax({
				url:api.is4SOrder,
				params:{'orderNo':orderNo}
			},cb)
		}
		//获取分公司
		srv.getBranchDept = function(deptId,cb){
			ajax({
				url:api.getBranchDept,
				params:{
					'dept.deptParentId':deptId
				}
			},cb);
		}
		//获取用户列表
		srv.getUserList = function(params,cb){
			ajax({
				url:api.getUserList,
				params:params
			},cb)
		}

		return srv;
	}
])
kry.controller('ctrl.building', ['$scope', function($scope) {

}])
kry.controller('ctrl.car.auth', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '审核意见',
			menuKey: 'mentionCarConfig'
		})

		$scope.orderNo = $params.orderNo;

		srv.auth($scope.orderNo, function(xhr) {
			if (!xhr.code)
				$scope.authRes = xhr.data;
		})

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/car');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.car.files', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'base',
	'ngDialog',
	'srv',
	'navs',
	function(
		$scope,
		$root,
		$params,
		$location,
		base,
		dialog,
		srv,
		navs
	) {
		$root.setSite({
			title: '提车材料',
			menuKey: 'mentionCarConfig'
		})
		$scope.orderNo = $params.orderNo;
		$scope.flowId = 8;
		$scope.showKey = '';
		$scope.fillMates = [];
		$scope.emptyMates = [];
		getFlowId();
		//得到flowId
		function getFlowId(){
			$.ajax({
				url:'../loanOrder/getLoanOrderByOrderNo.html',
				data:{'orderNo':$scope.orderNo},
				type:'POST',
				async:false,
				dataType:'JSON',
				success:function(datas){
					$scope.flowId = datas.data.flowId;
				},
				error:function(textStatus){
				}
			})
		}

		srv.files($scope.flowId, $scope.orderNo, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				$scope.showKey = $scope.fileList[0].key
				if (!$scope.lastFile) return;
				for (var i in $scope.lastFile.mate) {
					var f = $scope.lastFile.mate[i];
					if (!!f.mateStatus)
						$scope.fillMates.push(f);
					else {
						$scope.emptyMates.push(f);
					}
				}
				$scope.em = $scope.emptyMates[0];
			} else {
				base.alert('获取材料列表失败');
			}
		})

		$scope.getFile = function(f) {
			if (!f) return 0;
			var count = 0;
			for (var i in f.mate) {
				var m = f.mate[i];
				if (!!m.mateStatus) {
					count++;
				}
			}
			return count;
		}

		$scope.deleteFile = function(m) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletefile($scope.orderNo, m.mateId, function(xhr) {
					if (!xhr.code) {
						m.mateStatus = 0;
						m.matePic = '';
						m.thumbnailPic = '';
					} else {
						base.alert('删除' + m.mateName + '图片失败');
					}
				})
			});
		}

		$scope.viewImage = function(m) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $root.globalImgPath + m.matePic
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}
		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.uploadSuccess = function(res, cfg, tar) {
			if (!res.code) {
				tar.mateStatus = 1;
				tar.matePic = res.url;
				tar.thumbnailPic = res.url;
			}
		}

		$scope.deleteOtherFile = function(f, idx) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value == 1) {
					srv.deletefile($scope.orderNo, f.mateId, function(xhr) {
						if (!xhr.code) {
							f.mateStatus = 0;
							f.matePic = '';
							f.thumbnailPic = '';
							$scope.emptyMates.push(f);
							$scope.fillMates.splice(idx, 1);
							$scope.em = $scope.emptyMates[0];
						} else {
							base.alert('删除' + m.mateName + '图片失败');
						}
					})
				}
			})
		}

		$scope.otherSuccess = function(res, cfg, tar) {
			if (!res.code) {
				if (!!tar.mateStatus) {
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
				} else {
					tar.mateStatus = 1;
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					$scope.fillMates.push(tar);
					$scope.emptyMates.splice(0, 1);
					$scope.em = $scope.emptyMates[0];
				}
			}
		}

		$scope.setWrapper = function(file) {
			if ($scope.showKey == file.key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = file.key;
			}
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/car');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.car.info', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '未提交订单详情(流转单)',
			menuKey: 'mentionCarConfig'
		})
		$scope.orderNo = $params.orderNo;

		$scope.bussMode = [{
			id: 0,
			name: '标准'
		}, {
			id: 1,
			name: '资产管理'
		}]
		$scope.payLimit = [{
			limit: 12,
			name: '12期'
		}, {
			limit: 18,
			name: '18期'
		}, {
			limit: 24,
			name: '24期'
		}, {
			limit: 36,
			name: '36期'
		}]
		$scope.renewalMode = [{
			id: 0,
			name: '自行办理'
		}, {
			id: 1,
			name: '单位承保'
		}]
		$scope.house = [{
			id: 0,
			name: '无'
		}, {
			id: 1,
			name: '有'
		}]

		srv.info($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.table = xhr.data;
				$scope.copySurveyId = angular.copy($scope.table.basicInformation.surveyId);
				if ($scope.table.loanUserCar && $scope.table.loanUserCar.brandId) {
					initCar();
				}
			}
		})

		$scope.mode = {
				//基本信息
				basicInformation: false,
				//分期信息
				loanUserStage: false,
				//购车信息
				loanUserCar: false,
				lender: false,
				loanUserSpouse: false,
				loanUserGuarantee: false,
				loanUserContact: false,
				loanOrgn: false,
				approval: false
			}
			/********************初始化*********************/
		getBankList();
		get4Shop();
		getUser();
		getBrands();
		/**
		 * 获取银行列表
		 */
		function getBankList() {
			srv.queryBank(function(xhr) {
				if (!xhr.code) {
					var banks = {};
					for (var i in xhr.data) {
						var row = xhr.data[i];
						banks[row.bankId] = row;
					}
					$scope.banks = banks;
				} else {
					base.alert('获取银行列表失败');
				}
			})
		}
		/**
		 * 获取4S店
		 */
		function get4Shop() {
			srv.carShop(function(xhr) {
				if (!xhr.code) {
					var shop = {};
					for (var i in xhr.data) {
						var s = xhr.data[i];
						shop[s.shopId] = s;
					}
					$scope.carShop = shop;
				} else {
					base.alert('获取4S店信息失败');
				}
			})
		}
		/**
		 * 获取经办人列表
		 */
		function getUser() {
			srv.muser(function(xhr) {
				if (!xhr.code) {
					var us = {}
					for (var i in xhr.data) {
						var u = xhr.data[i];
						us[u.key] = u;
					}
					$scope.musers = us;
				} else {
					base.alert('获取经办人信息失败');
				}
			})
		}
		/**
		 * 获取汽车品牌
		 */
		function getBrands() {
			srv.carBrands(function(xhr) {
				if (!xhr.code) {
					var brands = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						brands[r.brandId] = r;
					}
					$scope.carbrands = brands;
				} else {
					base.alert('获取汽车品牌失败');
				}
			})
		}
		/**
		 * 获取车系列
		 */
		function getCarSeries(brandid) {
			srv.carSeries(brandid, function(xhr) {
				if (!xhr.code) {
					var sers = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						sers[r.serieId] = r;
					}
					$scope.carSeries = sers;
				} else {
					base.alert('获取汽车系列表失败');
				}
			})
		}
		/**
		 * 获取车型列表
		 */
		function getCarSpecs(serieid) {
			srv.carSpecs(serieid, function(xhr) {
				if (!xhr.code) {
					var spes = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						spes[r.specId] = r;
					}
					$scope.carSpecs = spes;
				} else {
					base.alert('获取车型列表失败');
				}
			})
		}
		/**
		 * 获取贴息
		 */
		function getCarApr(specid) {
			srv.carApr(specid, function(xhr) {
				if (!xhr.code) {
					$scope.carApr = xhr.data;
				}
			})
		}

		function initCar() {
			var brandid = $scope.table.loanUserCar.brandId,
				serieId = $scope.table.loanUserCar.serieId,
				specId = $scope.table.loanUserCar.specId;
			getCarSeries(brandid);
			if (serieId) getCarSpecs(serieId);
			if (specId) getCarApr(specId);
		}

		$scope.submitOrder = function() {
			/*
			var diag = dialog.open({
				templateUrl: 'templates/dialog/dialog.authidea.htm',
				scope: $scope,
				className: 'ngdialog-theme-input'
			});
			diag.closePromise.then(function(v) {
				if(!v || v.value == undefined) return;
				srv.sendorder($scope.orderNo, v.value || '', function(xhr) {
					if(!xhr.code) {
						$location.path('/car');
					} else {
						base.alert(xhr.msg);
					}
				})	
			})	
			*/


			if ($scope.sending_order) return;
			$scope.sending_order = true;

			srv.presend($scope.orderNo, function(xhr) {

				if (!xhr.code) {

					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})

						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.car', [
	'$scope',
	'$rootScope',
	'$location',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$location,
		base,
		srv
	) {
		$root.setSite({
			title: '提车材料管理',
			menuKey: 'mentionCarConfig'
		})

		$scope.pageParams = {
			'loanOrderMaterial.backStatus': parseInt($location.$$search.type) || 0,
			'pageNum': 1,
			'loanOrderMaterial.idCard': '',
			'loanOrderMaterial.realName': '',
			'loanOrderMaterial.orderNo': ''
		};
		$scope.page = {};

		srv.tiper(8, function(xhr) {
			if (!xhr.code) {
				$scope.tipers = xhr.data;
			}
		})

		function getLoan() {
			srv.material(8, $scope.pageParams, function(xhr) {
				if (xhr.total > 0) {
					$scope.page.lists = xhr.rows;
					$scope.pageParams['pageNum'] = xhr.page;
					$scope.page.pageSize = xhr.pageSize;
					$scope.page.total = xhr.total;
					$scope.page.totalPage = parseInt(xhr.total / xhr.pageSize) + (xhr.total % xhr.pageSize > 0 ? 1 : 0);
					$scope.page.totalPagesArr = [];
					for (var i = 0; i < $scope.page.totalPage; i++) {
						$scope.page.totalPagesArr.push(i);
					}
				} else {
					$scope.page.lists = [];
					$scope.page.total = 0;
				}
			})
		}

		getLoan();

		$scope.isStatus = function(code) {
			return $scope.pageParams['loanOrderMaterial.backStatus'] == code;
		}

		$scope.getUrl = function() {
			return ['#/car/info/', '#/car/srv/', '#/car/risk/'][$scope.pageParams['loanOrderMaterial.backStatus']];
		}

		$scope.search = function() {
			$scope.pageParams['pageNum'] = 1;
			getLoan();
		}

		$scope.pagePrev = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == 1) return;
			$scope.pageParams['pageNum'] = cp - 1;
			getLoan();
		}

		$scope.pageNext = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == $scope.page.totalPage) return;
			$scope.pageParams['pageNum'] = cp + 1;
			getLoan();
		}

		$scope.setPage = function(p) {
			if (p == $scope.pageParams['pageNum']) return;
			$scope.pageParams['pageNum'] = p;
			getLoan();
		}

		$scope.setBackStatus = function(code) {
				$scope.pageParams['loanOrderMaterial.backStatus'] = code;
				$scope.pageParams['pageNum'] = 1; //tab切换时重置页码。
				getLoan();
			}
			/*
			$scope.$watch(function() {
				return $scope.pageParams['loanOrderMaterial.backStatus'];
			}, function() {
				getLoan();
			});
			*/

	}
])
kry.controller('ctrl.car.risk.auth', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '审核意见',
			menuKey: 'mentionCarConfig'
		})

		$scope.orderNo = $params.orderNo;

		srv.auth($scope.orderNo, function(xhr) {
			if (!xhr.code)
				$scope.authRes = xhr.data;
		})

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {

				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.search({
											type: 2
										})
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})

						} else {
							base.alert('获取审核列表失败');
						}

					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.car.risk.files', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'base',
	'ngDialog',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		base,
		dialog,
		srv
	) {
		$root.setSite({
			title: '提车材料',
			menuKey: 'mentionCarConfig'
		})
		$scope.orderNo = $params.orderNo;
		$scope.flowId = 8;
		$scope.showKey = '';
		$scope.fillMates = [];
		$scope.emptyMates = [];
		getFlowId();
		//得到flowId
		function getFlowId(){
			$.ajax({
				url:'../loanOrder/getLoanOrderByOrderNo.html',
				data:{'orderNo':$scope.orderNo},
				type:'POST',
				async:false,
				dataType:'JSON',
				success:function(datas){
					$scope.flowId = datas.data.flowId;
				},
				error:function(textStatus){
				}
			})
		}
		srv.files($scope.flowId, $scope.orderNo, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				$scope.showKey = $scope.fileList[0].key
				if (!$scope.lastFile) return;
				for (var i in $scope.lastFile.mate) {
					var f = $scope.lastFile.mate[i];
					if (!!f.mateStatus)
						$scope.fillMates.push(f);
					else {
						$scope.emptyMates.push(f);
					}
				}
				$scope.em = $scope.emptyMates[0];
			} else {
				base.alert('获取材料列表失败');
			}
		})

		$scope.getFile = function(f) {
			if (!f) return 0;
			var count = 0;
			for (var i in f.mate) {
				var m = f.mate[i];
				if (!!m.mateStatus) {
					count++;
				}
			}
			return count;
		}

		$scope.deleteFile = function(m) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletefile($scope.orderNo, m.mateId, function(xhr) {
					if (!xhr.code) {
						m.mateStatus = 0;
						m.matePic = '';
						m.thumbnailPic = '';
						m.auditResult = null;
						m.auditOpinion = null;
					} else {
						base.alert('删除' + m.mateName + '图片失败');
					}
				})
			});
		}

		$scope.viewImage = function(m) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $root.globalImgPath + m.matePic
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}
		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.uploadSuccess = function(res, cfg, tar) {
			if (!res.code) {
				tar.mateStatus = 1;
				tar.matePic = res.url;
				tar.auditResult = null;
				tar.auditOpinion = null;
				tar.thumbnailPic = res.url;
			}
		}

		$scope.deleteOtherFile = function(f, idx) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value == 1) {
					srv.deletefile($scope.orderNo, f.mateId, function(xhr) {
						if (!xhr.code) {
							f.mateStatus = 0;
							f.matePic = '';
							f.thumbnailPic = '';
							f.auditResult = null;
							f.auditOpinion = null;
							$scope.emptyMates.push(f);
							$scope.fillMates.splice(idx, 1);
							$scope.em = $scope.emptyMates[0];
						} else {
							base.alert('删除' + m.mateName + '图片失败');
						}
					})
				}
			})
		}

		$scope.otherSuccess = function(res, cfg, tar) {
			if (!res.code) {
				if (!!tar.mateStatus) {
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditResult = null;
					tar.auditOpinion = null;
				} else {
					tar.mateStatus = 1;
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditResult = null;
					tar.auditOpinion = null;
					$scope.fillMates.push(tar);
					$scope.emptyMates.splice(0, 1)
					$scope.em = $scope.emptyMates[0];
				}
			}
		}

		$scope.setWrapper = function(file) {
			if ($scope.showKey == file.key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = file.key;
			}
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			//$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.search({
											type: 2
										});
										$location.path('/car');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					//	$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.car.risk', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '未提交订单详情(流转单)',
			menuKey: 'mentionCarConfig'
		})
		$scope.orderNo = $params.orderNo;

		$scope.bussMode = [{
			id: 0,
			name: '标准'
		}, {
			id: 1,
			name: '资产管理'
		}]
		$scope.payLimit = [{
			limit: 12,
			name: '12期'
		}, {
			limit: 18,
			name: '18期'
		}, {
			limit: 24,
			name: '24期'
		}, {
			limit: 36,
			name: '36期'
		}]
		$scope.renewalMode = [{
			id: 0,
			name: '自行办理'
		}, {
			id: 1,
			name: '单位承保'
		}]
		$scope.house = [{
			id: 0,
			name: '无'
		}, {
			id: 1,
			name: '有'
		}]

		srv.info($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.table = xhr.data;
				$scope.copySurveyId = angular.copy($scope.table.basicInformation.surveyId);
				if ($scope.table.loanUserCar && $scope.table.loanUserCar.brandId) {
					initCar();
				}
			}
		})

		$scope.mode = {
				//基本信息
				basicInformation: false,
				//分期信息
				loanUserStage: false,
				//购车信息
				loanUserCar: false,
				lender: false,
				loanUserSpouse: false,
				loanUserGuarantee: false,
				loanUserContact: false,
				loanOrgn: false,
				approval: false
			}
			/********************初始化*********************/
		getBankList();
		get4Shop();
		getUser();
		getBrands();
		/**
		 * 获取银行列表
		 */
		function getBankList() {
			srv.queryBank(function(xhr) {
				if (!xhr.code) {
					var banks = {};
					for (var i in xhr.data) {
						var row = xhr.data[i];
						banks[row.bankId] = row;
					}
					$scope.banks = banks;
				} else {
					base.alert('获取银行列表失败');
				}
			})
		}
		/**
		 * 获取4S店
		 */
		function get4Shop() {
			srv.carShop(function(xhr) {
				if (!xhr.code) {
					var shop = {};
					for (var i in xhr.data) {
						var s = xhr.data[i];
						shop[s.shopId] = s;
					}
					$scope.carShop = shop;
				} else {
					base.alert('获取4S店信息失败');
				}
			})
		}
		/**
		 * 获取经办人列表
		 */
		function getUser() {
			srv.muser(function(xhr) {
				if (!xhr.code) {
					var us = {}
					for (var i in xhr.data) {
						var u = xhr.data[i];
						us[u.key] = u;
					}
					$scope.musers = us;
				} else {
					base.alert('获取经办人信息失败');
				}
			})
		}
		/**
		 * 获取汽车品牌
		 */
		function getBrands() {
			srv.carBrands(function(xhr) {
				if (!xhr.code) {
					var brands = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						brands[r.brandId] = r;
					}
					$scope.carbrands = brands;
				} else {
					base.alert('获取汽车品牌失败');
				}
			})
		}
		/**
		 * 获取车系列
		 */
		function getCarSeries(brandid) {
			srv.carSeries(brandid, function(xhr) {
				if (!xhr.code) {
					var sers = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						sers[r.serieId] = r;
					}
					$scope.carSeries = sers;
				} else {
					base.alert('获取汽车系列表失败');
				}
			})
		}
		/**
		 * 获取车型列表
		 */
		function getCarSpecs(serieid) {
			srv.carSpecs(serieid, function(xhr) {
				if (!xhr.code) {
					var spes = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						spes[r.specId] = r;
					}
					$scope.carSpecs = spes;
				} else {
					base.alert('获取车型列表失败');
				}
			})
		}
		/**
		 * 获取贴息
		 */
		function getCarApr(specid) {
			srv.carApr(specid, function(xhr) {
				if (!xhr.code) {
					$scope.carApr = xhr.data;
				}
			})
		}

		function initCar() {
			var brandid = $scope.table.loanUserCar.brandId,
				serieId = $scope.table.loanUserCar.serieId,
				specId = $scope.table.loanUserCar.specId;
			getCarSeries(brandid);
			if (serieId) getCarSpecs(serieId);
			if (specId) getCarApr(specId);
		}

		$scope.submitOrder = function() {
			/*
			var diag = dialog.open({
				templateUrl: 'templates/dialog/dialog.authidea.htm',
				scope: $scope,
				className: 'ngdialog-theme-input'
			});
			diag.closePromise.then(function(v) {
				if(!v || v.value == undefined) return;
				srv.sendorder($scope.orderNo, v.value || '', function(xhr) {
					if(!xhr.code) {
						$location.search({type: 2})
						$location.path('/car');
					} else {
						base.alert(xhr.msg);
					}
				})	
			})	
			*/
			if ($scope.sending_order) return;
			//$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {

					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path({
											type: 2
										});
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					//$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.car.srv.auth', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '审核意见',
			menuKey: 'mentionCarConfig'
		})

		$scope.orderNo = $params.orderNo;

		srv.auth($scope.orderNo, function(xhr) {
			if (!xhr.code)
				$scope.authRes = xhr.data;
		})

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			//	$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.search({
											type: 1
										});
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					//	$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.car.srv.files', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'base',
	'ngDialog',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		base,
		dialog,
		srv
	) {
		$root.setSite({
			title: '提车材料',
			menuKey: 'mentionCarConfig'
		})
		$scope.orderNo = $params.orderNo;
		$scope.flowId = 8;
		$scope.showKey = '';
		$scope.fillMates = [];
		$scope.emptyMates = [];
		getFlowId();
		//得到flowId
		function getFlowId(){
			$.ajax({
				url:'../loanOrder/getLoanOrderByOrderNo.html',
				data:{'orderNo':$scope.orderNo},
				type:'POST',
				async:false,
				dataType:'JSON',
				success:function(datas){
					$scope.flowId = datas.data.flowId;
				},
				error:function(textStatus){
				}
			})
		}
		srv.files($scope.flowId, $scope.orderNo, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				$scope.showKey = $scope.fileList[0].key
				if (!$scope.lastFile) return;
				for (var i in $scope.lastFile.mate) {
					var f = $scope.lastFile.mate[i];
					if (!!f.mateStatus)
						$scope.fillMates.push(f);
					else {
						$scope.emptyMates.push(f);
					}
				}
				$scope.em = $scope.emptyMates[0];
			} else {
				base.alert('获取材料列表失败');
			}
		})

		$scope.getFile = function(f) {
			if (!f) return 0;
			var count = 0;
			for (var i in f.mate) {
				var m = f.mate[i];
				if (!!m.mateStatus) {
					count++;
				}
			}
			return count;
		}

		$scope.deleteFile = function(m) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletefile($scope.orderNo, m.mateId, function(xhr) {
					if (!xhr.code) {
						m.mateStatus = 0;
						m.matePic = '';
						m.thumbnailPic = '';
						m.auditResult = null;
						m.auditOpinion = null;
					} else {
						base.alert('删除' + m.mateName + '图片失败');
					}
				})
			});
		}

		$scope.viewImage = function(m) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $root.globalImgPath + m.matePic
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}
		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.uploadSuccess = function(res, cfg, tar) {
			if (!res.code) {
				tar.mateStatus = 1;
				tar.matePic = res.url;
				tar.auditResult = null;
				tar.auditOpinion = null;
				tar.thumbnailPic = res.url;
			}
		}

		$scope.deleteOtherFile = function(f, idx) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value == 1) {
					srv.deletefile($scope.orderNo, f.mateId, function(xhr) {
						if (!xhr.code) {
							f.mateStatus = 0;
							f.matePic = '';
							f.thumbnailPic = '';
							f.auditResult = null;
							f.auditOpinion = null;
							$scope.emptyMates.push(f);
							$scope.fillMates.splice(idx, 1);
							$scope.em = $scope.emptyMates[0];
						} else {
							base.alert('删除' + m.mateName + '图片失败');
						}
					})
				}
			})
		}

		$scope.otherSuccess = function(res, cfg, tar) {
			if (!res.code) {
				if (!!tar.mateStatus) {
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditResult = null;
					tar.auditOpinion = null;
				} else {
					tar.mateStatus = 1;
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditResult = null;
					tar.auditOpinion = null;
					$scope.fillMates.push(tar);
					$scope.emptyMates.splice(0, 1);
					$scope.em = $scope.emptyMates[0];
				}
			}
		}

		$scope.setWrapper = function(file) {
			if ($scope.showKey == file.key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = file.key;
			}
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			//$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path({
											type: 1
										});
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.car.srv', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '未提交订单详情(流转单)',
			menuKey: 'mentionCarConfig'
		})
		$scope.orderNo = $params.orderNo;

		$scope.bussMode = [{
			id: 0,
			name: '标准'
		}, {
			id: 1,
			name: '资产管理'
		}]
		$scope.payLimit = [{
			limit: 12,
			name: '12期'
		}, {
			limit: 18,
			name: '18期'
		}, {
			limit: 24,
			name: '24期'
		}, {
			limit: 36,
			name: '36期'
		}]
		$scope.renewalMode = [{
			id: 0,
			name: '自行办理'
		}, {
			id: 1,
			name: '单位承保'
		}]
		$scope.house = [{
			id: 0,
			name: '无'
		}, {
			id: 1,
			name: '有'
		}]

		srv.info($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.table = xhr.data;
				$scope.copySurveyId = angular.copy($scope.table.basicInformation.surveyId);
				if ($scope.table.loanUserCar && $scope.table.loanUserCar.brandId) {
					initCar();
				}
			}
		})

		$scope.mode = {
				//基本信息
				basicInformation: false,
				//分期信息
				loanUserStage: false,
				//购车信息
				loanUserCar: false,
				lender: false,
				loanUserSpouse: false,
				loanUserGuarantee: false,
				loanUserContact: false,
				loanOrgn: false,
				approval: false
			}
			/********************初始化*********************/
		getBankList();
		get4Shop();
		getUser();
		getBrands();
		/**
		 * 获取银行列表
		 */
		function getBankList() {
			srv.queryBank(function(xhr) {
				if (!xhr.code) {
					var banks = {};
					for (var i in xhr.data) {
						var row = xhr.data[i];
						banks[row.bankId] = row;
					}
					$scope.banks = banks;
				} else {
					base.alert('获取银行列表失败');
				}
			})
		}
		/**
		 * 获取4S店
		 */
		function get4Shop() {
			srv.carShop(function(xhr) {
				if (!xhr.code) {
					var shop = {};
					for (var i in xhr.data) {
						var s = xhr.data[i];
						shop[s.shopId] = s;
					}
					$scope.carShop = shop;
				} else {
					base.alert('获取4S店信息失败');
				}
			})
		}
		/**
		 * 获取经办人列表
		 */
		function getUser() {
			srv.muser(function(xhr) {
				if (!xhr.code) {
					var us = {}
					for (var i in xhr.data) {
						var u = xhr.data[i];
						us[u.key] = u;
					}
					$scope.musers = us;
				} else {
					base.alert('获取经办人信息失败');
				}
			})
		}
		/**
		 * 获取汽车品牌
		 */
		function getBrands() {
			srv.carBrands(function(xhr) {
				if (!xhr.code) {
					var brands = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						brands[r.brandId] = r;
					}
					$scope.carbrands = brands;
				} else {
					base.alert('获取汽车品牌失败');
				}
			})
		}
		/**
		 * 获取车系列
		 */
		function getCarSeries(brandid) {
			srv.carSeries(brandid, function(xhr) {
				if (!xhr.code) {
					var sers = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						sers[r.serieId] = r;
					}
					$scope.carSeries = sers;
				} else {
					base.alert('获取汽车系列表失败');
				}
			})
		}
		/**
		 * 获取车型列表
		 */
		function getCarSpecs(serieid) {
			srv.carSpecs(serieid, function(xhr) {
				if (!xhr.code) {
					var spes = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						spes[r.specId] = r;
					}
					$scope.carSpecs = spes;
				} else {
					base.alert('获取车型列表失败');
				}
			})
		}
		/**
		 * 获取贴息
		 */
		function getCarApr(specid) {
			srv.carApr(specid, function(xhr) {
				if (!xhr.code) {
					$scope.carApr = xhr.data;
				}
			})
		}

		function initCar() {
			var brandid = $scope.table.loanUserCar.brandId,
				serieId = $scope.table.loanUserCar.serieId,
				specId = $scope.table.loanUserCar.specId;
			getCarSeries(brandid);
			if (serieId) getCarSpecs(serieId);
			if (specId) getCarApr(specId);
		}

		$scope.submitOrder = function() {
			/*
			var diag = dialog.open({
				templateUrl: 'templates/dialog/dialog.authidea.htm',
				scope: $scope,
				className: 'ngdialog-theme-input'
			});
			diag.closePromise.then(function(v) {
				if(!v || v.value == undefined) return;
				srv.sendorder($scope.orderNo, v.value || '', function(xhr) {
					if(!xhr.code) {
						$location.search({type: 1});
						$location.path('/car');
					} else {
						base.alert(xhr.msg);
					}
				})	
			})	
			*/
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path({
											type: 1
										});
										$location.path('/car');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('contact', ['', function() {

}])
kry.controller('ctrl.contract.auth', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '审核意见',
			menuKey: 'SignMaterialConfig'
		})

		$scope.orderNo = $params.orderNo;

		srv.auth($scope.orderNo, function(xhr) {
			if (!xhr.code)
				$scope.authRes = xhr.data;
		})

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					var diag = dialog.open({
						templateUrl: 'templates/dialog/dialog.authidea.htm',
						scope: $scope,
						controller:'ctrl.dialog.authidea',
						className: 'ngdialog-theme-input'
					});
					diag.closePromise.then(function(v) {
						if (!v || v.value == undefined) {
							$scope.sending_order = false;
							return;
						}
						srv.sendorder($scope.orderNo, v.value || '', function(xhr) {
							if (!xhr.code) {
								$location.path('/contract');
							} else {
								base.alert(xhr.msg);
							}
							$scope.sending_order = false;
						})
					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.contract.files', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'base',
	'ngDialog',
	'srv',
	'navs',
	function(
		$scope,
		$root,
		$params,
		$location,
		base,
		dialog,
		srv,
		navs
	) {
		$root.setSite({
			title: '签约材料',
			menuKey: 'SignMaterialConfig'
		})
		$scope.orderNo = $params.orderNo;
		$scope.flowId = 5;
		$scope.showKey = '';
		$scope.fillMates = [];
		$scope.emptyMates = [];
		getFlowId();
		//得到flowId
		function getFlowId(){
			$.ajax({
				url:'../loanOrder/getLoanOrderByOrderNo.html',
				data:{'orderNo':$scope.orderNo},
				type:'POST',
				async:false,
				dataType:'JSON',
				success:function(datas){
					$scope.flowId = datas.data.flowId;
				},
				error:function(textStatus){
				}
			})
		}
		srv.files($scope.flowId, $scope.orderNo, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				$scope.showKey = $scope.fileList[0].key
				if (!$scope.lastFile) return;
				for (var i in $scope.lastFile.mate) {
					var f = $scope.lastFile.mate[i];
					if (!!f.mateStatus)
						$scope.fillMates.push(f);
					else {
						$scope.emptyMates.push(f);
					}
				}
				$scope.em = $scope.emptyMates[0];
			} else {
				base.alert('获取材料列表失败');
			}
		})

		$scope.getFile = function(f) {
			if (!f) return 0;
			var count = 0;
			for (var i in f.mate) {
				var m = f.mate[i];
				if (!!m.mateStatus) {
					count++;
				}
			}
			return count;
		}

		$scope.deleteFile = function(m) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletefile($scope.orderNo, m.mateId, function(xhr) {
					if (!xhr.code) {
						m.mateStatus = 0;
						m.matePic = '';
						m.thumbnailPic = '';
					} else {
						base.alert('删除' + m.mateName + '图片失败');
					}
				})
			});
		}

		$scope.viewImage = function(m) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $root.globalImgPath + m.matePic
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}

		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.uploadSuccess = function(res, cfg, tar) {
			if (!res.code) {
				tar.mateStatus = 1;
				tar.matePic = res.url;
				tar.thumbnailPic = res.url;
			}
		}

		$scope.deleteOtherFile = function(f, idx) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value == 1) {
					srv.deletefile($scope.orderNo, f.mateId, function(xhr) {
						if (!xhr.code) {
							f.mateStatus = 0;
							f.matePic = '';
							f.thumbnailPic = '';
							$scope.emptyMates.push(f);
							$scope.fillMates.splice(idx, 1);
							$scope.em = $scope.emptyMates[0];
						} else {
							base.alert('删除' + m.mateName + '图片失败');
						}
					})
				}
			})
		}

		$scope.otherSuccess = function(res, cfg, tar) {
			if (!res.code) {
				if (!!tar.mateStatus) {
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
				} else {
					tar.mateStatus = 1;
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					$scope.fillMates.push(tar);
					$scope.emptyMates.splice(0, 1);
					$scope.em = $scope.emptyMates[0];
				}
			}
		}

		$scope.setWrapper = function(file) {
			if ($scope.showKey == file.key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = file.key;
			}
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.contract.info', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '未提交订单详情(流转单)',
			menuKey: 'SignMaterialConfig'
		})
		$scope.orderNo = $params.orderNo;

		$scope.bussMode = [{
			id: 0,
			name: '标准'
		}, {
			id: 1,
			name: '资产管理'
		}]
		$scope.payLimit = [{
			limit: 12,
			name: '12期'
		}, {
			limit: 18,
			name: '18期'
		}, {
			limit: 24,
			name: '24期'
		}, {
			limit: 36,
			name: '36期'
		}]
		$scope.renewalMode = [{
			id: 0,
			name: '自行办理'
		}, {
			id: 1,
			name: '单位承保'
		}]
		$scope.house = [{
			id: 0,
			name: '无'
		}, {
			id: 1,
			name: '有'
		}]

		srv.info($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.table = xhr.data;
				$scope.copySurveyId = angular.copy($scope.table.basicInformation.surveyId);
				if ($scope.table.loanUserCar && $scope.table.loanUserCar.brandId) {
					initCar();
				}
			}
		})

		$scope.mode = {
				//基本信息
				basicInformation: false,
				//分期信息
				loanUserStage: false,
				//购车信息
				loanUserCar: false,
				lender: false,
				loanUserSpouse: false,
				loanUserGuarantee: false,
				loanUserContact: false,
				loanOrgn: false,
				approval: false
			}
			/********************初始化*********************/
		getBankList();
		get4Shop();
		getUser();
		getBrands();
		/**
		 * 获取银行列表
		 */
		function getBankList() {
			srv.queryBank(function(xhr) {
				if (!xhr.code) {
					var banks = {};
					for (var i in xhr.data) {
						var row = xhr.data[i];
						banks[row.bankId] = row;
					}
					$scope.banks = banks;
				} else {
					base.alert('获取银行列表失败');
				}
			})
		}
		/**
		 * 获取4S店
		 */
		function get4Shop() {
			srv.carShop(function(xhr) {
				if (!xhr.code) {
					var shop = {};
					for (var i in xhr.data) {
						var s = xhr.data[i];
						shop[s.shopId] = s;
					}
					$scope.carShop = shop;
				} else {
					base.alert('获取4S店信息失败');
				}
			})
		}
		/**
		 * 获取经办人列表
		 */
		function getUser() {
			srv.muser(function(xhr) {
				if (!xhr.code) {
					var us = {}
					for (var i in xhr.data) {
						var u = xhr.data[i];
						us[u.key] = u;
					}
					$scope.musers = us;
				} else {
					base.alert('获取经办人信息失败');
				}
			})
		}
		/**
		 * 获取汽车品牌
		 */
		function getBrands() {
			srv.carBrands(function(xhr) {
				if (!xhr.code) {
					var brands = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						brands[r.brandId] = r;
					}
					$scope.carbrands = brands;
				} else {
					base.alert('获取汽车品牌失败');
				}
			})
		}
		/**
		 * 获取车系列
		 */
		function getCarSeries(brandid) {
			srv.carSeries(brandid, function(xhr) {
				if (!xhr.code) {
					var sers = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						sers[r.serieId] = r;
					}
					$scope.carSeries = sers;
				} else {
					base.alert('获取汽车系列表失败');
				}
			})
		}
		/**
		 * 获取车型列表
		 */
		function getCarSpecs(serieid) {
			srv.carSpecs(serieid, function(xhr) {
				if (!xhr.code) {
					var spes = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						spes[r.specId] = r;
					}
					$scope.carSpecs = spes;
				} else {
					base.alert('获取车型列表失败');
				}
			})
		}
		/**
		 * 获取贴息
		 */
		function getCarApr(specid) {
			srv.carApr(specid, function(xhr) {
				if (!xhr.code) {
					$scope.carApr = xhr.data;
				}
			})
		}

		function initCar() {
			var brandid = $scope.table.loanUserCar.brandId,
				serieId = $scope.table.loanUserCar.serieId,
				specId = $scope.table.loanUserCar.specId;
			getCarSeries(brandid);
			if (serieId) getCarSpecs(serieId);
			if (specId) getCarApr(specId);
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/contract');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}
					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.contract', [
	'$scope',
	'$rootScope',
	'$location',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$location,
		base,
		srv
	) {
		$root.setSite({
			title: '签约材料管理',
			menuKey: 'SignMaterialConfig'
		})

		$scope.pageParams = {
			'loanOrderMaterial.backStatus': parseInt($location.$$search.type) || 0,
			'pageNum': 1,
			'loanOrderMaterial.idCard': '',
			'loanOrderMaterial.realName': '',
			'loanOrderMaterial.orderNo': ''
		};
		$scope.page = {};
		srv.tiper(5, function(xhr) {
			if (!xhr.code) {
				$scope.tipers = xhr.data;
			}
		})

		function getLoan() {
			srv.material(5, $scope.pageParams, function(xhr) {
				if (xhr.total > 0) {
					$scope.page.lists = xhr.rows;
					$scope.pageParams['pageNum'] = xhr.page;
					$scope.page.pageSize = xhr.pageSize;
					$scope.page.total = xhr.total;
					$scope.page.totalPage = parseInt(xhr.total / xhr.pageSize) + (xhr.total % xhr.pageSize > 0 ? 1 : 0);
					$scope.page.totalPagesArr = [];
					for (var i = 0; i < $scope.page.totalPage; i++) {
						$scope.page.totalPagesArr.push(i);
					}
				} else {
					$scope.page.lists = [];
					$scope.page.total = 0;
				}
			})
		}

		getLoan();

		$scope.isStatus = function(code) {
			return $scope.pageParams['loanOrderMaterial.backStatus'] == code;
		}
		$scope.getUrl = function() {
			return ['#/contract/info/', '#/contract/srv/', '#/contract/risk/'][$scope.pageParams['loanOrderMaterial.backStatus']];
		}

		$scope.search = function() {
			$scope.pageParams['pageNum'] = 1;
			getLoan();
		}

		$scope.pagePrev = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == 1) return;
			$scope.pageParams['pageNum'] = cp - 1;
			getLoan();
		}

		$scope.pageNext = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == $scope.page.totalPage) return;
			$scope.pageParams['pageNum'] = cp + 1;
			getLoan();
		}

		$scope.setPage = function(p) {
			if (p == $scope.pageParams['pageNum']) return;
			$scope.pageParams['pageNum'] = p;
			getLoan();
		}

		$scope.setBackStatus = function(code) {
			$scope.pageParams['loanOrderMaterial.backStatus'] = code;
			$scope.pageParams['pageNum'] = 1; //tab切换时重置页码。
			getLoan();
		}
	}
])
kry.controller('ctrl.contract.risk.auth', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '审核意见',
			menuKey: 'SignMaterialConfig'
		})

		$scope.orderNo = $params.orderNo;

		srv.auth($scope.orderNo, function(xhr) {
			if (!xhr.code)
				$scope.authRes = xhr.data;
		})

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.search({
											type: 2
										})
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.contract.risk.files', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'base',
	'ngDialog',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		base,
		dialog,
		srv
	) {
		$root.setSite({
			title: '提车材料',
			menuKey: 'SignMaterialConfig'
		})
		$scope.orderNo = $params.orderNo;
		$scope.flowId = 5;
		$scope.showKey = '';
		$scope.fillMates = [];
		$scope.emptyMates = [];
		getFlowId();
		//得到flowId
		function getFlowId(){
			$.ajax({
				url:'../loanOrder/getLoanOrderByOrderNo.html',
				data:{'orderNo':$scope.orderNo},
				type:'POST',
				async:false,
				dataType:'JSON',
				success:function(datas){
					$scope.flowId = datas.data.flowId;
				},
				error:function(textStatus){
				}
			})
		}
		srv.files($scope.flowId, $scope.orderNo, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				$scope.showKey = $scope.fileList[0].key;
				if (!$scope.lastFile) return;
				for (var i in $scope.lastFile.mate) {
					var f = $scope.lastFile.mate[i];
					if (!!f.mateStatus)
						$scope.fillMates.push(f);
					else {
						$scope.emptyMates.push(f);
					}
				}
				$scope.em = $scope.emptyMates[0];
			} else {
				base.alert('获取材料列表失败');
			}
		})

		$scope.getFile = function(f) {
			if (!f) return 0;
			var count = 0;
			for (var i in f.mate) {
				var m = f.mate[i];
				if (!!m.mateStatus) {
					count++;
				}
			}
			return count;
		}

		$scope.deleteFile = function(m) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletefile($scope.orderNo, m.mateId, function(xhr) {
					if (!xhr.code) {
						m.mateStatus = 0;
						m.matePic = '';
						m.thumbnailPic = '';
						m.auditResult = null;
						m.auditOpinion = null;
					} else {
						base.alert('删除' + m.mateName + '图片失败');
					}
				})
			});
		}

		$scope.viewImage = function(m) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $root.globalImgPath + m.matePic
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}

		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.uploadSuccess = function(res, cfg, tar) {
			if (!res.code) {
				tar.mateStatus = 1;
				tar.matePic = res.url;
				tar.auditResult = null;
				tar.auditOpinion = null;
				tar.thumbnailPic = res.url;
			}
		}

		$scope.deleteOtherFile = function(f, idx) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value == 1) {
					srv.deletefile($scope.orderNo, f.mateId, function(xhr) {
						if (!xhr.code) {
							f.mateStatus = 0;
							f.matePic = '';
							f.thumbnailPic = '';
							f.auditResult = null;
							f.auditOpinion = null;
							$scope.emptyMates.push(f);
							$scope.fillMates.splice(idx, 1);
							$scope.em = $scope.emptyMates[0];
						} else {
							base.alert('删除' + m.mateName + '图片失败');
						}
					})
				}
			})
		}

		$scope.otherSuccess = function(res, cfg, tar) {
			if (!res.code) {
				if (!!tar.mateStatus) {
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditResult = null;
					tar.auditOpinion = null;
				} else {
					tar.mateStatus = 1;
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditResult = null;
					tar.auditOpinion = null;
					$scope.fillMates.push(tar);
					$scope.emptyMates.splice(0, 1);
					$scope.em = $scope.emptyMates[0];
				}
			}
		}

		$scope.setWrapper = function(file) {
			if ($scope.showKey == file.key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = file.key;
			}
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.search({
											type: 2
										});
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.contract.risk', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '未提交订单详情(流转单)',
			menuKey: 'SignMaterialConfig'
		})
		$scope.orderNo = $params.orderNo;

		$scope.bussMode = [{
			id: 0,
			name: '标准'
		}, {
			id: 1,
			name: '资产管理'
		}]
		$scope.payLimit = [{
			limit: 12,
			name: '12期'
		}, {
			limit: 18,
			name: '18期'
		}, {
			limit: 24,
			name: '24期'
		}, {
			limit: 36,
			name: '36期'
		}]
		$scope.renewalMode = [{
			id: 0,
			name: '自行办理'
		}, {
			id: 1,
			name: '单位承保'
		}]
		$scope.house = [{
			id: 0,
			name: '无'
		}, {
			id: 1,
			name: '有'
		}]

		srv.info($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.table = xhr.data;
				$scope.copySurveyId = angular.copy($scope.table.basicInformation.surveyId);
				if ($scope.table.loanUserCar && $scope.table.loanUserCar.brandId) {
					initCar();
				}
			}
		})

		$scope.mode = {
				//基本信息
				basicInformation: false,
				//分期信息
				loanUserStage: false,
				//购车信息
				loanUserCar: false,
				lender: false,
				loanUserSpouse: false,
				loanUserGuarantee: false,
				loanUserContact: false,
				loanOrgn: false,
				approval: false
			}
			/********************初始化*********************/
		getBankList();
		get4Shop();
		getUser();
		getBrands();
		/**
		 * 获取银行列表
		 */
		function getBankList() {
			srv.queryBank(function(xhr) {
				if (!xhr.code) {
					var banks = {};
					for (var i in xhr.data) {
						var row = xhr.data[i];
						banks[row.bankId] = row;
					}
					$scope.banks = banks;
				} else {
					base.alert('获取银行列表失败');
				}
			})
		}
		/**
		 * 获取4S店
		 */
		function get4Shop() {
			srv.carShop(function(xhr) {
				if (!xhr.code) {
					var shop = {};
					for (var i in xhr.data) {
						var s = xhr.data[i];
						shop[s.shopId] = s;
					}
					$scope.carShop = shop;
				} else {
					base.alert('获取4S店信息失败');
				}
			})
		}
		/**
		 * 获取经办人列表
		 */
		function getUser() {
			srv.muser(function(xhr) {
				if (!xhr.code) {
					var us = {}
					for (var i in xhr.data) {
						var u = xhr.data[i];
						us[u.key] = u;
					}
					$scope.musers = us;
				} else {
					base.alert('获取经办人信息失败');
				}
			})
		}
		/**
		 * 获取汽车品牌
		 */
		function getBrands() {
			srv.carBrands(function(xhr) {
				if (!xhr.code) {
					var brands = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						brands[r.brandId] = r;
					}
					$scope.carbrands = brands;
				} else {
					base.alert('获取汽车品牌失败');
				}
			})
		}
		/**
		 * 获取车系列
		 */
		function getCarSeries(brandid) {
			srv.carSeries(brandid, function(xhr) {
				if (!xhr.code) {
					var sers = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						sers[r.serieId] = r;
					}
					$scope.carSeries = sers;
				} else {
					base.alert('获取汽车系列表失败');
				}
			})
		}
		/**
		 * 获取车型列表
		 */
		function getCarSpecs(serieid) {
			srv.carSpecs(serieid, function(xhr) {
				if (!xhr.code) {
					var spes = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						spes[r.specId] = r;
					}
					$scope.carSpecs = spes;
				} else {
					base.alert('获取车型列表失败');
				}
			})
		}
		/**
		 * 获取贴息
		 */
		function getCarApr(specid) {
			srv.carApr(specid, function(xhr) {
				if (!xhr.code) {
					$scope.carApr = xhr.data;
				}
			})
		}

		function initCar() {
			var brandid = $scope.table.loanUserCar.brandId,
				serieId = $scope.table.loanUserCar.serieId,
				specId = $scope.table.loanUserCar.specId;
			getCarSeries(brandid);
			if (serieId) getCarSpecs(serieId);
			if (specId) getCarApr(specId);
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.search({
											type: 2
										})
										$location.path('/contract');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			});
		}
	}
])
kry.controller('ctrl.credit.auth.guarantor', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
				title: '反担保人征信资料',
				menuKey: 'creditConfig'
			})
			//fields
		$scope.orderNo = $params.id;
		$scope.page = {}
		$scope.images = {}
		$scope.waterMark={};
			//查订单
		srv.qa($scope.orderNo, function(xhr) {
			if (!xhr.code && xhr.data) {
				var qa = xhr.data;
				if (qa) {

					$scope.page.maritalStatus = qa.maritalStatus;
					$scope.page.isAssure = qa.isAssure;

				} else {
					var diag = base.alert('无效的页面访问，点击确认返回征信管理');
					diag.closePromise.then(function() {
						$location.path('/credit');
					})
					return;
				}
			}
		})
		srv.queryCredit($scope.orderNo, function(xhr) {
			if (!xhr.code && xhr.data) {
				for (var i = 0; i < xhr.data.length; i++) {
					var row = xhr.data[i];
					if (row.dependentId == 2 && row.creditContent != null && row.creditContent.length > 0) {
						$scope.disabledModify = true;
					}
					if (row.dependentId == 2 && (row.creditStatus == 0 || row.creditStatus == 2)) {
						$scope.disabledModify = true;
					}
				}
			}
		})
		srv.image($scope.orderNo, 4, function(xhr) {
				if (!xhr.code && angular.isArray(xhr.data)) {
					for (var i = 0; i < xhr.data.length; i++) {
						var row = xhr.data[i];
						if (row.url != null) {
							$scope.images[row.materialId] = base.imgPath + row.url;
							if (row.materialId == 41) {
								$scope.page.name = row.name;
								$scope.page.idc = row.cardNum;
							}
							$scope.waterMark[row.materialId] = row.aduitOpinion;
						}
					}
				}
			})
			/**
			 * 上传成功回调
			 * @params {object} xhr
			 * @params {object}
			 */

		$scope.uploadSuccess = function(xhr, cfg) {
			$scope.images[cfg.key] = base.imgPath + xhr.url;
			delete $scope.waterMark[cfg.key];
			if (cfg.key == '41') {
				$scope.page.modify = false;
				$scope.reuploaded = true;
				$scope.page.name = xhr.name;
				$scope.page.idc = xhr.id_number;
			}

		}

		$scope.viewImage = function(key) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $scope.images[key]
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}
		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}
		$scope.deletefile = function(id) {
			var diag = base.confirm('是否删除图片?');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletefile($scope.orderNo, id, function(xhr) {
					if (!xhr.code) {
						delete $scope.images[id];
						delete $scope.waterMark[id];
						if (id == '41') {
							$scope.page.name = undefined;
							$scope.page.idc = undefined;
						}
					} else {
						base.alert('删除图片失败');
					}
				})
			})
		}

		$scope.goNext = function() {
			if ($scope.page.modify) {
				$scope.saveOcr(function() {
					$location.path('/credit/query/' + $scope.orderNo);
				})
			} else
				$location.path('/credit/query/' + $scope.orderNo);
		}

		$scope.goPrev = function() {
			if ($scope.page.modify) {
				base.alert('请先保存实名信息');
				return;
			}
			if ($scope.page.maritalStatus == 1) {
				$location.path('/credit/auth/mate/' + $scope.orderNo);
			} else
				$location.path('/credit/query/' + $scope.orderNo);
		}


		$scope.saveOcr = function(cb) {
			if (!$scope.page.name) {
				base.alert('真实姓名不能为空');
				return;
			}
			if (!$scope.page.idc || !base.isIdc($scope.page.idc)) {
				base.alert('身份证号码有误');
				return;
			}
			srv.updateUser($scope.orderNo, $scope.page.name, $scope.page.idc, 4, function(xhr) {
				if (!xhr.code) {
					$scope.page.modify = false;
					if (cb) cb();
				} else {
					base.alert('保存实名信息失败');
				}
			})
		}

		$scope.$watch('page.name', function(newValue, oldValue) {
			if ($scope.reuploaded) {
				$scope.reuploaded = false;
				return;
			}
			if (newValue != oldValue && oldValue != undefined) {
				$scope.page.modify = true;
			}
		});
		$scope.$watch('page.idc', function(newValue, oldValue) {
			if ($scope.reuploaded) {
				$scope.reuploaded = false;
				return
			};
			if (newValue != oldValue && oldValue != undefined) {
				$scope.page.modify = true;
			}
		});
	}
])
kry.controller('ctrl.credit.auth.mate', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
				title: '配偶征信资料',
				menuKey: 'creditConfig'
			})
			//fields
		$scope.orderNo = $params.id;
		$scope.page = {}
		$scope.images = {}
		$scope.waterMark = {};
			//查订单
		srv.qa($scope.orderNo, function(xhr) {
			if (!xhr.code && xhr.data) {
				var qa = xhr.data;
				if (qa) {

					$scope.page.maritalStatus = qa.maritalStatus;
					$scope.page.isAssure = qa.isAssure;

				} else {
					var diag = base.alert('无效的页面访问，点击确认返回征信管理');
					diag.closePromise.then(function() {
						$location.path('/credit');
					})
				}
			}
		})
		srv.queryCredit($scope.orderNo, function(xhr) {
			if (!xhr.code && xhr.data) {
				for (var i = 0; i < xhr.data.length; i++) {
					var row = xhr.data[i];
					if (row.dependentId == 1 && row.creditContent != null && row.creditContent.length > 0) {
						$scope.disabledModify = true;
					}
					if (row.dependentId == 1 && (row.creditStatus == 0 || row.creditStatus == 2)) {
						$scope.disabledModify = true;
					}
				}
			}
		})
		srv.image($scope.orderNo, 3, function(xhr) {
				if (!xhr.code && angular.isArray(xhr.data)) {
					for (var i = 0; i < xhr.data.length; i++) {
						var row = xhr.data[i];
						if (row.url != null) {
							$scope.images[row.materialId] = base.imgPath + row.url;
							if (row.materialId == 21) {
								$scope.page.name = row.name;
								$scope.page.idc = row.cardNum;
							}
							$scope.waterMark[row.materialId] = row.aduitOpinion;
						}
					}
				}
			})
			/**
			 * 上传成功回调
			 * @params {object} xhr
			 * @params {object}
			 */
		$scope.uploadSuccess = function(xhr, cfg) {
			$scope.images[cfg.key] = base.imgPath + xhr.url;
			delete $scope.waterMark[cfg.key];
			if (cfg.key == '21') {
				$scope.page.modify = false;
				$scope.page.name = xhr.name;
				$scope.page.idc = xhr.id_number;
			}
		}

		$scope.viewImage = function(key) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $scope.images[key]
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}
		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}
		$scope.deletefile = function(id) {
			var diag = base.confirm('是否删除图片?');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletefile($scope.orderNo, id, function(xhr) {
					if (!xhr.code) {
						delete $scope.images[id];
						delete $scope.waterMark[id];
						if (id == '21') {
							$scope.page.name = undefined;
							$scope.page.idc = undefined;
						}
					} else {
						base.alert('删除图片失败');
					}
				})
			})
		}

		$scope.goNext = function() {
			if ($scope.page.modify) {
				$scope.saveOcr(function() {
					if ($scope.page.isAssure == 1) {
						$location.path('/credit/auth/guarantor/' + $scope.orderNo);
					} else {
						$location.path('/credit/query/' + $scope.orderNo);
					}
				})
			} else {
				if ($scope.page.isAssure == 1) {
					$location.path('/credit/auth/guarantor/' + $scope.orderNo);
				} else {
					$location.path('/credit/query/' + $scope.orderNo);
				}
			}
		}
		$scope.saveOcr = function() {
			if (!$scope.page.name) {
				base.alert('真实姓名不能为空');
				return;
			}
			if (!$scope.page.idc || !base.isIdc($scope.page.idc)) {
				base.alert('身份证号码有误');
				return;
			}
			srv.updateUser($scope.orderNo, $scope.page.name, $scope.page.idc, 3, function(xhr) {
				if (!xhr.code) {
					$scope.page.modify = false;
				} else {
					base.alert('保存实名信息失败');
				}
			})
		}

		$scope.$watch('page.name', function(newValue, oldValue) {
			if (newValue != oldValue && oldValue != undefined) {
				$scope.page.modify = true;
			}
		});
		$scope.$watch('page.idc', function(newValue, oldValue) {
			if (newValue != oldValue && oldValue != undefined) {
				$scope.page.modify = true;
			}
		});

	}
])
kry.controller('ctrl.credit.auth.query', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
				title: '征信查询',
				menuKey: 'creditConfig'
			})
			//需求：统一的返回接口
			//返回订单的关键信息

		$scope.orderNo = $params.id;
		$scope.page = {};
		$scope.canSelect = true;
		$scope.is4SOrder = false;
		srv.qa($scope.orderNo, function(xhr) {
			if (!xhr.code && xhr.data) {
				var qa = xhr.data;
				if (qa) {
					$scope.page.maritalStatus = qa.maritalStatus;
					$scope.page.isAssure = qa.isAssure;
				} else {
					var diag = base.alert('无效的页面访问，点击确认返回征信管理');
					diag.closePromise.then(function() {
						$location.path('/credit');
					})
				}
			}
		})
		srv.is4SOrder($scope.orderNo,function(result){
			if(result.code == 0){
				if(result.data == "true"){
					$scope.is4SOrder = true;
				}
			}
		})

		function getQueryCredit(orderNo) {
			srv.queryCredit(orderNo, function(xhr) {
				if (!xhr.code) {
					$scope.creditResult = xhr.data;
					if (!xhr.data || xhr.data.length == 0) return
					$scope.showCredit = {};
					$scope.showFuckGo = true;
					for (var i in $scope.creditResult) {
						var c = $scope.creditResult[i];
						if (c.creditContent == null || c.creditContent == '') {
							/*
							if(!$scope.showCredit[c.dependentId]) {
								$scope.showCredit[c.dependentId] = c;
								$scope.showCreditArr = $scope.showCreditArr + 1;
							}
							*/
							if($scope.is4SOrder && (c.creditResultsot == null || c.creditResultsot == '' )){
								$scope.showFuckGo = false;
							}
							if(!$scope.is4SOrder){
								$scope.showFuckGo = false;
							}


						}
						if(!$scope.is4SOrder){
							if (c.creditStatus == 0) {
								c.creditResult = "等待征信查询";
							}
							//是否可以选择银行
							if ( (c.creditStatus == 0 || c.creditStatus == 2)) {
								if($scope.canSelect){
									$scope.canSelect = false;
								}
							}
							if (c.creditStatus == 3) {
								c.creditResult = "征信查询失败，返回修改材料";
							}
						}else {
							if (c.creditResultsot != "") {
								if($scope.canSelect){
									$scope.canSelect = false;
								}
							}else {
								$scope.canSelect = true;
							}
						}


					}

				} else {
					$scope.creditResult = [];
					$scope.showFuckGo = false;
				}
			})
		}

		function getExecution(orderNo) {
			srv.execution(orderNo, function(xhr) {
				if (!xhr.code) {
					$scope.execute = xhr.data;
				} else {
					$scope.execute = [];
				}
			})
		}

		getQueryCredit($scope.orderNo);
		getExecution($scope.orderNo);

		/*
		$scope.checkStatus = function (c) {
			if(c.creditContent == null || c.creditContent == '') {
				if(!$scope.showCredit[c.dependentId]) {
					$scope.showCredit[c.dependentId] = c;
					$scope.showCreditArr = $scope.showCreditArr + 1;	
					//console.log($scope.showCreditArr);
				}
			}
			return c.dependent;
		}*/
		checkOrderBank();

		function checkOrderBank() {
			var isSelectBank = false;
			srv.getOrderBank($scope.orderNo, function(datas) {
				if (!datas.code && datas.data != null) {
					var orderBank = datas.data;
					var parentBank = orderBank.parentBank;
					var bankBranch = orderBank.bank;
					if (bankBranch != "") {
						parentBank += "-" + bankBranch;
					}
					$('.my-bank').html(parentBank);
					$root.selectBank = $scope.orderNo;
					$root.selectBankCode = orderBank.parentBankCode;
				}
			});
		}

		$scope.submitOrder = function() {
			srv.sendorder($scope.orderNo, '', function(xhr) {
				if (!xhr.code) {
					$location.path('/loan');
				} else {
					base.alert(xhr.msg);
				}
			})
		}
		//Mender wq 2016-04-05 查询征信后变为已查客户
		function updateFlowNodeId(type){
			$.ajax({
				url:'../loanOrder/updateQueryOrder.html',
				type:'POST',
				data:{'orderNo':$scope.orderNo,'type':type},
				async:false,
				dataType:'JSON',
				success:function(result){
					if(result != undefined && result.code == 0){

					}else {
						base.alert(result.msg != undefined ?result.msg : "系统异常");
						return false;
					}
				},
				error:function(textStatus){
					console.log(textStatus);
				}
			})
		}

		$scope.submitOrder2 = function(c) {
			//如果没选择银行,不能查征信 wq 2016-01-19
			if ($root.selectBank == undefined || $root.selectBank != $scope.orderNo) {
				base.alert("请先选择银行");
				return false;
			}

			function preClick(v) {
				if (v == undefined) return true;
				if (v.length == 0) {
					base.alert('请输入征信结果');
					return false;
				}
				return true;
			}
			if($scope.is4SOrder){
				var diag = dialog.open({
					templateUrl: 'templates/dialog/dialog.creditidea.htm',
					scope: $scope,
					closeByDocument: false,
					closeByEscape: false,
					preCloseCallback: preClick,
					className: 'ngdialog-theme-input'
				});
				diag.closePromise.then(function(v) {
					if (!v || v.value == undefined) return false;
					var loanUserCredit = v.value;
					if(loanUserCredit.loanCrdtot == undefined || loanUserCredit.loanCrdtot == "" ||
						loanUserCredit.cardCrdtot == undefined || loanUserCredit.cardCrdtot == ""){
						base.alert("贷款逾期总数和信用卡逾期总数不可为空");
						return false;
					}
					if(loanUserCredit.loanCrdtot != undefined && loanUserCredit.loanCrdtot != "" && isNaN(loanUserCredit.loanCrdtot)){
						base.alert("贷款逾期总数必须数字");
						return false;
					}else if(Number(loanUserCredit.loanCrdtot) < 0){
						base.alert("贷款逾期总数必须大于0");
						return false;
					}
					if(loanUserCredit.cardCrdtot != undefined && loanUserCredit.cardCrdtot != "" && isNaN(loanUserCredit.cardCrdtot)){
						base.alert("信用卡逾期总数必须数字");
						return false;
					}else if(Number(loanUserCredit.cardCrdtot) < 0){
						base.alert("信用卡逾期总数必须大于0");
						return false;
					}
					if(loanUserCredit.leftNumot != undefined && loanUserCredit.leftNumot != "" && isNaN(loanUserCredit.leftNumot)){
						base.alert("我行专项卡分期笔数必须数字");
						return false;
					}else if(Number(loanUserCredit.leftNumot) < 0){
						base.alert("我行专项卡分期笔数必须大于0");
						return false;
					}
					if(loanUserCredit.leftAmountot != undefined && loanUserCredit.leftAmountot != "" && isNaN(loanUserCredit.leftAmountot)){
						base.alert("未结清余额必须是数字");
						return false;
					}else if(Number(loanUserCredit.leftAmountot) < 0){
						base.alert("未结清余额必须大于0");
						return false;
					}
					updateFlowNodeId(c.dependentId);
					var loanUserCredit1 = 'loanUserCredit.loanCrdtot='+ v.value.loanCrdtot+'&loanUserCredit.cardCrdtot='+v.value.loanCrdtot+'&loanUserCredit.leftNumot='+ v.value.leftNumot+'&loanUserCredit.leftAmountot='+ v.value.leftAmountot+'&loanUserCredit.creditLevel='+ v.value.creditLevel;
					var params = "orderNo="+$scope.orderNo;
					params += "&dependentId="+c.dependentId;
					params += "&creditResult="+v.value.idea;
					params += "&"+loanUserCredit1;
					$.ajax({
						url:'../approval/carShopCommitCredit.html',
						type:'POST',
						data:params,
						dataType:'JSON',
						success:function(result){
							if(result.code == 0){
								getQueryCredit($scope.orderNo);
							}else {
								base.alert(result.msg != ""? result.msg : "系统异常")
							}
						},
						error:function(textStatus){
							console.log(textStatus);
						}
					})
					srv.pushExec($scope.orderNo, c.dependentId, function(xhr) {
						if (!xhr.code) {
							getExecution($scope.orderNo);
						} else {
							base.alert(xhr.msg);
						}
					})
				});
			}else {
				if ($root.selectBankCode == "00000001") {
					var queryCredit = true;
					//如果是反担保人
					if(c.dependentId == 2){
						var diag1 = base.confirm("此反担保人是否发送银行查询征信?");
						diag1.closePromise.then(function(v) {
							if (v.value != 1){
								var diag = dialog.open({
									templateUrl: 'templates/dialog/dialog.creditidea.htm',
									scope: $scope,
									closeByDocument: false,
									closeByEscape: false,
									preCloseCallback: preClick,
									className: 'ngdialog-theme-input'
								});
								diag.closePromise.then(function(v) {
									if (!v || v.value == undefined) return false;
									var loanUserCredit = v.value;

									if(loanUserCredit.loanCrdtot == undefined || loanUserCredit.loanCrdtot == "" ||
										loanUserCredit.cardCrdtot == undefined || loanUserCredit.cardCrdtot == ""){
										base.alert("贷款逾期总数和信用卡逾期总数不可为空");
										return false;
									}

									if(loanUserCredit.loanCrdtot != undefined && loanUserCredit.loanCrdtot != "" && isNaN(loanUserCredit.loanCrdtot)){
										base.alert("贷款逾期总数必须数字");
										return false;
									}else if(Number(loanUserCredit.loanCrdtot) < 0){
										base.alert("贷款逾期总数必须大于0");
										return false;
									}
									if(loanUserCredit.cardCrdtot != undefined && loanUserCredit.cardCrdtot != "" && isNaN(loanUserCredit.cardCrdtot)){
										base.alert("信用卡逾期总数必须数字");
										return false;
									}else if(Number(loanUserCredit.cardCrdtot) < 0){
										base.alert("信用卡逾期总数必须大于0");
										return false;
									}
									if(loanUserCredit.leftNumot != undefined && loanUserCredit.leftNumot != "" && isNaN(loanUserCredit.leftNumot)){
										base.alert("我行专项卡分期笔数必须数字");
										return false;
									}else if(Number(loanUserCredit.leftNumot) < 0){
										base.alert("我行专项卡分期笔数必须大于0");
										return false;
									}
									if(loanUserCredit.leftAmountot != undefined && loanUserCredit.leftAmountot != "" && isNaN(loanUserCredit.leftAmountot)){
										base.alert("未结清余额必须是数字");
										return false;
									}else if(Number(loanUserCredit.leftAmountot) < 0){
										base.alert("未结清余额必须大于0");
										return false;
									}
									updateFlowNodeId(c.dependentId);
									srv.pushcredit($scope.orderNo, c.dependentId, v.value.idea|| '',v.value, -1, function(xhr) {
										if (!xhr.code) {
											getQueryCredit($scope.orderNo);
										} else {
											base.alert(xhr.msg);
										}
									})
									srv.pushExec($scope.orderNo, c.dependentId, function(xhr) {
										if (!xhr.code) {
											getExecution($scope.orderNo);
										} else {
											base.alert(xhr.msg);
										}
									})
								})
							}else{
								updateFlowNodeId(c.dependentId);
								srv.pushcredit($scope.orderNo, c.dependentId, "","",1, function(xhr) {
									if (!xhr.code) {

										getQueryCredit($scope.orderNo);
									} else {
										base.alert(xhr.msg);
									}
								})
								//查法院记录
								srv.pushExec($scope.orderNo, c.dependentId, function(xhr) {
									if (!xhr.code) {
										getExecution($scope.orderNo);
									} else {
										base.alert(xhr.msg);
									}
								})
							}

						});
					}else{
						updateFlowNodeId(c.dependentId);
						srv.pushcredit($scope.orderNo, c.dependentId, "","",1, function(xhr) {
							if (!xhr.code) {
								getQueryCredit($scope.orderNo);
							} else {
								base.alert(xhr.msg);
							}
						})
						//查法院记录
						srv.pushExec($scope.orderNo, c.dependentId, function(xhr) {
							if (!xhr.code) {
								getExecution($scope.orderNo);
							} else {
								base.alert(xhr.msg);
							}
						})

					}
				} else {
					var diag = dialog.open({
						templateUrl: 'templates/dialog/dialog.creditidea.htm',
						scope: $scope,
						closeByDocument: false,
						closeByEscape: false,
						preCloseCallback: preClick,
						className: 'ngdialog-theme-input'
					});
					diag.closePromise.then(function(v) {
						if (!v || v.value == undefined) return false;
						var loanUserCredit = v.value;
						if(loanUserCredit.loanCrdtot == undefined || loanUserCredit.loanCrdtot == "" ||
							loanUserCredit.cardCrdtot == undefined || loanUserCredit.cardCrdtot == ""){
							base.alert("贷款逾期总数和信用卡逾期总数不可为空");
							return false;
						}
						if(loanUserCredit.loanCrdtot != undefined && loanUserCredit.loanCrdtot != "" && isNaN(loanUserCredit.loanCrdtot)){
							base.alert("贷款逾期总数必须数字");
							return false;
						}else if(Number(loanUserCredit.loanCrdtot) < 0){
							base.alert("贷款逾期总数必须大于0");
							return false;
						}
						if(loanUserCredit.cardCrdtot != undefined && loanUserCredit.cardCrdtot != "" && isNaN(loanUserCredit.cardCrdtot)){
							base.alert("信用卡逾期总数必须数字");
							return false;
						}else if(Number(loanUserCredit.cardCrdtot) < 0){
							base.alert("信用卡逾期总数必须大于0");
							return false;
						}
						if(loanUserCredit.leftNumot != undefined && loanUserCredit.leftNumot != "" && isNaN(loanUserCredit.leftNumot)){
							base.alert("我行专项卡分期笔数必须数字");
							return false;
						}else if(Number(loanUserCredit.leftNumot) < 0){
							base.alert("我行专项卡分期笔数必须大于0");
							return false;
						}
						if(loanUserCredit.leftAmountot != undefined && loanUserCredit.leftAmountot != "" && isNaN(loanUserCredit.leftAmountot)){
							base.alert("未结清余额必须是数字");
							return false;
						}else if(Number(loanUserCredit.leftAmountot) < 0){
							base.alert("未结清余额必须大于0");
							return false;
						}
						updateFlowNodeId(c.dependentId);
						srv.pushcredit($scope.orderNo, c.dependentId, v.value.idea|| '',v.value,1 , function(xhr) {
							if (!xhr.code) {

								getQueryCredit($scope.orderNo);
							} else {
								base.alert(xhr.msg);
							}
						})
						srv.pushExec($scope.orderNo, c.dependentId, function(xhr) {
							if (!xhr.code) {
								getExecution($scope.orderNo);
							} else {
								base.alert(xhr.msg);
							}
						})
					})
				}
			}
		}

		$scope.reExec = function(e) {
			if ($scope.execing) return;
			$scope.execing = true;
			srv.repush($scope.orderNo, e.executionId, function(xhr) {
				if (!xhr.code) {
					getExecution($scope.orderNo);
				} else {
					base.alert(xhr.msg);
				}
				$scope.execing = false;
			})
		}

		$scope.showExecDetail = function(e) {
			dialog.open({
				templateUrl: 'templates/dialog/dialog.execution.htm',
				scope: $scope,
				closeByDocument: false,
				data: {
					execId: e.executionId
				},
				controller: 'dialog.execution'
			})
		}

		$scope.getUrl = function() {
			return !!$scope.page.isAssure ? '#/credit/auth/guarantor/' :
				($scope.page.maritalStatus == 1 ? '#/credit/auth/mate/' : '#/credit/qa/');
		}

		//选择银行
		$scope.selectBank = function() {
			if (!$scope.canSelect) {
				return false;
			}
			var diag = dialog.open({
				templateUrl: './templates/dialog/dialog.banklist.htm',
				scope: $scope,
				controller: "ctrl.credit.banklist",
				className: 'ngdialog-theme-bank'
			});
			diag.closePromise.then(function(v) {
				if (!v || v.value == undefined) return false;
				//getQueryCredit($scope.orderNo,1);
			})
		}


		/*
		$scope.$watch(function() {
			return $scope.showCreditArr;
		}, function(value) {
			if(value == 0) $scope.showFuckGo = true;
			else $scope.showFuckGo = false;	
		});
*/
	}
])
kry.controller('ctrl.credit.auth.self', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
				title: '申请人征信资料',
				menuKey: 'creditConfig'
			})
			//fields
		$scope.orderNo = $params.id;
		$scope.page = {}
		$scope.images = {}
			//查订单
		srv.qa($scope.orderNo, function(xhr) {
			if (!xhr.code && xhr.data) {
				var qa = xhr.data;
				if (qa) {
					$scope.page.maritalStatus = qa.maritalStatus;
					$scope.page.isAssure = qa.isAssure;
				}
			}
		})
		srv.image($scope.orderNo, 1, function(xhr) {
			if (!xhr.code && angular.isArray(xhr.data)) {
				for (var i = 0; i < xhr.data; i++) {
					var row = xhr.data[i];
					$scope.images[base.imgType[row.materialId]] = row.url;
				}
			}
		})

		/**
		 * 上传成功回调
		 * @params {object} xhr
		 * @params {object}
		 */
		$scope.uploadSuccess = function(xhr, cfg) {
			$scope.images[cfg.key] = xhr.url;
		}

		$scope.viewImage = function(key) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $scope.images[key]
				},
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}
		$scope.deletefile = function(id) {
			srv.deletefile($scope.orderNo, id, function(xhr) {

			})
		}

		$scope.goNext = function() {
			if ($scope.page.maritalStatus == 1) {
				$location.path('/credit/auth/mate/' + $scope.orderNo);
			} else if ($scope.page.isAssure == 1) {
				$location.path('/cerdit/auth/guarantor/' + $scope.orderNo);
			} else {
				$location.path('/credit/auth/query/' + $scope.orderNo);
			}
		}
	}
])
kry.controller('ctrl.credit', [
	'$scope',
	'$rootScope',
	'$location',
	'$routeParams',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$location,
		$params,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '征信管理',
			menuKey: 'creditConfig'
		})

		$scope.pageParams = {
			'loanOrderQuery.flowNodeId': parseInt($location.$$search.type) || 1,
			'pageNum': 1,
			'loanOrderQuery.idCard': '',
			'loanOrderQuery.realName': '',
			'loanOrderQuery.orderNo': '',
			'loanOrderQuery.creditStatus': "-1"
		};

		$scope.page = {}

		$scope.creditStatus = [
			'等待征信结果',
			'征信查询成功',
			'征信查询失败'
		]

		function getList() {
			srv.creditList($scope.pageParams, function(xhr) {
				if (xhr.total > 0) {
					$scope.page.loan = xhr.rows;
					$scope.pageParams['pageNum'] = xhr.page;
					$scope.page.pageSize = xhr.pageSize;
					$scope.page.total = xhr.total;
					$scope.page.totalPage = parseInt(xhr.total / xhr.pageSize) + (xhr.total % xhr.pageSize > 0 ? 1 : 0);
					$scope.page.totalPagesArr = [];
					for (var i = 0; i < $scope.page.totalPage; i++) {
						$scope.page.totalPagesArr.push(i);
					}
				} else {
					$scope.page.loan = [];
					$scope.page.total = 0;
				}
			})
		}
		getList();

		srv.tiper(1, function(xhr) {
			if (!xhr.code) {
				$scope.tipers = xhr.data;
			}
		})

		$scope.isStatus = function(code) {
			return $scope.pageParams['loanOrderQuery.flowNodeId'] == code;
		}

		$scope.search = function() {
			$scope.pageParams['pageNum'] = 1;
			getList();
		}

		$scope.pagePrev = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == 1) return;
			$scope.pageParams['pageNum'] = cp - 1;
			getList();
		}

		$scope.pageNext = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == $scope.page.totalPage) return;
			$scope.pageParams['pageNum'] = cp + 1;
			getList();
		}

		$scope.setPage = function(p) {
			if (p == $scope.pageParams['pageNum']) return;
			$scope.pageParams['pageNum'] = p;
			getList();
		}

		$scope.deleteRow = function(row, idx) {
			var diag = base.confirm('是否删除该行？');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletecredit(row.cols.orderNo, function(xhr) {
					if (!xhr.code) {
						$scope.tipers[$scope.pageParams['loanOrderQuery.flowNodeId']]--;
						$scope.page.loan.splice(idx, 1);
					} else {
						base.alert('删除记录失败');
					}
				})
			});
		}
		$scope.setBackStatus = function(code) {
			$scope.pageParams['loanOrderQuery.flowNodeId'] = code;
			$scope.pageParams['pageNum'] = 1; //tab切换时重置页码。
			getList();
		}

	}
])
kry.controller('ctrl.credit.new', [
	'$scope',
	'$rootScope',
	'$location',
	'$routeParams',
	'base',
	'srv',
	'ngDialog',
	function(
		$scope,
		$root,
		$location,
		$params,
		base,
		srv,
		diag
	) {
		$root.setSite({
			title: '客户绑定',
			menuKey: 'creditConfig'
		})
		$scope.flowdId = 1;
		$scope.orderNo = $params.id;
		$scope.page = {};
		$scope.images = {};
		$scope.waterMark = {};
		$root.selectBank = "false";
		$scope.canSelect = true;
		srv.qa($scope.orderNo, function(xhr) {
			if (!xhr.code && xhr.data) {
				var qa = xhr.data;
				if (qa) {
					$scope.page.maritalStatus = qa.maritalStatus;
					$scope.page.isAssure = qa.isAssure;
				}
			}
		})
		srv.queryCredit($scope.orderNo, function(xhr) {
			if (!xhr.code && xhr.data) {
				for (var i = 0; i < xhr.data.length; i++) {
					var row = xhr.data[i];
					if (row.dependentId == 0 && row.creditContent != null && row.creditContent.length > 0) {
						$scope.disabledModify = true;
					}
					if (row.dependentId == 0 && (row.creditStatus == 0 || row.creditStatus == 2)) {
						$scope.disabledModify = true;
					}
					//Mender wq 2016-03-30 是否能选择银行
					if(row.creditStatus == 0 || row.creditStatus == 2){
						if($scope.canSelect){
							$scope.canSelect = false;
						}
					}

				}
			}
		})
		srv.image($scope.orderNo, 2, function(xhr) {
				if (!xhr.code && angular.isArray(xhr.data)) {
					for (var i = 0; i < xhr.data.length; i++) {
						var row = xhr.data[i];
						if (row.url != null) {
							$scope.images[row.materialId] = base.imgPath + row.url;
							if (row.materialId == 1) {
								$scope.uploaded = true;
								$scope.page.idc = row.cardNum;
								$scope.page.name = row.name;

							}
							$scope.waterMark[row.materialId] = row.aduitOpinion;
						}
					}
				}
			})
			/**
			 * 执行上传
			 * 身份证正面
			 * @params {object} $this file对象
			 */
		$scope.uploadSuccess = function(xhr, cfg) {
				$scope.images[cfg.key] = base.imgPath + xhr.url;
				delete $scope.waterMark[cfg.key];
			if(xhr.code == -2){
				base.alert(xhr.msg);
				return false;
			}
				if (cfg.key == '1') {
					$scope.uploaded = true;
					$scope.page.modify = false;
					$scope.page.name = xhr.name;
					$scope.page.idc = xhr.id_number;
					srv.newcheck($scope.page.idc, function(xhr) {
						if (!xhr.code && !!xhr.data) {
							var diag = base.confirm('已经提交了申请人 ' + xhr.data.realName + ' 的订单，目前为' + xhr.data.nodeName + '，是否要重新申请？');
							diag.closePromise.then(function(v) {
								if (v.value == 1) {
									return;
								} else {
									srv.cancelorder($scope.orderNo, function(res) {
										if (!res.code) {
											$location.path('/');

											return;
										}
										base.alert('取消订单失败, 请重试');
									})
								}
							})
						} else {
							return;
						}
					})
				}

			}
			/**
			 * 查看大图
			 */
		$scope.viewImage = function(key) {
			diag.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $scope.images[key]
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			});
		}

		$scope.deletefile = function(key) {
				var diag = base.confirm('是否删除图片?');
				diag.closePromise.then(function(v) {
					if (v.value != 1) return;
					srv.deletefile($scope.orderNo, key, function(xhr) {
						if (!xhr.code) {
							delete $scope.images[key];
							delete $scope.waterMark[key];
							if (key == '1') {
								$scope.uploaded = false;
								$scope.page.name = undefined;
								$scope.page.idc = undefined;

							}
						} else {
							base.alert('删除图片失败');
						}
					})
				})
			}
			/**
			 * 提交
			 */
		$scope.submitCustomer = function() {
			if (!$scope.uploaded) {
				base.alert('请上传身份证正面照片');
				return
			};
			if (!$scope.page.name || !$scope.page.idc) {
				base.alert('真实姓名或身份证不能为空');
				return;
			}
			if (!base.isIdc($scope.page.idc)) {
				base.alert('身份证号码有误');
				return;
			}
			if ($scope.page.modify) {
				base.alert('请先保存实名信息');
				return;
			}
			$location.path('/credit/qa/' + $params.id);
			/*
			srv.newcheck($scope.page.idc, function(xhr) {
				if(!xhr.code && !!xhr.data) {
					var diag = base.confirm('已经提交了申请人 '+xhr.data.realName+' 的订单，目前为'+xhr.data.nodeName+'，是否要重新申请？');
					diag.closePromise.then(function(v) {
						if(v.value == 1) {
							$location.path('/credit/qa/' + $params.id);
						} else {
							srv.cancelorder($scope.orderNo, function(res) {
								if(!res.code) {
									$location.path('/');
								}
								base.alert('取消订单失败, 请重试');
							})
						}
					})
				} else {
					$location.path('/credit/qa/' + $params.id);
				}
			})
			*/
		}

		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.saveOcr = function() {
			if (!$scope.page.name) {
				base.alert('真实姓名不能为空');
				return;
			}
			if (!$scope.page.idc || !base.isIdc($scope.page.idc)) {
				base.alert('身份证号码有误');
				return;
			}

			function updater() {
				$.ajax({
					url:'../loanOrder/checkOrderCount.html',
					type:'POST',
					data:{'idCard':$scope.page.idc},
					dataType:'JSON',
					async:false,
					success:function(result){
						if(result.code == 0){
							srv.updateUser($scope.orderNo, $scope.page.name, $scope.page.idc, 2, function(xhr) {
								if (!xhr.code) {
									$scope.page.modify = false;
									newcheck();
								} else {
									base.alert('保存实名信息失败');
								}
							})
						}else{
							base.alert(result.msg);
							return;
						}
					},
					error:function(textStatus){
						console.log(textStatus);
					}
				})
			}
			function  newcheck(){
				srv.newcheck($scope.page.idc, function(xhr) {
					if (!xhr.code && !!xhr.data) {
						var diag = base.confirm('已经提交了申请人 ' + xhr.data.realName + ' 的订单，目前为' + xhr.data.nodeName + '，是否要重新申请？');
						diag.closePromise.then(function(v) {
							if (v.value == 1) {
								//updater();//先保存再检查wq
							} else {
								srv.cancelorder($scope.orderNo, function(res) {
									if (!res.code) {
										$location.path('/');
										return;
									}
									base.alert('取消订单失败, 请重试');
								})
							}
						})
					} else {
						//updater();
					}
				})
			}
			updater();

		}

		$scope.selectBank = function() {
			//			$location.path("/dialog/dialog.banklist.htm");
			if (!$scope.uploaded) {
				base.alert('请上传身份证正面照片');
				return
			};
			if (!$scope.canSelect) {
				return false;
			}
			diag.open({
				templateUrl: './templates/dialog/dialog.banklist.htm',
				scope: $scope,
				controller: "ctrl.credit.banklist",
				className: 'ngdialog-theme-bank'
			});
		}

		//先查询是否已选银行
		srv.getOrderBank($scope.orderNo, function(datas) {
			if (!datas.code && datas.data != null) {
				var orderBank = datas.data;
				var parentBank = orderBank.parentBank;
				var bankBranch = orderBank.bank;
				if (bankBranch != undefined && bankBranch != "") {
					parentBank += "-" + bankBranch;
				}
				$('.my-bank').html(parentBank);
			}
		});

		//$scope.$watch('page.name', function(newValue, oldValue) {
		//	if (newValue != oldValue && newValue != undefined && oldValue != undefined ) {
		//		$scope.page.modify = true;
		//	}
		//});
		//$scope.$watch('page.idc', function(newValue, oldValue) {
		//	if (newValue != oldValue && newValue != undefined && oldValue != undefined) {
		//		$scope.page.modify = true;
		//	}
		//});
		//Mender wq 2016-03-21
		$scope.showSaveBtn = function(){
			$scope.page.modify = true;
		}
	}
])
kry.controller('ctrl.credit.banklist', [
	'$scope',
	'$rootScope',
	'srv',
	'base',
	function($scope, $rootScope, srv, base) {
		$scope.bankinfo = '';
		$scope.areaShow = true;
		$scope.branchShow = true;
		$scope.mySelectBank={};
		$scope.mySelectArea={};
		$scope.mySelectBranch={};
		var agencyParentId = 0;
		var mybankAreaCode;
		var myBankBranchCode;
		var params = {
			agencyParentId: agencyParentId
		};
		//初始化数据
		initilizeData();
		$scope.getArea = function() {
			agencyParentId = $scope.bankinfo.bank;
			if (agencyParentId == -1 || agencyParentId == null) {
				$scope.areaShow = false;
				$scope.branchShow = false;
				$scope.bankinfo.area = -1;
				$scope.bankinfo.branch = -1;
			} else {
				$scope.areaShow = true;
				//$scope.branchShow = true;
				$scope.bankinfo.area = null;
				$scope.bankinfo.branch = null;
			}
			params.agencyParentId = agencyParentId;
			srv.queryAgencyBank(params, function(datas) {
				if (!datas.code && datas.data != null) {
					var areaData = datas.data;
					$scope.arealist = areaData;
				}
			})
		}
		$scope.getBranch = function() {
			agencyParentId = $scope.bankinfo.area;
			if(null == agencyParentId || agencyParentId == undefined){
				$scope.branchShow = false;
			}else{
				$scope.branchShow = true;
			}
			params.agencyParentId = agencyParentId;
			srv.queryAgencyBank(params, function(datas) {
				if (!datas.code && datas.data != null) {
					var branchData = datas.data;
					$scope.branchlist = branchData;
				}
			});
		}
		$scope.selectBankSubmit = function() {
			var mySelect;
			if($scope.bankinfo.bank != -1 && (null == $scope.bankinfo.bank || null == $scope.bankinfo.area || null == $scope.bankinfo.branch)){
				base.alert("请填入完整的银行信息");
				return;
			}
			getBankInfo();
			mySelect = $scope.mySelectBank.agencyName;
			if($scope.mySelectBank.agencyId == -1){
				mybankAreaCode = -1;
				myBankBranchCode = -1
			}else {
				getAreaInfo();
				getBranchInfo();
				mybankAreaCode = $scope.mySelectArea.agencyCode;
				myBankBranchCode = $scope.mySelectBranch.agencyCode;
				mySelect += "-"+$scope.mySelectBranch.agencyName;
			}
			srv.updateOrderBank($scope.orderNo, mybankAreaCode, myBankBranchCode, function(datas) {
				if (!datas.code) {
					base.alert("选择银行成功");
					$scope.closeThisDialog(1)
					$('.my-bank').html(mySelect);
					$rootScope.selectBank = $scope.orderNo;
					$rootScope.selectBankCode = $scope.mySelectBank.agencyCode;
				}
			});
		}
		//*** 添加的js代码一定要放在这3个上面 ***
		function initilizeData() {
			params = {
				'agencyBank.agencyParentId': 0
			};
			var myData = queryAgencyBankList(params);
			if (myData != undefined && myData != null) {
				$scope.banklist = myData;
			}
			getMyOrderBank();
		}

		function getMyOrderBank() {
			$.ajax({
				url: '../agencyBank/getAgencyBankByOrderNo.html',
				type: 'POST',
				data: {
					'orderNo': $scope.orderNo
				},
				dataType: 'json',
				async: false,
				success: function(datas) {
					if (datas.code == 0 && datas.data != null) {
						var myData = datas.data;
						var _banklist = myData.bankList;
						var _areaList = myData.areaList;
						var _branchList = myData.branchList;

						params = {
							agencyParentId: _banklist.agencyId
						}
						myData = queryAgencyBankList(params);
						if (myData != undefined && myData != null && myData.length > 0) {
							$scope.arealist = myData;
							$scope.bankinfo = {
								area: _areaList.agencyId
							};
							params = {
								agencyParentId: _areaList.agencyId
							}
							myData = queryAgencyBankList(params);
							if (myData != undefined && myData != null && myData.length > 0) {
								$scope.branchlist = myData;
							}
						}
						if (_areaList != undefined && _areaList != null) {
							$scope.bankinfo = {
								bank: _banklist.agencyId,
								area: _areaList.agencyId,
								branch: _branchList.agencyId
							};
						} else {
							$scope.areaShow = false;
							$scope.branchShow = false;
							$scope.bankinfo = {
								bank: _banklist.agencyId
							};
						}

					} else {
						if (datas.msg != undefined && datas.msg != null && datas.msg != "") {
							base.alert(datas.msg);
						}

					}
				}
			})
		}

		function queryAgencyBankList(params) {
			var myData;
			$.ajax({
				url: '../agencyBank/queryAgencyBankList.html',
				type: 'POST',
				data: params,
				dataType: 'json',
				async: false,
				success: function(datas) {
					if (datas.code == 0 && datas.data != null) {
						myData = datas.data;
					} else {
						base.alert(datas.msg);
					}
				}
			});
			return myData;

		}

		function getBankInfo(){
			$.map($scope.banklist, function(bank_c, key) {
				if (bank_c.agencyId == $scope.bankinfo.bank) {
					$scope.mySelectBank = bank_c;
				}
			});
		}
		function getAreaInfo(){
			$.map($scope.arealist, function(area_c, key) {
				if (area_c.agencyId == $scope.bankinfo.area) {
					$scope.mySelectArea = area_c;
				}
			});
		}
		function getBranchInfo(){
			$.map($scope.branchlist, function(branch_c, key) {
				if (branch_c.agencyId == $scope.bankinfo.branch) {
					$scope.mySelectBranch = branch_c
				}
			});
		}
	}
])
kry.controller('ctrl.credit.qa', [
	'$scope',
	'$rootScope',
	'$location',
	'$routeParams',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$params,
		srv,
		base
	) {
		$root.setSite({
			title: '完善担保人信息',
			menuKey: 'creditConfig'
		})

		$scope.orderNo = $params.id;
		/**
		 * 问卷数据
		 */
		$scope.page = {
			maritalStatus: undefined,
			houseStatus: undefined,
			licenseType: undefined,
			isAssure: undefined,
			isServe: undefined,
			isSecond: undefined,
			isEnterprise: undefined
		}

		$scope.copy = {
				maritalStatus: 0,
				isAssure: 0
			}
			/*
			 * 公积金查询
			 */
		$scope.fund = {
				city: undefined,
				area: undefined,
				formdb: {}
			}
			//拉取订单信息
		srv.qa($scope.orderNo, function(xhr) {
			if (!xhr.code && xhr.data) {
				var qa = xhr.data;
				if (qa) {
					$scope.page.maritalStatus = qa.maritalStatus;
					$scope.copy.maritalStatus = qa.maritalStatus;
					$scope.page.houseStatus = qa.houseStatus;
					$scope.page.licenseType = qa.licenseType;
					$scope.page.isAssure = qa.isAssure;
					$scope.copy.isAssure = qa.isAssure;
					$scope.page.isServe = qa.isServe;
					$scope.page.isSecond = qa.isSecond;
					$scope.page.isEnterprise = qa.isEnterprise;
					if (qa.areaId) {
						$scope.fund.city = qa.cityId;
						$scope.fund.area = qa.areaId;
						if (qa.account) {
							$scope.fund.formdb.account = qa.account;
						}
						if (qa.password) $scope.fund.formdb.password = qa.password;
						//	$scope.$apply($scope.fund.formdb);
					}
				}
			} else {
				var diag = base.alert('无效的订单号码');
				diag.closePromise.then(function() {
					$location.path('/');
				})
				return;
			}
		})


		srv.city(function(xhr) {
			if (!xhr.code) {
				$scope.citys = xhr.data;
			}
		});
		/**
		 * 获取区域
		 * @params {int} id 城市id
		 */
		function getArea(id) {
			if (id == undefined) return;
			srv.area(id, function(xhr) {
				if (!xhr.code) {
					$scope.areas = xhr.data;
				} else {
					base.alert('获取区域信息失败，请重试');
				}
			})
		}
		/**
		 * 获取公积金查询
		 * @params {int} id 区域id
		 */
		function getFund(id) {
			if (id == undefined) return;
			srv.fund(id, function(xhr) {
				if (!xhr.code) {
					$scope.funds = xhr.data;
				} else {
					base.alert('获取公积金查询数据失败，请重试')
				}
			})
		}

		$scope.isPassword = function(f) {
			return !!~f.datamode.indexOf('密码');
		}
		$scope.isIdc = function(f) {
			return !!~f.datamode.indexOf('身份证');
		}
		$scope.isAccount = function(f) {
			return !$scope.isPassword(f) && !$scope.isIdc(f);
		}
		$scope.direct2Self = function() {
			$scope.submitQA(function() {
				$location.path('/credit/new/' + $scope.orderNo);
			})
		}
		$scope.direct2mate = function() {
			$scope.submitQA(function() {
				$location.path('/credit/auth/mate/' + $scope.orderNo);
			});
		}

		$scope.direct2guarantor = function() {
			$scope.submitQA(function() {
				$location.path('/credit/auth/guarantor/' + $scope.orderNo);
			})
		}

		/**
		 * 提交问卷
		 */
		$scope.submitQA = function(cb) {
			var data = {},
				bset = false;
			if ($scope.page.maritalStatus != undefined) {
				bset = true;
				data['loanUser.maritalStatus'] = $scope.page.maritalStatus;
			}
			if ($scope.page.houseStatus != undefined) {
				bset = true;
				data['loanUser.houseStatus'] = $scope.page.houseStatus;
			}
			if ($scope.page.licenseType != undefined) {
				bset = true;
				data['loanUser.licenseType'] = $scope.page.licenseType;
			}
			if ($scope.page.isAssure != undefined) {
				bset = true;
				data['loanUser.isAssure'] = $scope.page.isAssure;
			}
			if ($scope.page.isEnterprise != undefined) {
				bset = true;
				data['loanUser.isEnterprise'] = $scope.page.isEnterprise;
			}
			if ($scope.page.isServe != undefined) {
				bset = true;
				data['loanUser.isServe'] = $scope.page.isServe;
			}
			if ($scope.page.isSecond != undefined) {
				bset = true;
				data['loanUser.isSecond'] = $scope.page.isSecond;
			}
			if ($scope.fund.city) {
				bset = true;
				data['loanUser.cityId'] = $scope.fund.city;
			}
			if ($scope.fund.area) {
				bset = true;
				data['loanUser.areaId'] = $scope.fund.area;
				if ($scope.fund.formdb) {
					for (var f in $scope.fund.formdb) {
						if (f == 'password') {
							data['loanUser.password'] = $scope.fund.formdb[f];
						} else {
							data['loanUser.account'] = $scope.fund.formdb[f];
						}
					}
				}
			}
			if (bset) data.type = 'customer';
			else {
				if (cb) {
					cb();
				} else {
					$location.path('/credit/query/' + $params.id);
				}
				return;
			};
			data['loanUser.orderNo'] = $scope.orderNo;
			//data.loanUser = angular.merge(data.loanUser, $scope.page);
			srv.customerQA(data, function(xhr) {
				if (!xhr.code) {
					if (cb) {
						cb();
					} else {
						var url = '/credit/query/';
						if ($scope.page.maritalStatus == 1) {
							url = '/credit/auth/mate/'
						} else if ($scope.page.isAssure == 1) {
							url = '/credit/auth/guarantor/'
						}
						$location.path(url + $params.id);
					}
				} else {
					base.alert('提交问卷失败，' + xhr.msg);
				}
			})
		}

		$scope.preSubmit = function() {
			$scope.submitQA(function() {
				$location.path('/credit/new/' + $scope.orderNo);
			})
		}

		$scope.goQuery = function() {
			$scope.submitQA(function() {
				$location.path('/credit/query/' + $scope.orderNo);
			})
		}

		$scope.$watch(function() {
			return $scope.fund.area;
		}, function(val) {
			$scope.fund.form = {};
			getFund(val);
		})

		$scope.$watch(function() {
			return $scope.fund.city;
		}, function(val) {
			$scope.areas = [];
			if (!val) return;
			getArea(val);
		})
	}
])
kry.controller('ctrl.customer.auth', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '审核意见',
			menuKey: 'myCustomer'
		})

		$scope.orderNo = $params.orderNo;
		srv.orderStatus($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.orderStatus = xhr.data;
			}
		})
		srv.auth($scope.orderNo, function(xhr) {
			if (!xhr.code)
				$scope.authRes = xhr.data;
		})

		$scope.completeInfo = function() {
			var followId = $scope.orderStatus.flowId,
				status = $scope.orderStatus.backStatus,
				url;
			//alert(url);
			if (followId == 1) {
				url = '/credit/query/'
			} else if (followId == 2) {
				if (status == 0) {
					url = '/loan/info/'
				} else if (status == 1) {
					url = '/loan/srv/'
				} else if (status == 2) {
					url = '/loan/risk/'
				}
			} else if (followId == 0) {
				if (status == 0) {
					url = '/family/info/'
				} else if (status == 2) {
					url = '/family/risk/'
				}
			} else if (followId == 5) {
				if (status == 0) {
					url = '/contract/info/'
				} else if (status == 2) {
					url = '/contract/risk/'
				}
			} else if (followId == 8) {
				if (status == 0) {
					url = '/car/info/'
				} else if (status == 1) {
					url = '/car/srv/'
				} else if (status == 2) {
					url = '/car/risk/'
				}
			} else if (followId == 10) {
				if (status == 0) {
					url = '/register/info/'
				} else if (status == 1) {
					url = '/register/srv/'
				} else if (status == 2) {
					url = '/register/risk/'
				}
			}
			if (url) {
				$location.path(url + $scope.orderNo);
			}
		}
	}
])
kry.controller('ctrl.customer.car', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '我的客户',
			menuKey: 'myCustomer'
		})

		$scope.orderNo = $params.orderNo;
		srv.orderStatus($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.orderStatus = xhr.data;
			}
		})
		srv.carInfo($scope.orderNo, 8, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length > 0) {
					$scope.infoList = xhr.data[0].table;
					$scope.infoImages = xhr.data[0].images,
						$scope.names = xhr.data[0].names;
				}
			} else {
				$scope.infoList = [];
				$scope.infoImages = [];
				$scope.names = [];
			}
		})

		$scope.showImages = function($event) {
			if (!$scope.infoImages || $scope.infoImages.length == 0) return;
			$scope.nowImages = $scope.infoImages;
			$scope.nowNames = $scope.names;
			$scope.nowImageIdx = 0;
			$scope.rotateImgCss = 0;
			dialog.open({
				templateUrl: 'templates/dialog/dialog.viewimage.swiper.htm',
				scope: $scope,
				className: 'ngdialog-theme-fullview'
			})
			$event.stopPropagation();
		}

		$scope.prevImage = function() {
			$scope.rotateImgCss = 0;
			$scope.nowImageIdx = $scope.nowImageIdx > 0 ? $scope.nowImageIdx - 1 : 0;
		}

		$scope.nextImage = function() {
			$scope.rotateImgCss = 0;
			$scope.nowImageIdx = $scope.nowImageIdx + ($scope.nowImageIdx < $scope.nowImages.length - 1 ? 1 : 0);
		}

		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.completeInfo = function() {
			var followId = $scope.orderStatus.flowId,
				status = $scope.orderStatus.backStatus,
				url;
			if (followId == 1) {
				url = '/credit/query/'
			} else if (followId == 2) {
				if (status == 0) {
					url = '/loan/info/'
				} else if (status == 1) {
					url = '/loan/srv/'
				} else if (status == 2) {
					url = '/loan/risk/'
				}
			} else if (followId == 0) {
				if (status == 0) {
					url = '/family/info/'
				} else if (status == 2) {
					url = '/family/risk/'
				}
			} else if (followId == 5) {
				if (status == 0) {
					url = '/contract/info/'
				} else if (status == 2) {
					url = '/contract/risk/'
				}
			} else if (followId == 8) {
				if (status == 0) {
					url = '/car/info/'
				} else if (status == 1) {
					url = '/car/srv/'
				} else if (status == 2) {
					url = '/car/risk/'
				}
			} else if (followId == 10) {
				if (status == 0) {
					url = '/register/info/'
				} else if (status == 1) {
					url = '/register/srv/'
				} else if (status == 2) {
					url = '/register/risk/'
				}
			}
			if (url) {
				$location.path(url + $scope.orderNo);
			}
		}

	}
]);
kry.controller('ctrl.customer.contract', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '我的客户',
			menuKey: 'myCustomer'
		})

		$scope.orderNo = $params.orderNo;
		srv.orderStatus($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.orderStatus = xhr.data;
			}
		})
		$scope.flowId = 5;
		$scope.showKey = '';
		$scope.fillMates = [];
		$scope.emptyMates = [];
		getFlowId();
		//得到flowId
		function getFlowId(){
			$.ajax({
				url:'../loanOrder/getLoanOrderByOrderNo.html',
				data:{'orderNo':$scope.orderNo},
				type:'POST',
				async:false,
				dataType:'JSON',
				success:function(datas){
					$scope.flowId = datas.data.flowId;
				},
				error:function(textStatus){
				}
			})
		}
		//srv.fileInfo($scope.orderNo, $scope.flowId, function(xhr) { //Mender wq 查签约材料 2016-04-19
		srv.fileInfo($scope.orderNo, 5, function(xhr) {
			console.log($scope.flowId);
			if (!xhr.code) {
				if (xhr.data.length == 0) {
					$scope.fileList = [];
					return;
				} else if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				$scope.showKey = $scope.fileList[0].key
				if (!$scope.lastFile) return;
				for (var i in $scope.lastFile.mate) {
					var f = $scope.lastFile.mate[i];
					if (!!f.mateStatus)
						$scope.fillMates.push(f);
					else {
						$scope.emptyMates.push(f);
					}
				}
				$scope.em = $scope.emptyMates.splice(0, 1)[0];
			} else {
				$scope.fileList = [];
				base.alert('获取材料列表失败');
			}
		})

		$scope.getFile = function(f) {
			if (!f) return 0;
			var count = 0;
			for (var i in f.mate) {
				var m = f.mate[i];
				if (!!m.mateStatus) {
					count++;
				}
			}
			return count;
		}

		$scope.nowImages = [];
		$scope.nowImageIdx = 0;
		$scope.rotateImgCss = 0;
		$scope.nowNames = [];
		$scope.viewImage = function(m, mate, idx, bother) {
			var imgs = [],
				names = [];
			for (var i = 0, l = mate.length; i < l; i++) {
				var im = mate[i];
				if (im == m) idx = imgs.length;
				if (!!im.mateStatus) {
					imgs.push(im.matePic);
					names.push(bother ? ('其他材料' + i) : im.mateName);
				}
			}
			$scope.nowImages = imgs;
			$scope.nowImageIdx = idx;
			$scope.rotateImgCss = 0;
			$scope.nowNames = names;
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.swiper.htm',
				scope: $scope,
				className: 'ngdialog-theme-fullview'
			})
		}

		$scope.setWrapper = function(file) {
			if ($scope.showKey == file.key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = file.key;
			}
		}

		$scope.prevImage = function() {
			$scope.rotateImgCss = 0;
			$scope.nowImageIdx = $scope.nowImageIdx > 0 ? $scope.nowImageIdx - 1 : 0;
		}

		$scope.nextImage = function() {
			$scope.rotateImgCss = 0;
			$scope.nowImageIdx = $scope.nowImageIdx + ($scope.nowImageIdx < $scope.nowImages.length - 1 ? 1 : 0);
		}
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.completeInfo = function() {
			var followId = $scope.orderStatus.flowId,
				status = $scope.orderStatus.backStatus,
				url;
			if (followId == 1) {
				url = '/credit/query/'
			} else if (followId == 2) {
				if (status == 0) {
					url = '/loan/info/'
				} else if (status == 1) {
					url = '/loan/srv/'
				} else if (status == 2) {
					url = '/loan/risk/'
				}
			} else if (followId == 0) {
				if (status == 0) {
					url = '/family/info/'
				} else if (status == 2) {
					url = '/family/risk/'
				}
			} else if (followId == 5) {
				if (status == 0) {
					url = '/contract/info/'
				} else if (status == 2) {
					url = '/contract/risk/'
				}
			} else if (followId == 8) {
				if (status == 0) {
					url = '/car/info/'
				} else if (status == 1) {
					url = '/car/srv/'
				} else if (status == 2) {
					url = '/car/risk/'
				}
			} else if (followId == 10) {
				if (status == 0) {
					url = '/register/info/'
				} else if (status == 1) {
					url = '/register/srv/'
				} else if (status == 2) {
					url = '/register/risk/'
				}
			}
			if (url) {
				$location.path(url + $scope.orderNo);
			}
		}
	}
]);
kry.controller('ctrl.customer.family', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '我的客户',
			menuKey: 'myCustomer'
		})

		$scope.orderNo = $params.orderNo;
		srv.orderStatus($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.orderStatus = xhr.data;
			}
		})
		$scope.flowId = 0;
		$scope.showKey = '';
		$scope.fillMates = [];
		$scope.emptyMates = [];
		getFlowId();
		//得到flowId
		function getFlowId(){
			$.ajax({
				url:'../loanOrder/getLoanOrderByOrderNo.html',
				data:{'orderNo':$scope.orderNo},
				type:'POST',
				async:false,
				dataType:'JSON',
				success:function(datas){
					$scope.flowId = datas.data.flowId;
				},
				error:function(textStatus){
				}
			})
		}
		srv.fileInfo($scope.orderNo, $scope.flowId, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length == 0) {
					$scope.fileList = [];
					return;
				} else if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				$scope.showKey = $scope.fileList[0].key
				if (!$scope.lastFile) return;
				for (var i in $scope.lastFile.mate) {
					var f = $scope.lastFile.mate[i];
					if (!!f.mateStatus)
						$scope.fillMates.push(f);
					else {
						$scope.emptyMates.push(f);
					}
				}
				$scope.em = $scope.emptyMates.splice(0, 1)[0];
			} else {
				$scope.fileList = [];
				base.alert('获取材料列表失败');
			}
		})

		$scope.getFile = function(f) {
			if (!f) return 0;
			var count = 0;
			for (var i in f.mate) {
				var m = f.mate[i];
				if (!!m.mateStatus) {
					count++;
				}
			}
			return count;
		}
		$scope.nowImages = [];
		$scope.nowImageIdx = 0;
		$scope.rotateImgCss = 0;
		$scope.nowNames = [];
		$scope.viewImage = function(m, mate, idx, bother) {
			var imgs = [],
				names = [];
			for (var i = 0, l = mate.length; i < l; i++) {
				var im = mate[i];
				if (im == m) idx = imgs.length;
				if (!!im.mateStatus) {
					imgs.push(im.matePic);
					names.push(bother ? ('其他材料' + i) : im.mateName);
				}
			}
			$scope.nowImages = imgs;
			$scope.nowImageIdx = idx;
			$scope.rotateImgCss = 0;
			$scope.nowNames = names;
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.swiper.htm',
				scope: $scope,
				className: 'ngdialog-theme-fullview'
			})
		}

		$scope.setWrapper = function(file) {
			if ($scope.showKey == file.key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = file.key;
			}
		}

		$scope.prevImage = function() {
			$scope.rotateImgCss = 0;
			$scope.nowImageIdx = $scope.nowImageIdx > 0 ? $scope.nowImageIdx - 1 : 0;
		}

		$scope.nextImage = function() {
			$scope.rotateImgCss = 0;
			$scope.nowImageIdx = $scope.nowImageIdx + ($scope.nowImageIdx < $scope.nowImages.length - 1 ? 1 : 0);
		}
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.completeInfo = function() {
			var followId = $scope.orderStatus.flowId,
				status = $scope.orderStatus.backStatus,
				url;
			if (followId == 1) {
				url = '/credit/query/'
			} else if (followId == 2) {
				if (status == 0) {
					url = '/loan/info/'
				} else if (status == 1) {
					url = '/loan/srv/'
				} else if (status == 2) {
					url = '/loan/risk/'
				}
			} else if (followId == 0) {
				if (status == 0) {
					url = '/family/info/'
				} else if (status == 2) {
					url = '/family/risk/'
				}
			} else if (followId == 5) {
				if (status == 0) {
					url = '/contract/info/'
				} else if (status == 2) {
					url = '/contract/risk/'
				}
			} else if (followId == 8) {
				if (status == 0) {
					url = '/car/info/'
				} else if (status == 1) {
					url = '/car/srv/'
				} else if (status == 2) {
					url = '/car/risk/'
				}
			} else if (followId == 10) {
				if (status == 0) {
					url = '/register/info/'
				} else if (status == 1) {
					url = '/register/srv/'
				} else if (status == 2) {
					url = '/register/risk/'
				}
			}
			if (url) {
				$location.path(url + $scope.orderNo);
			}
		}
	}
]);
kry.controller('ctrl.customer.info', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		base,
		srv
	) {
		$root.setSite({
			title: '我的客户',
			menuKey: 'myCustomer'
		})

		$scope.orderNo = $params.orderNo;
		srv.orderStatus($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.orderStatus = xhr.data;
			}
		})
		$scope.bussMode = [{
			id: 0,
			name: '标准'
		}, {
			id: 1,
			name: '资产管理'
		}]
		$scope.payLimit = [{
			limit: 12,
			name: '12期'
		}, {
			limit: 18,
			name: '18期'
		}, {
			limit: 24,
			name: '24期'
		}, {
			limit: 36,
			name: '36期'
		}]
		$scope.renewalMode = [{
			id: 0,
			name: '自行办理'
		}, {
			id: 1,
			name: '单位承保'
		}]
		$scope.house = [{
			id: 0,
			name: '无'
		}, {
			id: 1,
			name: '有'
		}]

		srv.info($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.table = xhr.data;
				$scope.copySurveyId = angular.copy($scope.table.basicInformation.surveyId);
				if ($scope.table.loanUserCar.brandId) {
					initCar();
				}
			}
		})

		$scope.mode = {
				//基本信息
				basicInformation: false,
				//分期信息
				loanUserStage: false,
				//购车信息
				loanUserCar: false,
				lender: false,
				loanUserSpouse: false,
				loanUserGuarantee: false,
				loanUserContact: false,
				loanOrgn: false,
				approval: false
			}
			/********************初始化*********************/
		getBankList();
		get4Shop();
		getUser();
		getBrands();
		/**
		 * 获取银行列表
		 */
		function getBankList() {
			srv.queryBank(function(xhr) {
				if (!xhr.code) {
					var banks = {};
					for (var i in xhr.data) {
						var row = xhr.data[i];
						banks[row.bankId] = row;
					}
					$scope.banks = banks;
				} else {
					base.alert('获取银行列表失败');
				}
			})
		}
		/**
		 * 获取4S店
		 */
		function get4Shop() {
			srv.carShop(function(xhr) {
				if (!xhr.code) {
					var shop = {};
					for (var i in xhr.data) {
						var s = xhr.data[i];
						shop[s.shopId] = s;
					}
					$scope.carShop = shop;
				} else {
					base.alert('获取4S店信息失败');
				}
			})
		}
		/**
		 * 获取经办人列表
		 */
		function getUser() {
			srv.muser(function(xhr) {
				if (!xhr.code) {
					var us = {}
					for (var i in xhr.data) {
						var u = xhr.data[i];
						us[u.key] = u;
					}
					$scope.musers = us;
				} else {
					base.alert('获取经办人信息失败');
				}
			})
		}
		/**
		 * 获取汽车品牌
		 */
		function getBrands() {
			srv.carBrands(function(xhr) {
				if (!xhr.code) {
					var brands = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						brands[r.brandId] = r;
					}
					$scope.carbrands = brands;
				} else {
					base.alert('获取汽车品牌失败');
				}
			})
		}
		/**
		 * 获取车系列
		 */
		function getCarSeries(brandid) {
			srv.carSeries(brandid, function(xhr) {
				if (!xhr.code) {
					var sers = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						sers[r.serieId] = r;
					}
					$scope.carSeries = sers;
				} else {
					base.alert('获取汽车系列表失败');
				}
			})
		}
		/**
		 * 获取车型列表
		 */
		function getCarSpecs(serieid) {
			srv.carSpecs(serieid, function(xhr) {
				if (!xhr.code) {
					var spes = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						spes[r.specId] = r;
					}
					$scope.carSpecs = spes;
				} else {
					base.alert('获取车型列表失败');
				}
			})
		}
		/**
		 * 获取贴息
		 */
		function getCarApr(specid) {
			srv.carApr(specid, function(xhr) {
				if (!xhr.code) {
					$scope.carApr = xhr.data;
				}
			})
		}

		function initCar() {
			var brandid = $scope.table.loanUserCar.brandId,
				serieId = $scope.table.loanUserCar.serieId,
				specId = $scope.table.loanUserCar.specId;
			getCarSeries(brandid);
			if (serieId) getCarSpecs(serieId);
			if (specId) getCarApr(specId);
		}

		$scope.completeInfo = function() {
			var followId = $scope.orderStatus.flowId,
				status = $scope.orderStatus.backStatus,
				url;
			if (followId == 1) {
				url = '/credit/query/'
			} else if (followId == 2) {
				if (status == 0) {
					url = '/loan/info/'
				} else if (status == 1) {
					url = '/loan/srv/'
				} else if (status == 2) {
					url = '/loan/risk/'
				}
			} else if (followId == 0) {
				if (status == 0) {
					url = '/family/info/'
				} else if (status == 2) {
					url = '/family/risk/'
				}
			} else if (followId == 5) {
				if (status == 0) {
					url = '/contract/info/'
				} else if (status == 2) {
					url = '/contract/risk/'
				}
			} else if (followId == 8) {
				if (status == 0) {
					url = '/car/info/'
				} else if (status == 1) {
					url = '/car/srv/'
				} else if (status == 2) {
					url = '/car/risk/'
				}
			} else if (followId == 10) {
				if (status == 0) {
					url = '/register/info/'
				} else if (status == 1) {
					url = '/register/srv/'
				} else if (status == 2) {
					url = '/register/risk/'
				}
			}
			if (url) {
				$location.path(url + $scope.orderNo);
			}
		}
	}
])
kry.controller('ctrl.customer', [
	'$scope',
	'$rootScope',
	'base',
	'srv',
	function(
		$scope,
		$root,
		base,
		srv
	) {
		$root.setSite({
			title: '我的客户',
			menuKey: 'myCustomer'
		})
		$scope.pageParams = {
			'pageNum': 1,
			'loanOrderQuery.flowNodeId': '',
			'loanOrderQuery.idCard': '',
			'loanOrderQuery.realName': '',
			'loanOrderQuery.orderNo': ''
		};
		$scope.page = {};

		function getLoan() {
			if ($scope.pageParams['loanOrderQuery.flowNodeId'] == undefined || $scope.pageParams['loanOrderQuery.flowNodeId'] == null) {
				$scope.pageParams['loanOrderQuery.flowNodeId'] = '';
			}
			srv.customer($scope.pageParams, function(xhr) {
				if (xhr.total > 0) {
					$scope.page.loan = xhr.rows;
					$scope.pageParams['pageNum'] = xhr.page;
					$scope.page.pageSize = xhr.pageSize;
					$scope.page.total = xhr.total;
					$scope.page.totalPage = parseInt(xhr.total / xhr.pageSize) + (xhr.total % xhr.pageSize > 0 ? 1 : 0);
					$scope.page.totalPagesArr = [];
					for (var i = 0; i < $scope.page.totalPage; i++) {
						$scope.page.totalPagesArr.push(i);
					}
				} else {
					$scope.page.loan = [];
					$scope.page.total = 0;
				}
			})
		}

		getLoan();

		srv.nodes(function(xhr) {
			if (!xhr.code) {
				$scope.nodeList = xhr.data;
			} else {
				$scope.nodeList = [];
			}
		})

		$scope.search = function() {
			$scope.pageParams['pageNum'] = 1;
			getLoan();
		}

		$scope.pagePrev = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == 1) return;
			$scope.pageParams['pageNum'] = cp - 1;
			getLoan();
		}

		$scope.pageNext = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == $scope.page.totalPage) return;
			$scope.pageParams['pageNum'] = cp + 1;
			getLoan();
		}

		$scope.setPage = function(p) {
			if (p == $scope.pageParams['pageNum']) return;
			$scope.pageParams['pageNum'] = p;
			getLoan();
		}
	}
])
kry.controller('ctrl.customer.loan', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '未提交订单详情(流转单)',
			menuKey: 'myCustomer'
		})
		$scope.orderNo = $params.orderNo;
		srv.orderStatus($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.orderStatus = xhr.data;
			}
		})
		$scope.showKey = 'credit';
		$scope.subKeys = {};
		$scope.bankCreditResult = false;

		srv.fileInfo($scope.orderNo, 2, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length == 0) {
					$scope.fileList = [];
				} else if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				rebuildFileList();
			} else {
				$scope.fileInfos = [];
			}
		})

		srv.orderStatus($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.orderStatus = xhr.data;
			}
		})

		//Mender wq 检查是否是其他银行
		srv.getAgencyBankByOrderNo($scope.orderNo,function(xhr){
			try {
				if(!xhr.code && null !=  xhr.data){
					var data = xhr.data ;
					if(data.bankList.agencyCode != "-1"){
						$scope.bankCreditResult = true;
					}
				}
			}catch (e){
				console.log(e);
			}

		})

		function getQueryCredit(orderNo) {
			srv.queryCredit(orderNo, function(xhr) {
				if (!xhr.code) {
					$scope.creditResult = xhr.data;
				} else {
					$scope.creditResult = [];
				}
			})
		}

		function getExecution(orderNo) {
			srv.execution(orderNo, function(xhr) {
				if (!xhr.code) {
					$scope.execute = xhr.data;
				} else {
					$scope.execute = [];
				}
			})
		}
		getQueryCredit($scope.orderNo);
		getExecution($scope.orderNo);

		function rebuildFileList() {
			var copy = angular.copy($scope.fileList),
				extras = {};
			for (var f in copy) {
				var row = copy[f],
					o = [],
					img = {},
					names = {};
				extras[row.key] = {};
				for (var i in row.Form) {
					var form = row.Form[i];
					if (form.table && !!form.table.length) {
						o.push({
							name: form.name,
							key: form.key
						});
						if (form.images.length > 0) {
							img[form.key] = form.images;
							names[form.key] = form.names;
						}
					}
				}
				if (o.length > 1) {
					extras[row.key].buttons = o;
				}
				$scope.subKeys[row.key] = o[0].key;
				extras[row.key].images = img;
				extras[row.key].names = names;
			}
			$scope.extras = extras;
		}

		$scope.setWrapper = function(key) {
			if ($scope.showKey == key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = key;
			}
		}

		$scope.setSubWrapper = function(fkey, key, $event) {
			$scope.subKeys[fkey] = key;
			$event.stopPropagation();
		}

		$scope.showImages = function(fkey, $event) {
			var images = $scope.extras[fkey].images,
				names = $scope.extras[fkey].names;
			if (!images) return;
			$scope.nowImages = images[$scope.subKeys[fkey]];
			$scope.nowNames = names[$scope.subKeys[fkey]];
			$scope.nowImageIdx = 0;
			$scope.rotateImgCss = 0;
			dialog.open({
				templateUrl: 'templates/dialog/dialog.viewimage.swiper.htm',
				scope: $scope,
				className: 'ngdialog-theme-fullview'
			})
			$event.stopPropagation();
		}

		$scope.viewImage = function(m, mate, idx, bother) {
			var imgs = [],
				names = [];
			for (var i = 0, l = mate.length; i < l; i++) {
				var im = mate[i];
				if (im == m) idx = imgs.length;
				if (!!im.mateStatus) {
					imgs.push(im.matePic);
					names.push(bother ? ('其他材料' + i) : im.mateName);
				}
			}
			$scope.nowImages = imgs;
			$scope.nowImageIdx = idx;
			$scope.rotateImgCss = 0;
			$scope.nowNames = names;
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.swiper.htm',
				scope: $scope,
				className: 'ngdialog-theme-fullview'
			})
		}

		$scope.prevImage = function() {
			$scope.rotateImgCss = 0;
			$scope.nowImageIdx = $scope.nowImageIdx > 0 ? $scope.nowImageIdx - 1 : 0;
		}

		$scope.nextImage = function() {
			$scope.rotateImgCss = 0;
			$scope.nowImageIdx = $scope.nowImageIdx + ($scope.nowImageIdx < $scope.nowImages.length - 1 ? 1 : 0);
		}

		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.showExecDetail = function(e) {
			dialog.open({
				templateUrl: 'templates/dialog/dialog.execution.htm',
				scope: $scope,
				closeByDocument: false,
				data: {
					execId: e.executionId
				},
				controller: 'dialog.execution'
			})
		}

		$scope.completeInfo = function() {
			var followId = $scope.orderStatus.flowId,
				status = $scope.orderStatus.backStatus,
				url;
			if (followId == 1) {
				url = '/credit/query/'
			} else if (followId == 2) {
				if (status == 0) {
					url = '/loan/info/'
				} else if (status == 1) {
					url = '/loan/srv/'
				} else if (status == 2) {
					url = '/loan/risk/'
				}
			} else if (followId == 0) {
				if (status == 0) {
					url = '/family/info/'
				} else if (status == 2) {
					url = '/family/risk/'
				}
			} else if (followId == 5) {
				if (status == 0) {
					url = '/contract/info/'
				} else if (status == 2) {
					url = '/contract/risk/'
				}
			} else if (followId == 8) {
				if (status == 0) {
					url = '/car/info/'
				} else if (status == 1) {
					url = '/car/srv/'
				} else if (status == 2) {
					url = '/car/risk/'
				}
			} else if (followId == 10) {
				if (status == 0) {
					url = '/register/info/'
				} else if (status == 1) {
					url = '/register/srv/'
				} else if (status == 2) {
					url = '/register/risk/'
				}
			}
			if (url) {
				$location.path(url + $scope.orderNo);
			} else {
				base.alert('请求错误，缺少参数，请刷新后重试');
			}
		}
	}
]);
kry.controller('dialog.execdetail', ['$scope', 'srv', function($scope, srv) {
	srv.execResult($scope.ngDialogData.detailId, function(xhr) {
		if (!xhr.code) {
			$scope.execDetailObj = xhr.data;
		} else {
			$scope.execDetailObj = undefined;
		}
	})
}])
kry.controller('dialog.execution', [
	'$scope',
	'base',
	'ngDialog',
	'srv',
	function(
		$scope,
		base,
		dialog,
		srv
	) {
		var execId = $scope.ngDialogData.execId;
		srv.execdetail(execId, function(xhr) {
			if (!xhr.code) {
				$scope.execList = xhr.data;
				$scope.page = xhr.page;
				$scope.pageSize = xhr.pageSize;
			} else {
				$scope.execList = [];
			}
		})

		$scope.showDetail = function(detailId) {
			dialog.open({
				templateUrl: 'templates/dialog/dialog.execdetail.htm',
				closeByDocument: false,
				scope: $scope,
				data: {
					detailId: detailId
				},
				controller: 'dialog.execdetail',
				className: 'ngdialog-theme-panel'
			})
		}
	}
])
kry.controller('dialog.password', ['$scope', 'base', 'srv', function($scope, base, srv) {
	$scope.savePassword = function() {
		if (!$scope.oldpwd || $scope.oldpwd.length > 20) {
			base.alert('请输入长度不超过20位的密码');
			return;
		}
		if (!$scope.newpwd || $scope.newpwd.length > 20) {
			base.alert('请输入长度不超过20位的新密码');
			return;
		}
		srv.password($scope.oldpwd, $scope.newpwd, function(xhr) {
			if (!xhr.code) {
				$scope.closeThisDialog();
			} else {
				base.alert(xhr.msg);
			}
		})
	}
}])
kry.controller('ctrl.dialog.upload', [
	'$scope',
	'base',
	function(
		$scope,
		base
	) {
		if (!$scope.ngDialogData.imageUrl) {
			base.alert('无法查看大图，缺少相关参数');
			$scope.closeThisDialog();
			return;
		}
		$scope.imageUrl = $scope.ngDialogData.imageUrl;
	}
])
kry.controller('ctrl.family.auth', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '审核意见',
			menuKey: 'visitsMaterialConfig'
		})

		$scope.orderNo = $params.orderNo;

		srv.auth($scope.orderNo, function(xhr) {
			if (!xhr.code)
				$scope.authRes = xhr.data;
		})

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					var diag = dialog.open({
						templateUrl: 'templates/dialog/dialog.authidea.htm',
						scope: $scope,
						controller:'ctrl.dialog.authidea',
						className: 'ngdialog-theme-input'
					});
					diag.closePromise.then(function(v) {
						if (!v || v.value == undefined) {
							$scope.sending_order = false;
							return;
						}
						srv.sendorder($scope.orderNo, v.value || '', 0, function(xhr) {
							if (!xhr.code) {
								$location.path('/family');
							} else {
								base.alert(xhr.msg);
							}
							$scope.sending_order = false;
						})
					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.family.files', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'base',
	'ngDialog',
	'srv',
	'navs',
	function(
		$scope,
		$root,
		$params,
		$location,
		base,
		dialog,
		srv,
		navs
	) {
		$root.setSite({
			title: '上门材料',
			menuKey: 'visitsMaterialConfig'
		})
		$scope.orderNo = $params.orderNo;
		$scope.flowId = 0;
		$scope.showKey = '';
		$scope.fillMates = [];
		$scope.emptyMates = [];
		getFlowId();
		//得到flowId
		function getFlowId(){
			$.ajax({
				url:'../loanOrder/getLoanOrderByOrderNo.html',
				data:{'orderNo':$scope.orderNo},
				type:'POST',
				async:false,
				dataType:'JSON',
				success:function(datas){
					$scope.flowId = datas.data.flowId;
				},
				error:function(textStatus){
				}
			})
		}
		srv.files($scope.flowId, $scope.orderNo, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				$scope.showKey = $scope.fileList[0].key
				if (!$scope.lastFile) return;
				for (var i in $scope.lastFile.mate) {
					var f = $scope.lastFile.mate[i];
					if (!!f.mateStatus)
						$scope.fillMates.push(f);
					else {
						$scope.emptyMates.push(f);
					}
				}
				$scope.em = $scope.emptyMates[0];
			} else {
				base.alert('获取材料列表失败');
			}
		})

		$scope.getFile = function(f) {
			if (!f) return 0;
			var count = 0;
			for (var i in f.mate) {
				var m = f.mate[i];
				if (!!m.mateStatus) {
					count++;
				}
			}
			return count;
		}

		$scope.deleteFile = function(m) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletefile($scope.orderNo, m.mateId, function(xhr) {
					if (!xhr.code) {
						m.mateStatus = 0;
						m.matePic = '';
						m.thumbnailPic = '';
					} else {
						base.alert('删除' + m.mateName + '图片失败');
					}
				})
			});
		}

		$scope.viewImage = function(m) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $root.globalImgPath + m.matePic
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}
		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}
		$scope.uploadSuccess = function(res, cfg, tar) {
			if (!res.code) {
				tar.mateStatus = 1;
				tar.matePic = res.url;
				tar.thumbnailPic = res.url;
			}
		}

		$scope.deleteOtherFile = function(f, idx) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value == 1) {
					srv.deletefile($scope.orderNo, f.mateId, function(xhr) {
						if (!xhr.code) {
							f.mateStatus = 0;
							f.matePic = '';
							f.thumbnailPic = '';
							$scope.emptyMates.push(f);
							$scope.fillMates.splice(idx, 1);
							$scope.em = $scope.emptyMates[0];
						} else {
							base.alert('删除' + m.mateName + '图片失败');
						}
					})
				}
			})
		}

		$scope.otherSuccess = function(res, cfg, tar) {
			if (!res.code) {
				if (!!tar.mateStatus) {
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
				} else {
					tar.mateStatus = 1;
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					$scope.fillMates.push(tar);
					$scope.emptyMates.splice(0, 1);
					$scope.em = $scope.emptyMates[0];
				}
			}
		}

		$scope.setWrapper = function(file) {
			if ($scope.showKey == file.key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = file.key;
			}
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					var diag = dialog.open({
						templateUrl: 'templates/dialog/dialog.authidea.htm',
						scope: $scope,
						controller:'ctrl.dialog.authidea',
						className: 'ngdialog-theme-input'
					});
					diag.closePromise.then(function(v) {
						if (!v || v.value == undefined) {
							$scope.sending_order = false;
							return;
						}
						srv.sendorder($scope.orderNo, v.value || '', 0, function(xhr) {
							if (!xhr.code) {
								$location.path('/family');
							} else {
								base.alert(xhr.msg);
							}
							$scope.sending_order = false;
						})
					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.family.info', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '未提交订单详情(流转单)',
			menuKey: 'visitsMaterialConfig'
		})
		$scope.orderNo = $params.orderNo;

		$scope.bussMode = [{
			id: 0,
			name: '标准'
		}, {
			id: 1,
			name: '资产管理'
		}]
		$scope.payLimit = [{
			limit: 12,
			name: '12期'
		}, {
			limit: 18,
			name: '18期'
		}, {
			limit: 24,
			name: '24期'
		}, {
			limit: 36,
			name: '36期'
		}]
		$scope.renewalMode = [{
			id: 0,
			name: '自行办理'
		}, {
			id: 1,
			name: '单位承保'
		}]
		$scope.house = [{
			id: 0,
			name: '无'
		}, {
			id: 1,
			name: '有'
		}]

		srv.info($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.table = xhr.data;
				$scope.copySurveyId = angular.copy($scope.table.basicInformation.surveyId);
				if ($scope.table.loanUserCar && $scope.table.loanUserCar.brandId) {
					initCar();
				}
			}
		})

		$scope.mode = {
				//基本信息
				basicInformation: false,
				//分期信息
				loanUserStage: false,
				//购车信息
				loanUserCar: false,
				lender: false,
				loanUserSpouse: false,
				loanUserGuarantee: false,
				loanUserContact: false,
				loanOrgn: false,
				approval: false
			}
			/********************初始化*********************/
		getBankList();
		get4Shop();
		getUser();
		getBrands();
		/**
		 * 获取银行列表
		 */
		function getBankList() {
			srv.queryBank(function(xhr) {
				if (!xhr.code) {
					var banks = {};
					for (var i in xhr.data) {
						var row = xhr.data[i];
						banks[row.bankId] = row;
					}
					$scope.banks = banks;
				} else {
					base.alert('获取银行列表失败');
				}
			})
		}
		/**
		 * 获取4S店
		 */
		function get4Shop() {
			srv.carShop(function(xhr) {
				if (!xhr.code) {
					var shop = {};
					for (var i in xhr.data) {
						var s = xhr.data[i];
						shop[s.shopId] = s;
					}
					$scope.carShop = shop;
				} else {
					base.alert('获取4S店信息失败');
				}
			})
		}
		/**
		 * 获取经办人列表
		 */
		function getUser() {
			srv.muser(function(xhr) {
				if (!xhr.code) {
					var us = {}
					for (var i in xhr.data) {
						var u = xhr.data[i];
						us[u.key] = u;
					}
					$scope.musers = us;
				} else {
					base.alert('获取经办人信息失败');
				}
			})
		}
		/**
		 * 获取汽车品牌
		 */
		function getBrands() {
			srv.carBrands(function(xhr) {
				if (!xhr.code) {
					var brands = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						brands[r.brandId] = r;
					}
					$scope.carbrands = brands;
				} else {
					base.alert('获取汽车品牌失败');
				}
			})
		}
		/**
		 * 获取车系列
		 */
		function getCarSeries(brandid) {
			srv.carSeries(brandid, function(xhr) {
				if (!xhr.code) {
					var sers = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						sers[r.serieId] = r;
					}
					$scope.carSeries = sers;
				} else {
					base.alert('获取汽车系列表失败');
				}
			})
		}
		/**
		 * 获取车型列表
		 */
		function getCarSpecs(serieid) {
			srv.carSpecs(serieid, function(xhr) {
				if (!xhr.code) {
					var spes = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						spes[r.specId] = r;
					}
					$scope.carSpecs = spes;
				} else {
					base.alert('获取车型列表失败');
				}
			})
		}
		/**
		 * 获取贴息
		 */
		function getCarApr(specid) {
			srv.carApr(specid, function(xhr) {
				if (!xhr.code) {
					$scope.carApr = xhr.data;
				}
			})
		}

		function initCar() {
			var brandid = $scope.table.loanUserCar.brandId,
				serieId = $scope.table.loanUserCar.serieId,
				specId = $scope.table.loanUserCar.specId;
			getCarSeries(brandid);
			if (serieId) getCarSpecs(serieId);
			if (specId) getCarApr(specId);
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					var diag = dialog.open({
						templateUrl: 'templates/dialog/dialog.authidea.htm',
						scope: $scope,
						controller:'ctrl.dialog.authidea',
						className: 'ngdialog-theme-input'
					});
					diag.closePromise.then(function(v) {
						if (!v || v.value == undefined) {
							$scope.sending_order = false;
							return;
						}
						srv.sendorder($scope.orderNo, v.value || '', 0, function(xhr) {
							if (!xhr.code) {
								$location.path('/family');
							} else {
								base.alert(xhr.msg);
							}
							$scope.sending_order = false;
						})
					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			});
		}
	}
])
kry.controller('ctrl.family', [
	'$scope',
	'$rootScope',
	'$location',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$location,
		base,
		srv
	) {
		$root.setSite({
			title: '上门材料管理',
			menuKey: 'visitsMaterialConfig'
		})

		$scope.pageParams = {
			'loanOrderMaterial.backStatus': parseInt($location.$$search.type) || 0,
			'pageNum': 1,
			'loanOrderMaterial.idCard': '',
			'loanOrderMaterial.realName': '',
			'loanOrderMaterial.orderNo': '',
			'loanOrderMaterial.acceptName': ''
		};
		$scope.page = {};

		srv.tiper(0, function(xhr) {
			if (!xhr.code) {
				$scope.tipers = xhr.data;
			}
		})

		function getLoan() {
			srv.material(0, $scope.pageParams, function(xhr) {
				if (xhr.total > 0) {
					$scope.page.lists = xhr.rows;
					$scope.pageParams['pageNum'] = xhr.page;
					$scope.page.pageSize = xhr.pageSize;
					$scope.page.total = xhr.total;
					$scope.page.totalPage = parseInt(xhr.total / xhr.pageSize) + (xhr.total % xhr.pageSize > 0 ? 1 : 0);
					$scope.page.totalPagesArr = [];
					for (var i = 0; i < $scope.page.totalPage; i++) {
						$scope.page.totalPagesArr.push(i);
					}
				} else {
					$scope.page.lists = [];
					$scope.page.total = 0;
				}
			})
		}

		getLoan();

		$scope.isStatus = function(code) {
			return $scope.pageParams['loanOrderMaterial.backStatus'] == code;
		}

		$scope.getUrl = function() {
			return ['#/family/info/', '#/family/srv/', '#/family/risk/'][$scope.pageParams['loanOrderMaterial.backStatus']];
		}

		$scope.search = function() {
			$scope.pageParams['pageNum'] = 1;
			getLoan();
		}

		$scope.pagePrev = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == 1) return;
			$scope.pageParams['pageNum'] = cp - 1;
			getLoan()
		}

		$scope.pageNext = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == $scope.page.totalPage) return;
			$scope.pageParams['pageNum'] = cp + 1;
			getLoan()
		}

		$scope.setPage = function(p) {
			if (p == $scope.pageParams['pageNum']) return;
			$scope.pageParams['pageNum'] = p;
			getLoan()
		}
		$scope.setBackStatus = function(code) {
			$scope.pageParams['loanOrderMaterial.backStatus'] = code;
			$scope.pageParams['pageNum'] = 1; //tab切换时重置页码。
			getLoan();
		}

	}
])
kry.controller('ctrl.family.risk.auth', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '审核意见',
			menuKey: 'visitsMaterialConfig'
		})

		$scope.orderNo = $params.orderNo;

		srv.auth($scope.orderNo, function(xhr) {
			if (!xhr.code)
				$scope.authRes = xhr.data;
		})

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					var diag = dialog.open({
						templateUrl: 'templates/dialog/dialog.authidea.htm',
						scope: $scope,
						controller:'ctrl.dialog.authidea',
						className: 'ngdialog-theme-input'
					});
					diag.closePromise.then(function(v) {
						if (!v || v.value == undefined) {
							$scope.sending_order = false;
							return;
						}
						srv.sendorder($scope.orderNo, v.value || '', 0, function(xhr) {
							if (!xhr.code) {
								$location.search({
									type: 2
								});
								$location.path('/family');
							} else {
								base.alert(xhr.msg);
							}
							$scope.sending_order = false;
						})
					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.family.risk.files', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'base',
	'ngDialog',
	'srv',
	'navs',
	function(
		$scope,
		$root,
		$params,
		$location,
		base,
		dialog,
		srv,
		navs
	) {
		$root.setSite({
			title: '上门材料',
			menuKey: 'visitsMaterialConfig'
		})
		$scope.orderNo = $params.orderNo;
		$scope.flowId = 0;
		$scope.showKey = '';
		$scope.fillMates = [];
		$scope.emptyMates = [];
		getFlowId();
		//得到flowId
		function getFlowId(){
			$.ajax({
				url:'../loanOrder/getLoanOrderByOrderNo.html',
				data:{'orderNo':$scope.orderNo},
				type:'POST',
				async:false,
				dataType:'JSON',
				success:function(datas){
					$scope.flowId = datas.data.flowId;
				},
				error:function(textStatus){
				}
			})
		}
		srv.files($scope.flowId, $scope.orderNo, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				$scope.showKey = $scope.fileList[0].key;
				if (!$scope.lastFile) return;
				for (var i in $scope.lastFile.mate) {
					var f = $scope.lastFile.mate[i];
					if (!!f.mateStatus)
						$scope.fillMates.push(f);
					else {
						$scope.emptyMates.push(f);
					}
				}
				$scope.em = $scope.emptyMates[0];
			} else {
				base.alert('获取材料列表失败');
			}
		})

		$scope.getFile = function(f) {
			if (!f) return 0;
			var count = 0;
			for (var i in f.mate) {
				var m = f.mate[i];
				if (!!m.mateStatus) {
					count++;
				}
			}
			return count;
		}

		$scope.deleteFile = function(m) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletefile($scope.orderNo, m.mateId, function(xhr) {
					if (!xhr.code) {
						m.mateStatus = 0;
						m.matePic = '';
						m.thumbnailPic = '';
						m.auditResult = null;
						m.auditOpinion = null;
					} else {
						base.alert('删除' + m.mateName + '图片失败');
					}
				})
			});
		}

		$scope.viewImage = function(m) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $root.globalImgPath + m.matePic
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}

		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.uploadSuccess = function(res, cfg, tar) {
			if (!res.code) {
				tar.mateStatus = 1;
				tar.matePic = res.url;
				tar.auditResult = null;
				tar.auditOpinion = null;
				tar.thumbnailPic = res.url;
			}
		}

		$scope.deleteOtherFile = function(f, idx) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value == 1) {
					srv.deletefile($scope.orderNo, f.mateId, function(xhr) {
						if (!xhr.code) {
							f.mateStatus = 0;
							f.matePic = '';
							f.thumbnailPic = '';
							f.auditResult = null;
							f.auditOpinion = null;
							$scope.emptyMates.push(f);
							$scope.fillMates.splice(idx, 1);
							$scope.em = $scope.emptyMates[0];
						} else {
							base.alert('删除' + m.mateName + '图片失败');
						}
					})
				}
			})
		}

		$scope.otherSuccess = function(res, cfg, tar) {
			if (!res.code) {
				if (!!tar.mateStatus) {
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditResult = null;
					tar.auditOpinion = null;
				} else {
					tar.mateStatus = 1;
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditOpinion = null;
					tar.auditResult = null;
					$scope.fillMates.push(tar);
					$scope.emptyMates.splice(0, 1);
					$scope.em = $scope.emptyMates[0];
				}
			}
		}

		$scope.setWrapper = function(file) {
			if ($scope.showKey == file.key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = file.key;
			}
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					var diag = dialog.open({
						templateUrl: 'templates/dialog/dialog.authidea.htm',
						scope: $scope,
						controller:'ctrl.dialog.authidea',
						className: 'ngdialog-theme-input'
					});
					diag.closePromise.then(function(v) {
						if (!v || v.value == undefined) {
							$scope.sending_order = false;
							return;
						}
						srv.sendorder($scope.orderNo, v.value || '', 0, function(xhr) {
							if (!xhr.code) {
								$location.search({
									type: 2
								});
								$location.path('/family');
							} else {
								base.alert(xhr.msg);
							}
							$scope.sending_order = false;
						})
					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.family.risk', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '未提交订单详情(流转单)',
			menuKey: 'visitsMaterialConfig'
		})
		$scope.orderNo = $params.orderNo;

		$scope.bussMode = [{
			id: 0,
			name: '标准'
		}, {
			id: 1,
			name: '资产管理'
		}]
		$scope.payLimit = [{
			limit: 12,
			name: '12期'
		}, {
			limit: 18,
			name: '18期'
		}, {
			limit: 24,
			name: '24期'
		}, {
			limit: 36,
			name: '36期'
		}]
		$scope.renewalMode = [{
			id: 0,
			name: '自行办理'
		}, {
			id: 1,
			name: '单位承保'
		}]
		$scope.house = [{
			id: 0,
			name: '无'
		}, {
			id: 1,
			name: '有'
		}]

		srv.info($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.table = xhr.data;
				$scope.copySurveyId = angular.copy($scope.table.basicInformation.surveyId);
				if ($scope.table.loanUserCar && $scope.table.loanUserCar.brandId) {
					initCar();
				}
			}
		})

		$scope.mode = {
				//基本信息
				basicInformation: false,
				//分期信息
				loanUserStage: false,
				//购车信息
				loanUserCar: false,
				lender: false,
				loanUserSpouse: false,
				loanUserGuarantee: false,
				loanUserContact: false,
				loanOrgn: false,
				approval: false
			}
			/********************初始化*********************/
		getBankList();
		get4Shop();
		getUser();
		getBrands();
		/**
		 * 获取银行列表
		 */
		function getBankList() {
			srv.queryBank(function(xhr) {
				if (!xhr.code) {
					var banks = {};
					for (var i in xhr.data) {
						var row = xhr.data[i];
						banks[row.bankId] = row;
					}
					$scope.banks = banks;
				} else {
					base.alert('获取银行列表失败');
				}
			})
		}
		/**
		 * 获取4S店
		 */
		function get4Shop() {
			srv.carShop(function(xhr) {
				if (!xhr.code) {
					var shop = {};
					for (var i in xhr.data) {
						var s = xhr.data[i];
						shop[s.shopId] = s;
					}
					$scope.carShop = shop;
				} else {
					base.alert('获取4S店信息失败');
				}
			})
		}
		/**
		 * 获取经办人列表
		 */
		function getUser() {
			srv.muser(function(xhr) {
				if (!xhr.code) {
					var us = {}
					for (var i in xhr.data) {
						var u = xhr.data[i];
						us[u.key] = u;
					}
					$scope.musers = us;
				} else {
					base.alert('获取经办人信息失败');
				}
			})
		}
		/**
		 * 获取汽车品牌
		 */
		function getBrands() {
			srv.carBrands(function(xhr) {
				if (!xhr.code) {
					var brands = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						brands[r.brandId] = r;
					}
					$scope.carbrands = brands;
				} else {
					base.alert('获取汽车品牌失败');
				}
			})
		}
		/**
		 * 获取车系列
		 */
		function getCarSeries(brandid) {
			srv.carSeries(brandid, function(xhr) {
				if (!xhr.code) {
					var sers = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						sers[r.serieId] = r;
					}
					$scope.carSeries = sers;
				} else {
					base.alert('获取汽车系列表失败');
				}
			})
		}
		/**
		 * 获取车型列表
		 */
		function getCarSpecs(serieid) {
			srv.carSpecs(serieid, function(xhr) {
				if (!xhr.code) {
					var spes = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						spes[r.specId] = r;
					}
					$scope.carSpecs = spes;
				} else {
					base.alert('获取车型列表失败');
				}
			})
		}
		/**
		 * 获取贴息
		 */
		function getCarApr(specid) {
			srv.carApr(specid, function(xhr) {
				if (!xhr.code) {
					$scope.carApr = xhr.data;
				}
			})
		}

		function initCar() {
			var brandid = $scope.table.loanUserCar.brandId,
				serieId = $scope.table.loanUserCar.serieId,
				specId = $scope.table.loanUserCar.specId;
			getCarSeries(brandid);
			if (serieId) getCarSpecs(serieId);
			if (specId) getCarApr(specId);
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					var diag = dialog.open({
						templateUrl: 'templates/dialog/dialog.authidea.htm',
						scope: $scope,
						controller:'ctrl.dialog.authidea',
						className: 'ngdialog-theme-input'
					});
					diag.closePromise.then(function(v) {
						if (!v || v.value == undefined) {
							$scope.sending_order = false;
							return;
						}
						srv.sendorder($scope.orderNo, v.value || '', 0, function(xhr) {
							if (!xhr.code) {
								$location.search({
									type: 2
								});
								$location.path('/family');
							} else {
								base.alert(xhr.msg);
							}
							$scope.sending_order = false;
						})
					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			});
		}
	}
])
kry.controller('global', [
	'$scope',
	'$rootScope',
	'ngDialog',
	'$cookies',
	'$location',
	'$window',
	'srv',
	'config',
	'base',
	'navs',
	function(
		$scope,
		$root,
		dialog,
		$cookies,
		$location,
		$window,
		srv,
		config,
		base,
		navs
	) {
		$scope.site = {
			title: '卡融易',
			menuKey: 'createCustomer'
		}

		$root.showSubmenu = false;
		$root.phNotice = null;
		$root.InterValObj = null;

		$root.setSite = function(o) {
			$scope.site = angular.merge($scope.site, o);
		}

		$root.defaultUrl = './static/css/img/uploadbg.png';
		$root.globalImgPath = base.imgPath;

		$root.upload = function(order, flag, isocr, role, type, file, cb) { //wengdy
			if (type == "1851" && !~'avi|mov|mp4|rmvb|m4v'.indexOf(file.type.substr(6))) {
				base.alert('仅支持上传avi、mov、mp4、rmvb、m4v格式视频');
				cb(false);
				return;
			}
			if (!~'jpeg|jpg|png|gif|avi|mov|mp4|rmvb|m4v'.indexOf(file.type.substr(6))) {
				base.alert('仅支持上传jpeg、jpg、png、gif格式的图片');
				cb(false);
				return;
			}
			var fd = new FormData();
			fd.append('fileData', file);
			srv.upload(order, flag, isocr, role, type, fd, cb); //wengdy
		}
		$cookies.put(config.cookie.id, 1);
		$root.uid = $cookies.get(config.cookie.id);
		if (!$root.uid) {
			var diag = base.alert('你未登录，或凭据已过期，请先登录');
			diag.closePromise.then(function(d) {
				$window.location.href = config.login;
			})
		} else {
			srv.getUser(function(xhr) {
				if (!xhr.code) {
					$root.user = xhr.data;
					$scope.navRoute = navs[xhr.data.role];
					getNavTip();
				} else {
					var diag = base.alert('获取用户数据失败，请尝试重新登录');
					diag.closePromise.then(function(a) {
						$cookies.remove(config.cookie.id);
					})
				}
			})
		}

		$scope.getNavRoute = function(key) {
			if ($scope.navRoute.srv[key])
				return $scope.navRoute.srv[key].route;
			else return false;
		}
		$scope.getNavIcon = function(key) {
			return $scope.navRoute.srv[key].icon;
		}

		$scope.loginOut = function() {
			srv.loginOut(function(xhr) {
				if (!xhr.code) {
					$window.location.href = config.login;
				} else
					base.alert('退出失败，请刷新后重试');
			})
		}

		$scope.modifyPassword = function() {
			$root.showSubmenu = false;
			dialog.open({
				templateUrl: 'templates/dialog/dialog.password.htm',
				scope: $scope,
				closeByDocument: false,
				controller: 'dialog.password',
				className: 'ngdialog-theme-input'
			})
		}
		//个人中心
		$scope.personalCenter = function(){
			$root.showSubmenu = false;
			$root.bindingBtn = 0;
			$location.path("/personal/center/");
		}

		function getNavTip() {
			srv.nav(function(xhr) {
				if (!xhr.code) {
					$scope.globalNavs = xhr.data;
					var myMenuList = $scope.navRoute.user;
					srv.getUserCount(myMenuList, $scope);
					setTimeout(getNavTip, 60000);
				}
			})
		}
	}
])
kry.controller('ctrl.index', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		srv,
		base
	) {
		$root.setSite({
			title: '首页',
			menuKey: 'createCustomer'
		})
		$scope.myChart = null;
		$scope.option = null;
		$scope.progressData = {}
		$scope.hasPhoneStatus = false;
		$scope.unRemind = false;
		$scope.msgNotice = {};
		//初始化图表
		initEcharts();
		setTimeout(function () {
			showReport();
		}, 100);
		//检查是否绑定了手机
		checkHasPhone();
		//获取公告
		getNotice();
		//公告详情
		$scope.showNoticeDetail = function(id){
			$location.path('/notice/text/'+id);
		}
		//新增订单
		$scope.newOrder = function() {
			srv.order(function(xhr) {
				if (!xhr.code) {
					$location.path('/credit/new/' + xhr.data);
				} else {
					base.alert('创建订单失败，请重试');
				}
			})
		}
		//绑定/更换手机
		$scope.bindingPhone = function(){
			$root.bindingBtn = 1;
			$location.path('/personal/changephone');
		}
		//绑定手机不在提示
		$scope.resetCheckPhoneStatus = function(status){
			var params = "";
			if(status == undefined){
				status = null;
			}
			if($scope.unRemind){
				status = -1;
			}
			params="user.checkPhoneStatus="+status;
			$.ajax({
				url:'../user/updateUser.html',
				type:'POST',
				data:params,
				dataType:'JSON',
				success:function(result){
					if(undefined != result && result.code == 0){

					}
				},
				error:function(textStatus){
					console.log(textStatus);
				}
			})
			$scope.hasPhoneStatus = false;
		}
		//更多公告
		$scope.notice = function(){
			$location.path("/notice/list/");
		}
		//获取公告
		function  getNotice(){
			$.ajax({
				url:'../msgNotice/getFrontNotice.html',
				type:'POST',
				data:{'fnoticePosition':'1'},
				dataType:'JSON',
				success:function(result){
					if(result.code == 0){
						$scope.msgNotice = result.data;
						//滚动数据绑定有问题,改成这个
						var dataLi = "<li>"+
										"<a href='javascript:void(0)' title='"+$scope.msgNotice.noticeTitle+"' ng-click='showNoticeDetail("+$scope.msgNotice.noticeId+")'>"+
										$scope.msgNotice.noticeTitle+
										"</a>"+
									"</li>";
						$("#mqUl").empty();
						$("#mqUl").append($compile(dataLi)($scope));
					}else{
						//base.alert((null != result.msg && "" != result.msg) ? result.msg :'系统异常' );
					}
				},
				error:function(textStatus){
					console.log(textStatus);
				}
			})
		}
		//检查是否有绑定手机
		function checkHasPhone(){
			if($root.phNotice  != null) return false;
			$.ajax({
				url:'../user/checkHasPhone.html',
				type:'POST',
				async:false,
				dataType:'JSON',
				success:function(result){
					if(undefined != result && result.code == 0){
						var hasPhoneStatus = result.data;
						if(undefined != hasPhoneStatus && null != hasPhoneStatus){
							if(hasPhoneStatus <= 0){
								$scope.hasPhoneStatus = false;
							}else {
								$scope.hasPhoneStatus = true;
							}
						}else {
							$scope.hasPhoneStatus = true;
						}
					}
				},
				error:function(textStatus){
					console.log(textStatus);
				}
			});
			$root.phNotice = 1;
		}
		//初始化图表
		function initEcharts(){
			//路径配置
			require.config({
				paths: {
					echarts: '/echarts/js'
				}
			});
			require(
				[
					'echarts',
					'echarts/chart/bar',
					'echarts/chart/line'
				],
				function (ec) {
					//--- 折柱 ---
					$scope.myChart = ec.init(document.getElementById('main'));
					$scope.option = {
						title : {
							text: '',
							subtext: ''
						},
						tooltip : {
							show: true,
							trigger: 'item'
						},
						legend: {
							data:[]
						},
						dataZoom: {
							show: true,
							start : 0
						},
						toolbox: {
							show : true,
							feature : {
//    			            mark : {show: true},
//								dataView : {show: true, readOnly: false},
//								magicType : {show: true, type: ['line', 'bar']},
//								restore : {show: true},
//								saveAsImage : {show: true}
							}
						},
						calculable : true,
						xAxis : [
							{
								type : 'category',
								boundaryGap : true,
								data : []
							}
						],
						yAxis : [
							{
								type : 'value',
								axisLabel : {
									formatter: '{value} 万'
								}
							}
						],
						series : []
					};
					// 为echarts对象加载数据
					$scope.myChart.setOption($scope.option);

				}
			);
		}
		// 给图表 赋值
		function showReport(){
			//if(null == $scope.myChart || null == $scope.option) {
			//	initEcharts();
			//}
			// ../statisticsPic/queryStatisticsByDayTime.html
			//var postFields = getPostFields();
			jQuery.ajax({
				type: 'POST',
				url: '../statisticsPic/orderStatistics.html',
				//data: postFields,
				dataType: 'text',
				//async:false,
				success: function(result){
					if(null != $scope.myChart) $scope.myChart.clear();
					var jsonObj = jQuery.parseJSON(result);
					var trendData = jsonObj.data.trendData;
					$scope.progressData = jsonObj.data.progressData;
					$scope.option.xAxis[0].data = trendData.xAxisList;
					$scope.option.legend.data = trendData.listName;
					$scope.option.series = trendData.seriesList;
					$scope.myChart.hideLoading();
					$scope.myChart.setOption($scope.option);
					$scope.$apply();
				}
			});

		}
	}
])
kry.controller('ctrl.loan.auth', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '审核意见',
			menuKey: 'loanMaterialConfig'
		})

		$scope.orderNo = $params.orderNo;

		srv.auth($scope.orderNo, function(xhr) {
			if (!xhr.code)
				$scope.authRes = xhr.data;
		})

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			//$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}
					})

				} else if (xhr.code == 1) {

					base.alert(xhr.msg);
					$location.path('/loan');

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.loan.files', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'base',
	'ngDialog',
	'srv',
	'navs',
	function(
		$scope,
		$root,
		$params,
		$location,
		base,
		dialog,
		srv,
		navs
	) {
		$root.setSite({
			title: '贷款材料',
			menuKey: 'loanMaterialConfig'
		})
		$scope.orderNo = $params.orderNo;
		$scope.flowId = 2;
		$scope.showKey = '';
		$scope.fillMates = [];
		$scope.emptyMates = [];
		getFlowId();
		//得到flowId
		function getFlowId(){
			$.ajax({
				url:'../loanOrder/getLoanOrderByOrderNo.html',
				data:{'orderNo':$scope.orderNo},
				type:'POST',
				async:false,
				dataType:'JSON',
				success:function(datas){
					$scope.flowId = datas.data.flowId;
				},
				error:function(textStatus){
				}
			})
		}
		srv.files($scope.flowId, $scope.orderNo, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				$scope.showKey = $scope.fileList[0].key;
				if (!$scope.lastFile) return;
				for (var i in $scope.lastFile.mate) {
					var f = $scope.lastFile.mate[i];
					if (!!f.mateStatus)
						$scope.fillMates.push(f);
					else {
						$scope.emptyMates.push(f);
					}
				}
				$scope.em = $scope.emptyMates[0];
			} else {
				base.alert('获取材料列表失败');
			}
		})

		$scope.getFile = function(f) {
			if (!f) return 0;
			var count = 0;
			for (var i in f.mate) {
				var m = f.mate[i];
				if (!!m.mateStatus) {
					count++;
				}
			}
			return count;
		}

		$scope.deleteFile = function(m) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletefile($scope.orderNo, m.mateId, function(xhr) {
					if (!xhr.code) {
						m.mateStatus = 0;
						m.matePic = '';
						m.thumbnailPic = '';
					} else {
						base.alert('删除' + m.mateName + '图片失败');
					}
				})
			});
		}

		$scope.viewImage = function(m) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $root.globalImgPath + m.matePic
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}

		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.uploadSuccess = function(res, cfg, tar) {
			if (!res.code) {
				tar.mateStatus = 1;
				tar.matePic = res.url;
				tar.thumbnailPic = res.url;
			}
		}

		$scope.deleteOtherFile = function(f, idx) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value == 1) {
					srv.deletefile($scope.orderNo, f.mateId, function(xhr) {
						if (!xhr.code) {
							f.mateStatus = 0;
							f.matePic = '';
							f.thumbnailPic = '';
							$scope.emptyMates.push(f);
							$scope.fillMates.splice(idx, 1);
							$scope.em = $scope.emptyMates[0];
						} else {
							base.alert('删除' + m.mateName + '图片失败');
						}
					})
				}
			})
		}

		$scope.otherSuccess = function(res, cfg, tar) {
			if (!res.code) {
				if (!!tar.mateStatus) {
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
				} else {
					tar.mateStatus = 1;
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					$scope.fillMates.push(tar);
					$scope.emptyMates.splice(0, 1);
					$scope.em = $scope.emptyMates[0];
				}
			}
		}

		$scope.setWrapper = function(file) {
			if ($scope.showKey == file.key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = file.key;
			}
		}

		$scope.submitOrder = function() {

			if ($scope.sending_order) return;
			//	$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {

					srv.getAudit($scope.orderNo, function(res) {

						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})

						} else {
							base.alert('获取审核列表失败');
						}
					})

				} else if (xhr.code == 1) {

					base.alert(xhr.msg);
					$location.path('/loan');

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.loan.info', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '未提交订单详情(流转单)',
			menuKey: 'loanMaterialConfig'
		})
		$scope.orderNo = $params.orderNo;

		$scope.bussMode = [{
			id: 0,
			name: '标准'
		}, {
			id: 1,
			name: '资产管理'
		}]
		$scope.payLimit = [{
			limit: 12,
			name: '12期'
		}, {
			limit: 18,
			name: '18期'
		}, {
			limit: 24,
			name: '24期'
		}, {
			limit: 36,
			name: '36期'
		}]
		$scope.renewalMode = [{
			id: 0,
			name: '自行办理'
		}, {
			id: 1,
			name: '单位承保'
		}]
		$scope.house = [{
			id: 0,
			name: '无'
		}, {
			id: 1,
			name: '有'
		}]
		$scope.basicDataList = {};
		var carShops = new Array();
		$scope.carShopNames={};
		$scope.mCarShopNames={};
		$scope.is4SOrder = false;
		$scope.branchDeptList = {};
		$scope.branchDept = {'deptId':'','deptName':''};
		$scope.deptUser = {'userId':'','userName':''}
		$scope.deptUserList = {};
		$scope.musers4S ={};

		//检查是否是4S订单
		$scope.check4SOrder= function(){
			srv.is4SOrder($scope.orderNo,function(result){
				$scope.is4SOrder = false;
				if(!result.code){
					if(result.data == "true"){
						$scope.is4SOrder = true;
						var param = {'user.userDeptParentId':$scope.branchDept.deptId,'user.userDeptId':$scope.branchDept.deptId};
						srv.getUserList(param,function(xhr) {
							if (!xhr.code) {
								var us = {};
								for (var i in xhr.data) {
									var u = xhr.data[i];
									us[u.userId] = u;
								}
								$scope.musers4S = us;
							} else {
							}
						})
					}
				}
			});
		}
		srv.info($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.table = xhr.data;
				$scope.tableCopy = angular.copy($scope.table);
				$scope.copySurveyId = angular.copy($scope.table.basicInformation.surveyId);
				if ($scope.table.loanUserCar && $scope.table.loanUserCar.brandId) {
					initCar();
				}
				$scope.branchDept.deptId = $scope.table.loanOrder.deptId
				//获取分公司
				srv.getBranchDept($scope.table.loanOrder.deptId,function(result){
					if(!result.code){
						$scope.branchDeptList = result.data;
					}
				});

				$scope.check4SOrder();
			}
		})
		$scope.getDeptUser = function(){
			if(null == $scope.branchDept.deptId){
				$scope.deptUserList = {};
			}else {
				var params = {'user.userDeptId':$scope.branchDept.deptId};
				srv.getUserList(params,function(result){
					if(!result.code){
						$scope.deptUserList = result.data;
					}
				})
			}

		}

		$scope.mode = {
				//基本信息
				basicInformation: false,
				//分期信息
				loanUserStage: false,
				//购车信息
				loanUserCar: false,
				lender: false,
				loanUserSpouse: false,
				loanUserGuarantee: false,
				loanUserContact: false,
				loanOrgn: false,
				approval: false
			}
			/********************初始化*********************/
		getBankList();
		get4Shop();
		getUser();
		getBrands();
		getResidentType();

		/**
		 * 获取银行列表
		 */
		function getBankList() {
			srv.queryBank(function(xhr) {
				if (!xhr.code) {
					var banks = {};
					for (var i in xhr.data) {
						var row = xhr.data[i];
						banks[row.bankId] = row;
					}
					$scope.banks = banks;
				} else {
					base.alert('获取银行列表失败');
				}
			})
		}
		/**
		 * 获取4S店
		 */
		function get4Shop() {
			srv.carShop(function(xhr) {
				if (!xhr.code) {
					$scope.mCarShopNames = {};
					var shop = {};
					for (var i in xhr.data) {
						var s = xhr.data[i];
						shop[s.shopId] = s;
						carShops[i] = s.shopName;
						$scope.carShopNames[i] = s.shopName;
						$scope.mCarShopNames[s.shopName] = s;
					}
					$scope.carShop = shop;
				} else {
					base.alert('获取4S店信息失败');
				}
			})
		}
		$scope.getShops = function(){
			if(null != $scope.table.loanUserCar && $scope.table.loanUserCar != undefined && $scope.carShop != undefined){
				if($scope.carShop[$scope.table.loanUserCar.organId] != undefined && $scope.carShop[$scope.table.loanUserCar.organId]!=""){
					$( "#carShop").val($scope.carShop[$scope.table.loanUserCar.organId].shopName);
				}
			}

			$( "#carShop" ).autocomplete({
				source: carShops,
				autoFocus:true,
				appendTo:"#selectTd"
			});
		}
		$scope.setInputVal = function(){
			$("#carShop").val($scope.carShop[$scope.tableCopy.loanUserCar.organId].shopName);
		}
		/**
		 * 获取经办人列表
		 */
		function getUser() {
			srv.muser(function(xhr) {
				if (!xhr.code) {
					var us = {};
					for (var i in xhr.data) {
						var u = xhr.data[i];
						us[u.key] = u;
					}
					$scope.musers = us;
				} else {
					base.alert('获取经办人信息失败');
				}
			})
		}
		/**
		 * 获取汽车品牌
		 */
		function getBrands() {
			srv.carBrands(function(xhr) {
				if (!xhr.code) {
					var brands = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						brands[r.brandId] = r;
					}
					$scope.carbrands = brands;
				} else {
					base.alert('获取汽车品牌失败');
				}
			})
		}
		/**
		 * 获取车系列
		 */
		function getCarSeries(brandid) {
			srv.carSeries(brandid, function(xhr) {
				if (!xhr.code) {
					var sers = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						sers[r.serieId] = r;
					}
					$scope.carSeries = sers;
				} else {
					base.alert('获取汽车系列表失败');
				}
			})
		}
		/**
		 * 获取车型列表
		 */
		function getCarSpecs(serieid) {
			srv.carSpecs(serieid, function(xhr) {
				if (!xhr.code) {
					var spes = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						spes[r.specId] = r;
					}
					$scope.carSpecs = spes;
				} else {
					base.alert('获取车型列表失败');
				}
			})
		}
		/**
		 * 获取贴息
		 */
		function getCarApr(specid) {
			srv.carApr(specid, function(xhr) {
				if (!xhr.code) {
					var apr = {};
					for (var i in xhr.data) {
						var r = xhr.data[i];
						apr[r.discountId] = r;
					}
					$scope.carApr = apr;
				}
			})
		}

		function initCar() {
			var brandid = $scope.table.loanUserCar.brandId,
				serieId = $scope.table.loanUserCar.serieId,
				specId = $scope.table.loanUserCar.specId;
			getCarSeries(brandid);
			if (serieId) getCarSpecs(serieId);
			//if(specId) getCarApr(specId);
		}

		/**
		 * 获取本地常驻类型 @author wq 2016-02-18
		 */
		function getResidentType() {
			$.ajax({
					url: '../basicData/getResidentType.html',
					data: {
						'basicType': 4
					},
					async: false,
					dataType: 'JSON',
					success: function(datas) {
						var myData = datas;
						if (myData["code"] == 0) {
							$scope.basicDataList = myData.data;
						} else {
							console.log(datas);
						}
					},
					error: function(XMLHttpRequest, textStatus, errorThrown) {
						console.log(textStatus);
					}
				})
				//srv.getResidentType(function(xhr){
				//	if(!xhr.code){
				//		$scope.basicDataList = xhr.data;
				//	}
				//})
		}
		$scope.typeName = "";
		$scope.getTypeName = function() {
			var typeId = $scope.tableCopy.lender.residentType;
			$.map($scope.basicDataList, function(dataList, key) {
				if (dataList.typeId == typeId) {
					$scope.typeName = dataList.typeName;
				}
			})
		}
		//Mender wq 2016-03-23
		$scope.selecBoolean = true;
		$scope.selectOrganId = function(){
			var organ ;
			if($("#carShop").val() != undefined && $("#carShop").val() != ""){
				organ = $scope.mCarShopNames[$("#carShop").val()];
				if(organ != undefined && organ != null && organ.shopId != undefined && organ.shopId != ""){
					if(null != $scope.tableCopy.loanUserCar){
						$scope.tableCopy.loanUserCar.organId = organ.shopId;
						$scope.selecBoolean = true;
					}

				}else {
					$("#carShop").val("");
					//base.alert("请填入正确的经销商");
					$scope.selecBoolean = false;
				}
			}else{
				if($scope.tableCopy.loanUserCar != undefined && $scope.tableCopy.loanUserCar != null){
					$scope.tableCopy.loanUserCar.organId = "";
				}

			}
		}
		/**********绑定事件**********/
		$scope.saveBasic = function() {
			var basic = $scope.tableCopy.basicInformation,
				data = {
					'loanUser.orderNo': $scope.orderNo
				};
			if (base.isDefined(basic.regFrom))
				data['loanUser.regFrom'] = basic.regFrom;
			if (base.isDefined(basic.businessModel)) {
				data['loanUser.businessModel'] = basic.businessModel
			}
			if (base.isDefined(basic.bankId)) {
				data['loanUser.bankId'] = basic.bankId
			} else {
				base.alert('经办银行为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(basic.licenseCategory)) {
				data['loanUser.licenseCategory'] = basic.licenseCategory
			} else {
				base.alert('牌照类型是必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(basic.onLicensePlace)) {
				data['loanUser.onLicensePlace'] = basic.onLicensePlace
			}
			if (base.isDefined(basic.surveyId)) {
				data['loanOrder.surveyId'] = basic.surveyId
			} else {
				data['loanOrder.surveyId'] = 0;
			}

			if (base.isDefined(basic.sponsorId)) {
				data['loanOrder.sponsorId'] = basic.sponsorId
			} else {
				data['loanOrder.sponsorId'] = 0;
			}
			if (base.isDefined(basic.assistId)) {
				data['loanOrder.assistId'] = basic.assistId
			} else {
				data['loanOrder.assistId'] = 0;
			}
			if (base.isDefined(basic.signId)) {
				data['loanOrder.signId'] = basic.signId
			} else {
				data['loanOrder.signId'] = 0
			}
			srv.updBasic(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.basicInformation = !$scope.mode.basicInformation
					$scope.table.basicInformation = angular.copy($scope.tableCopy.basicInformation);
				} else {
					base.alert('保存基本信息失败，' + xhr.msg);
				}
			})
		}
		$scope.cancelBasic = function() {

			$scope.branchDept.deptId = null;
			$scope.deptUserList ={};
			$scope.mode.basicInformation = !$scope.mode.basicInformation;
			$scope.tableCopy.basicInformation = angular.copy($scope.table.basicInformation);
		}
			/**
			 * 分期数据
			 */
		$scope.saveStage = function() {
			var stage = $scope.tableCopy.loanUserStage,
				data = {
					'loanUserStage.orderNo': $scope.orderNo
				};
			if (base.isDefined(stage.advancedMoney)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(stage.advancedMoney)) {
					base.alert('垫资金额必须是数字');
					return;
				}
				data['loanUserStage.advancedMoney'] = stage.advancedMoney;
			} else {
				base.alert('垫资金额是必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(stage.commissionFeeRate)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(stage.commissionFeeRate)) {
					base.alert('分期手续费率必须是数字');
					return;
				}
				data['loanUserStage.commissionFeeRate'] = stage.commissionFeeRate;
			} else {
				base.alert('分期手续费是必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(stage.loanMoney)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(stage.loanMoney)) {
					base.alert('贷款金额必须是数字');
					return;
				}
				data['loanUserStage.loanMoney'] = stage.loanMoney;
			} else {
				base.alert('贷款金额是必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(stage.repayPeriod)) {
				data['loanUserStage.repayPeriod'] = stage.repayPeriod;
			} else {
				base.alert('还款期限是必填项，请完成后再保存');
				return;
			}
			srv.updStage(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.loanUserStage = !$scope.mode.loanUserStage;
					$scope.table.loanUserStage = angular.copy($scope.tableCopy.loanUserStage);
				} else {
					base.alert('保存分期信息失败，' + xhr.msg);
				}
			})
		}
		$scope.cancelState = function() {
				$scope.mode.loanUserStage = !$scope.mode.loanUserStage;
				$scope.tableCopy.loanUserStage = angular.copy($scope.table.loanUserStage);
			}
			/**
			 * 保存购车信息
			 */
		$scope.saveLoanUserCar = function() {
			$scope.selectOrganId();
			if(!$scope.selecBoolean){
				base.alert('请填入正确的经销商');
				return;
			}
			var car = $scope.tableCopy.loanUserCar,
				data = {
					'loanUserCar.orderNo': $scope.orderNo
				};

			if (base.isDefined(car.specId))
				data['loanUserCar.specId'] = car.specId
			else {
				base.alert('车辆型号为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(car.certificateNo)) {
				if (!/^[a-zA-Z0-9]{17}$/.test(car.certificateNo)) {
					base.alert('车架号必须是17位英文字母');
					return;
				}
				data['loanUserCar.certificateNo'] = car.certificateNo
			}
			if (base.isDefined(car.carPrice))
				data['loanUserCar.carPrice'] = car.carPrice
			else {
				base.alert('车辆价格为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(car.organId))
				data['loanUserCar.organId'] = car.organId
			else {
				if(!$scope.is4SOrder){
					base.alert('经销商为必填项，请完成后再保存');
					return;
				}
			}
			if (base.isDefined(car.discountId))
				data['loanUserCar.discountId'] = car.discountId;
			if (base.isDefined(car.renewalMode))
				data['loanUserCar.renewalMode'] = car.renewalMode
			else {
				base.alert('保险续费为必填项，请完成后再保存');
				return;
			}


			srv.updCar(data, function(xhr) {
				
				if (!xhr.code) {
						srv.info($scope.orderNo, function(xhr) {
							if (!xhr.code) {
								$scope.table = xhr.data;
								$scope.tableCopy = angular.copy($scope.table);
								
							}
						})
						$scope.mode.loanUserCar = !$scope.mode.loanUserCar;
						$scope.table.loanUserCar = angular.copy($scope.tableCopy.loanUserCar);
				} else {
					base.alert('保存购车信息失败，' + xhr.msg);
				}
			})
		}
		$scope.cancelCar = function() {
			$scope.mode.loanUserCar = !$scope.mode.loanUserCar;
			$scope.tableCopy.loanUserCar = angular.copy($scope.table.loanUserCar);
			if(null != $scope.table.loanUserCar.organId){
				$( "#carShop").val($scope.carShop[$scope.table.loanUserCar.organId].shopName);
			}
		}
		$scope.saveLender = function() {
			if(isNaN($scope.tableCopy.lender.monthIncomeMoney)){
				base.alert("请正确输入税后月收入");
				return;
			}
			var len = $scope.tableCopy.lender,
				data = {
					'loanUser.orderNo': $scope.orderNo
				};
			if (base.isDefined(len.company))
				data['loanUser.company'] = len.company
			else {
				base.alert('单位名称为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(len.companyTel))
				data['loanUser.companyTel'] = len.companyTel
			if (base.isDefined(len.familyTel))
				data['loanUser.familyTel'] = len.familyTel
			else {
				if(!$scope.is4SOrder){
					base.alert('家庭电话为必填项，请完成后再保存');
					return;
				}

			}
			if (base.isDefined(len.familyAddress))
				data['loanUser.familyAddress'] = len.familyAddress
			else {
				base.alert('家庭住址为必填项，请完成后再保存');
				return;
			}

			if (base.isDefined(len.mobile))
				data['loanUser.mobile'] = len.mobile;
			if (base.isDefined(len.account))
				data['loanUser.account'] = len.account;
			if (base.isDefined(len.password))
				data['loanUser.password'] = len.password;
			if (base.isDefined(len.companyAddress))
				data['loanUser.companyAddress'] = len.companyAddress;

			if (base.isDefined(len.residentType))
				data['loanUser.residentType'] = $scope.tableCopy.lender.residentType;
			if (base.isDefined(len.monthIncomeMoney))
				data['loanUser.monthIncomeMoney'] = $scope.tableCopy.lender.monthIncomeMoney;
			srv.updLoanUser(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.lender = !$scope.mode.lender;
					$scope.table.lender = angular.copy($scope.tableCopy.lender);
					$scope.getTypeName();
					$scope.table.lender["residentName"] = $scope.typeName;
				} else {
					base.alert('保存贷款人信息失败，' + xhr.msg);
				}
			})
		}

		$scope.cancelLender = function() {
			$scope.mode.lender = !$scope.mode.lender;
			$scope.tableCopy.lender = angular.copy($scope.table.lender);
		}

		$scope.saveMate = function() {
			var mate = $scope.tableCopy.loanUserSpouse,
				data = {
					'lenderDependent.orderNo': $scope.orderNo,
					'lenderDependent.lenderRelevance': 0
				};

			if (base.isDefined(mate.lenderPhone))
				data['lenderDependent.lenderPhone'] = mate.lenderPhone
			else {
				base.alert('联系电话为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(mate.lenderIsProperty))
				data['lenderDependent.lenderIsProperty'] = mate.lenderIsProperty
			if (base.isDefined(mate.lenderWorkUnit))
				data['lenderDependent.lenderWorkUnit'] = mate.lenderWorkUnit
			else {
				base.alert('单位名称为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(mate.lenderCompanyPhone))
				data['lenderDependent.lenderCompanyPhone'] = mate.lenderCompanyPhone
			if (base.isDefined(mate.familyPhone))
				data['lenderDependent.familyPhone'] = mate.familyPhone
			if (base.isDefined(mate.familyAddress))
				data['lenderDependent.familyAddress'] = mate.familyAddress

			srv.updMate(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.loanUserSpouse = !$scope.mode.loanUserSpouse;
					$scope.table.loanUserSpouse = angular.copy($scope.tableCopy.loanUserSpouse);
				} else {
					base.alert('保存配偶信息失败,' + xhr.msg)
				}
			})
		}

		$scope.cancelMate = function() {
			$scope.mode.loanUserSpouse = !$scope.mode.loanUserSpouse;
			$scope.tableCopy.loanUserSpouse = angular.copy($scope.table.loanUserSpouse);
		}

		$scope.saveAssure = function() {
			var as = $scope.tableCopy.loanUserGuarantee,
				data = {
					'lenderDependent.orderNo': $scope.orderNo,
					'lenderDependent.lenderRelevance': 1
				};

			if (base.isDefined(as.lenderPhone))
				data['lenderDependent.lenderPhone'] = as.lenderPhone
			if (base.isDefined(as.lenderIsProperty))
				data['lenderDependent.lenderIsProperty'] = as.lenderIsProperty
			if (base.isDefined(as.lenderWorkUnit))
				data['lenderDependent.lenderWorkUnit'] = as.lenderWorkUnit
			if (base.isDefined(as.lenderCompanyPhone))
				data['lenderDependent.lenderCompanyPhone'] = as.lenderCompanyPhone
			if (base.isDefined(as.familyAddress))
				data['lenderDependent.familyAddress'] = as.familyAddress
			if (base.isDefined(as.familyPhone))
				data['lenderDependent.familyPhone'] = as.familyPhone

			srv.updGuarantor(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.loanUserGuarantee = !$scope.mode.loanUserGuarantee;
					$scope.table.loanUserGuarantee = angular.copy($scope.tableCopy.loanUserGuarantee);
				} else {
					base.alert('保存反担保人信息失败，' + xhr.msg);
				}
			})
		}
		$scope.cancelAssure = function() {
			$scope.mode.loanUserGuarantee = !$scope.mode.loanUserGuarantee;
			$scope.tableCopy.loanUserGuarantee = angular.copy($scope.table.loanUserGuarantee);
		}

		$scope.saveContact = function() {
			var cc = $scope.tableCopy.loanUserContact,
				data = {
					'loanUser.orderNo': $scope.orderNo
				};
			if (base.isDefined(cc.firstEmergencyName))
				data['loanUser.firstEmergencyName'] = cc.firstEmergencyName
			else {
				base.alert('紧急联系人1为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(cc.firstEmergencyTel))
				data['loanUser.firstEmergencyTel'] = cc.firstEmergencyTel
			else {
				base.alert('联系电话为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(cc.firstEmergencyRalation))
				data['loanUser.firstEmergencyRalation'] = cc.firstEmergencyRalation
			if (base.isDefined(cc.twoEmergencyName))
				data['loanUser.twoEmergencyName'] = cc.twoEmergencyName
			else {
				base.alert('紧急联系人2为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(cc.twoEmergencyTel))
				data['loanUser.twoEmergencyTel'] = cc.twoEmergencyTel
			else {
				base.alert('联系电话为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(cc.twoEmergencyRalation))
				data['loanUser.twoEmergencyRalation'] = cc.twoEmergencyRalation

			srv.updContact(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.loanUserContact = !$scope.mode.loanUserContact;
					$scope.table.loanUserContact = angular.copy($scope.tableCopy.loanUserContact);
				} else {
					base.alert('保存紧急联系人失败，' + xhr.msg);
				}
			})
		}

		$scope.saveLoanOrgn = function() {
			var lo = $scope.tableCopy.loanOrgn,
				data = {
					'loanOrgn.orderNo': $scope.orderNo
				}
			if (base.isDefined(lo.contractPrice)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.contractPrice)) {
					base.alert('合同价必须是数字');
					return;
				}
				data['loanOrgn.contractPrice'] = lo.contractPrice;
			}
			if (base.isDefined(lo.loanBond)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.loanBond)) {
					base.alert('贷款保证金必须是数字');
					return;
				}
				data['loanOrgn.loanBond'] = lo.loanBond;
			}
			if (base.isDefined(lo.mortgageFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.mortgageFee)) {
					base.alert('按揭费必须是数字');
					return;
				}
				data['loanOrgn.mortgageFee'] = lo.mortgageFee;
			}
			if (base.isDefined(lo.totalFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.totalFee)) {
					base.alert('总费用必须是数字');
					return;
				}
				data['loanOrgn.totalFee'] = lo.totalFee;
			}
			if (base.isDefined(lo.manageFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.manageFee)) {
					base.alert('资产管理费必须是数字');
					return;
				}
				data['loanOrgn.manageFee'] = lo.manageFee;
			}
			if (base.isDefined(lo.marketFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.marketFee)) {
					base.alert('营销费用必须是数字');
					return;
				}
				data['loanOrgn.marketFee'] = lo.marketFee;
			}
			if (base.isDefined(lo.onCarBond)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.onCarBond)) {
					base.alert('上牌保证金必须是数字');
					return;
				}
				data['loanOrgn.onCarBond'] = lo.onCarBond;
			}
			if (base.isDefined(lo.collectingFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.collectingFee)) {
					base.alert('代收费用必须是数字');
					return;
				}
				data['loanOrgn.collectingFee'] = lo.collectingFee;
			}
			if (base.isDefined(lo.gpsFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.gpsFee)) {
					base.alert('GPS费用必须是数字');
					return;
				}
				data['loanOrgn.gpsFee'] = lo.gpsFee;
			}
			srv.updLoanOrgn(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.loanOrgn = !$scope.mode.loanOrgn;
					$scope.table.loanOrgn = angular.copy($scope.tableCopy.loanOrgn);
				} else {
					base.alert('保存失败，' + xhr.msg);
				}
			})
		}

		$scope.cancelLoanOrgn = function() {
			$scope.mode.loanOrgn = !$scope.mode.loanOrgn;
			$scope.table.loanOrgn = angular.copy($scope.tableCopy.loanOrgn);
		}

		$scope.cancelContract = function() {
			$scope.mode.loanUserContact = !$scope.mode.loanUserContact;
			$scope.tableCopy.loanUserContact = angular.copy($scope.table.loanUserContact);
		}

		$scope.setCarBrand = function() {
			$scope.carSeries = {};
			$scope.carSpecs = {};
			$scope.carApr = {};
			$scope.tableCopy.loanUserCar.serieId = null;
			$scope.tableCopy.loanUserCar.specId = null;
			//$scope.tableCopy.loanUserCar.discountId = null;
			if (!$scope.tableCopy.loanUserCar.brandId) return;
			getCarSeries($scope.tableCopy.loanUserCar.brandId);

		}

		$scope.setCarSerie = function() {
			$scope.carSpecs = {};
			$scope.carApr = {};
			$scope.tableCopy.loanUserCar.specId = null;
			//$scope.tableCopy.loanUserCar.discountId = null;
			if (!$scope.tableCopy.loanUserCar.serieId) return;
			getCarSpecs($scope.tableCopy.loanUserCar.serieId);
		}

		$scope.setCarSpec = function() {
			$scope.carApr = {};
			//$scope.tableCopy.loanUserCar.discountId = null;
			if (!$scope.tableCopy.loanUserCar.specId) return;
			//getCarApr($scope.tableCopy.loanUserCar.specId);
		}

		$scope.isempty = function(o) {
			return angular.element.isEmptyObject(o);
		}

		$scope.submitOrder = function() {

			if ($scope.sending_order) return;

			//	$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {

				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})

				} else if (xhr.code == 1) {

					base.alert(xhr.msg);
					$location.path('/loan');

				} else {

					//$scope.sending_order = true;
					base.alert(xhr.msg);
				}
			})

		}
		$scope.checkChange = function() {
			srv.presend($scope.orderNo, function(xhr) {
				if (!!xhr.code) {
					var diag = base.alert(xhr.msg);
					diag.closePromise.then(function() {
						$scope.tableCopy.basicInformation.surveyId = $scope.copySurveyId;
					})

					return;
				}
			})
		}
		//待定
		//$scope.carShopSelect = function(){
		//	var inputVal = $("#carShop").val();
		//	if(inputVal == "") {
		//		$scope.carShopNames = $scope.carShopNamesF;
		//		return false;
		//	}
		//	var myIndex = 0;
		//	for(var shopId in $scope.carShop){
		//		if($scope.carShop[shopId].shopName.indexOf(inputVal) >=0){
		//			myIndex ++;
		//			if(myIndex == 1){
		//				$("#carShop").val($scope.carShop[shopId].shopName);
		//			}
		//			$scope.carShopNames[myIndex] = $scope.carShop[shopId].shopName;
		//		}
		//	}
		//}
	}
])
kry.controller('ctrl.loan', [
	'$scope',
	'$rootScope',
	'$location',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$location,
		base,
		srv
	) {
		$root.setSite({
			title: '贷款材料管理',
			menuKey: 'loanMaterialConfig'
		})

		$scope.pageParams = {
			'loanOrderMaterial.backStatus': parseInt($location.$$search.type) || 0,
			'pageNum': 1,
			'loanOrderMaterial.idCard': '',
			'loanOrderMaterial.realName': '',
			'loanOrderMaterial.orderNo': ''
		};
		$scope.page = {};

		function getLoan() {
			srv.loan($scope.pageParams, function(xhr) {
				if (xhr.total > 0) {
					$scope.page.loan = xhr.rows;
					$scope.pageParams['pageNum'] = xhr.page;
					$scope.page.pageSize = xhr.pageSize;
					$scope.page.total = xhr.total;
					$scope.page.totalPage = parseInt(xhr.total / xhr.pageSize) + (xhr.total % xhr.pageSize > 0 ? 1 : 0);
					$scope.page.totalPagesArr = [];
					for (var i = 0; i < $scope.page.totalPage; i++) {
						$scope.page.totalPagesArr.push(i);
					}
				} else {
					$scope.page.loan = [];
					$scope.page.total = 0;
				}
			})
		}

		srv.tiper(2, function(xhr) {
			if (!xhr.code) {
				$scope.tipers = xhr.data;
			}
		})

		$scope.isStatus = function(code) {
			return $scope.pageParams['loanOrderMaterial.backStatus'] == code;
		}

		$scope.getUrl = function(row) {
			var urls = [
				'#/loan/info/',
				'#/loan/srv/',
				'#/loan/risk/'
			]
			return (urls[$scope.pageParams['loanOrderMaterial.backStatus']] || urls[0]) + row.cols.orderNo;
		}

		$scope.search = function() {
			$scope.pageParams['pageNum'] = 1;
			getLoan();
		}

		$scope.pagePrev = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == 1) return;
			$scope.pageParams['pageNum'] = cp - 1;
			getLoan();
		}

		$scope.pageNext = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == $scope.page.totalPage) return;
			$scope.pageParams['pageNum'] = cp + 1;
			getLoan();
		}

		$scope.setPage = function(p) {
			if (p == $scope.pageParams['pageNum']) return;
			$scope.pageParams['pageNum'] = p;
			getLoan();
		}
		$scope.setBackStatus = function(code) {
			$scope.pageParams['loanOrderMaterial.backStatus'] = code;
			$scope.pageParams['pageNum'] = 1; //tab切换时重置页码。
			getLoan();
		}
		getLoan();
		/*
		$scope.$watch(function (){
			return $scope.pageParams['pageNum'];
		}, function() {
			getLoan();	
		});
		*/
	}
])
kry.controller('ctrl.loan.risk.auth', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'ngDialog',
	'$location',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		dialog,
		$location,
		base,
		srv
	) {
		$root.setSite({
			title: '风控退回审核意见',
			menuKey: 'loanMaterialConfig'
		})

		$scope.orderNo = $params.orderNo;

		srv.auth($scope.orderNo, function(xhr) {
			if (!xhr.code)
				$scope.authRes = xhr.data;
		})

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			//	$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}
					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}

	}
])
kry.controller('ctrl.loan.risk.files', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'base',
	'ngDialog',
	'srv',
	'navs',
	function(
		$scope,
		$root,
		$params,
		$location,
		base,
		dialog,
		srv,
		navs
	) {
		$root.setSite({
			title: '风控退回贷款材料',
			menuKey: 'loanMaterialConfig'
		})
		$scope.orderNo = $params.orderNo;
		$scope.flowId = 2;
		$scope.showKey = '';
		$scope.fillMates = [];
		$scope.emptyMates = [];
		getFlowId();
		//得到flowId
		function getFlowId() {
			$.ajax({
				url: '../loanOrder/getLoanOrderByOrderNo.html',
				data: {
					'orderNo': $scope.orderNo
				},
				type: 'POST',
				async: false,
				dataType: 'JSON',
				success: function(datas) {
					$scope.flowId = datas.data.flowId;
				},
				error: function(textStatus) {}
			})
		}

		srv.files($scope.flowId, $scope.orderNo, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				$scope.showKey = $scope.fileList[0].key;
				if (!$scope.lastFile) return;
				for (var i in $scope.lastFile.mate) {
					var f = $scope.lastFile.mate[i];
					if (!!f.mateStatus)
						$scope.fillMates.push(f);
					else {
						$scope.emptyMates.push(f);
					}
				}
				$scope.em = $scope.emptyMates[0];
			} else {
				base.alert('获取材料列表失败');
			}
		})

		$scope.getFile = function(f) {
			if (!f) return 0;
			var count = 0;
			for (var i in f.mate) {
				var m = f.mate[i];
				if (!!m.mateStatus) {
					count++;
				}
			}
			return count;
		}

		$scope.deleteFile = function(m) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletefile($scope.orderNo, m.mateId, function(xhr) {
					if (!xhr.code) {
						m.mateStatus = 0;
						m.matePic = '';
						m.thumbnailPic = '';
						m.auditResult = null;
						m.auditOpinion = null;
					} else {
						base.alert('删除' + m.mateName + '图片失败');
					}
				})
			});
		}

		$scope.viewImage = function(m) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $root.globalImgPath + m.matePic
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}

		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.uploadSuccess = function(res, cfg, tar) {
			if (!res.code) {
				tar.mateStatus = 1;
				tar.matePic = res.url;
				tar.thumbnailPic = res.url;
				tar.auditResult = null;
				tar.auditOpinion = null;
			}
		}

		$scope.deleteOtherFile = function(f, idx) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value == 1) {
					srv.deletefile($scope.orderNo, f.mateId, function(xhr) {
						if (!xhr.code) {
							f.mateStatus = 0;
							f.matePic = '';
							f.thumbnailPic = '';
							f.auditResult = null;
							f.auditOpinion = null;
							$scope.emptyMates.push(f);
							$scope.fillMates.splice(idx, 1);
							$scope.em = $scope.emptyMates[0];
						} else {
							base.alert('删除' + m.mateName + '图片失败');
						}
					})
				}
			})
		}

		$scope.otherSuccess = function(res, cfg, tar) {
			if (!res.code) {
				if (!!tar.mateStatus) {
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditResult = null;
					tar.auditOpinion = null;
				} else {
					tar.mateStatus = 1;
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditResult = null;
					tar.auditOpinion = null;
					$scope.fillMates.push(tar);
					$scope.emptyMates.splice(0, 1);
					$scope.em = $scope.emptyMates[0];
				}
			}
		}

		$scope.setWrapper = function(file) {
			if ($scope.showKey == file.key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = file.key;
			}
		}
		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			//	$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}
					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.loan.risk', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '风控退单订单详情(流转单)',
			menuKey: 'loanMaterialConfig'
		})

		$scope.orderNo = $params.orderNo;

		$scope.bussMode = [{
			id: 0,
			name: '标准'
		}, {
			id: 1,
			name: '资产管理'
		}]
		$scope.payLimit = [{
			limit: 12,
			name: '12期'
		}, {
			limit: 18,
			name: '18期'
		}, {
			limit: 24,
			name: '24期'
		}, {
			limit: 36,
			name: '36期'
		}]
		$scope.renewalMode = [{
			id: 0,
			name: '自行办理'
		}, {
			id: 1,
			name: '单位承保'
		}]
		$scope.house = [{
			id: 0,
			name: '无'
		}, {
			id: 1,
			name: '有'
		}]
		$scope.basicDataList = {};
		var carShops = new Array();
		$scope.carShopNames={};
		$scope.mCarShopNames={};
		$scope.is4SOrder = false;
		$scope.branchDeptList = {};
		$scope.branchDept = {'deptId':'','deptName':''};
		$scope.deptUser = {'userId':'','userName':''}
		$scope.deptUserList = {};
		$scope.musers4S = {};

		//检查是否是4S订单
		$scope.check4SOrder= function(){
			srv.is4SOrder($scope.orderNo,function(result){
				$scope.is4SOrder = false;
				if(!result.code){
					if(result.data == "true"){
						$scope.is4SOrder = true;
						var param = {'user.userDeptParentId':$scope.branchDept.deptId,'user.userDeptId':$scope.branchDept.deptId};
						srv.getUserList(param,function(xhr) {
							if (!xhr.code) {
								var us = {};
								for (var i in xhr.data) {
									var u = xhr.data[i];
									us[u.userId] = u;
								}
								$scope.musers4S = us;
							} else {
								
							}
						})
					}
				}

			});
		}

		srv.info($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.table = xhr.data;
				$scope.tableCopy = angular.copy($scope.table);
				$scope.copySurveyId = angular.copy($scope.table.basicInformation.surveyId);
				if ($scope.table.loanUserCar && $scope.table.loanUserCar.brandId) {
					initCar();
				}
				$scope.branchDept.deptId = $scope.table.loanOrder.deptId
				//获取分公司
				srv.getBranchDept($scope.table.loanOrder.deptId,function(result){
					if(!result.code){
						$scope.branchDeptList = result.data;
						
					}
				});

				$scope.check4SOrder();
			}
		});
		$scope.getDeptUser = function(){
			if(null == $scope.branchDept.deptId){
				$scope.deptUserList = {};
			}else{
				var params = {'user.userDeptId':$scope.branchDept.deptId};
				srv.getUserList(params,function(result){
					if(!result.code){
						$scope.deptUserList = result.data;
					}
				})
			}

		}

		$scope.mode = {
				//基本信息
				basicInformation: false,
				//分期信息
				loanUserStage: false,
				//购车信息
				loanUserCar: false,
				lender: false,
				loanUserSpouse: false,
				loanUserGuarantee: false,
				loanUserContact: false,
				loanOrgn: false,
				approval: false
			}
			/********************初始化*********************/
		getBankList();
		get4Shop();
		getUser();
		getBrands();
		getResidentType();
		/**
		 * 获取银行列表
		 */
		function getBankList() {
			srv.queryBank(function(xhr) {
				if (!xhr.code) {
					var banks = {};
					for (var i in xhr.data) {
						var row = xhr.data[i];
						banks[row.bankId] = row;
					}
					$scope.banks = banks;
				} else {
					base.alert('获取银行列表失败');
				}
			})
		}
		/**
		 * 获取4S店
		 */
		function get4Shop() {
			srv.carShop(function(xhr) {
				if (!xhr.code) {
					var shop = {};
					for (var i in xhr.data) {
						var s = xhr.data[i];
						shop[s.shopId] = s;
						carShops[i] = s.shopName;
						$scope.carShopNames[i] = s.shopName;
						$scope.mCarShopNames[s.shopName] = s;
					}
					$scope.carShop = shop;
				} else {
					base.alert('获取4S店信息失败');
				}
			})
		}
		$scope.getShops = function(){
			if(null != $scope.table.loanUserCar && $scope.table.loanUserCar != undefined && $scope.carShop != undefined){
				if($scope.carShop[$scope.table.loanUserCar.organId] != undefined && $scope.carShop[$scope.table.loanUserCar.organId]!=""){
					$( "#carShop").val($scope.carShop[$scope.table.loanUserCar.organId].shopName);
				}
			}

			$( "#carShop" ).autocomplete({
				source: carShops,
				autoFocus:true,
				appendTo:"#selectTd"
			});
		}
		$scope.setInputVal = function(){
			$("#carShop").val($scope.carShop[$scope.tableCopy.loanUserCar.organId].shopName);
		}

		//Mender wq 2016-03-23
		$scope.selecBoolean = true;
		$scope.selectOrganId = function(){
			var organ ;
			if($("#carShop").val() != undefined && $("#carShop").val() != ""){
				organ = $scope.mCarShopNames[$("#carShop").val()];
				if(organ != undefined && organ != null && organ.shopId != undefined && organ.shopId != ""){
					if(null != $scope.tableCopy.loanUserCar){
						$scope.tableCopy.loanUserCar.organId = organ.shopId;
						$scope.selecBoolean = true;
					}

				}else {
					$("#carShop").val("");
					//base.alert("请填入正确的经销商");
					$scope.selecBoolean = false;
				}
			}else{
				if($scope.tableCopy.loanUserCar != undefined && $scope.tableCopy.loanUserCar != null){
					$scope.tableCopy.loanUserCar.organId = "";
				}

			}
		}
		/**
		 * 获取经办人列表
		 */
		function getUser() {
			srv.muser(function(xhr) {
				if (!xhr.code) {
					var us = {};
					for (var i in xhr.data) {
						var u = xhr.data[i];
						us[u.key] = u;
					}
					$scope.musers = us;
				} else {
					base.alert('获取经办人信息失败');
				}
			})
		}
		/**
		 * 获取汽车品牌
		 */
		function getBrands() {
			srv.carBrands(function(xhr) {
				if (!xhr.code) {
					var brands = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						brands[r.brandId] = r;
					}
					$scope.carbrands = brands;
				} else {
					base.alert('获取汽车品牌失败');
				}
			})
		}
		/**
		 * 获取车系列
		 */
		function getCarSeries(brandid) {
			srv.carSeries(brandid, function(xhr) {
				if (!xhr.code) {
					var sers = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						sers[r.serieId] = r;
					}
					$scope.carSeries = sers;
				} else {
					base.alert('获取汽车系列表失败');
				}
			})
		}
		/**
		 * 获取车型列表
		 */
		function getCarSpecs(serieid) {
			srv.carSpecs(serieid, function(xhr) {
				if (!xhr.code) {
					var spes = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						spes[r.specId] = r;
					}
					$scope.carSpecs = spes;
				} else {
					base.alert('获取车型列表失败');
				}
			})
		}
		/**
		 * 获取贴息
		 */
		function getCarApr(specid) {
			srv.carApr(specid, function(xhr) {
				if (!xhr.code) {
					var apr = {};
					for (var i in xhr.data) {
						var r = xhr.data[i];
						apr[r.discountId] = r;
					}
					$scope.carApr = apr;
				}
			})
		}

		function initCar() {
			var brandid = $scope.table.loanUserCar.brandId,
				serieId = $scope.table.loanUserCar.serieId,
				specId = $scope.table.loanUserCar.specId;
			getCarSeries(brandid);
			if (serieId) getCarSpecs(serieId);
			//if(specId) getCarApr(specId);
		}
		/**
		 * 获取本地常驻类型 @author wq 2016-02-18
		 */

		function getResidentType() {
			$.ajax({
					url: '../basicData/getResidentType.html',
					data: {
						'basicType': 4
					},
					async: false,
					dataType: 'JSON',
					success: function(datas) {
						var myData = datas;
						if (myData["code"] == 0) {
							$scope.basicDataList = myData.data;
						} else {
							console.log(datas);
						}
					},
					error: function(XMLHttpRequest, textStatus, errorThrown) {
						console.log(textStatus);
					}
				})
				//srv.getResidentType(function(xhr){
				//	if(!xhr.code){
				//		$scope.basicDataList = xhr.data;
				//	}
				//})
		}
		$scope.typeName = "";
		$scope.getTypeName = function() {
				var typeId = $scope.tableCopy.lender.residentType;
				$.map($scope.basicDataList, function(dataList, key) {
					if (dataList.typeId == typeId) {
						$scope.typeName = dataList.typeName;
					}
				})
			}
			/**********绑定事件**********/
		$scope.saveBasic = function() {
			var basic = $scope.tableCopy.basicInformation,
				data = {
					'loanUser.orderNo': $scope.orderNo
				};
			if (base.isDefined(basic.regFrom))
				data['loanUser.regFrom'] = basic.regFrom;
			if (base.isDefined(basic.businessModel)) {
				data['loanUser.businessModel'] = basic.businessModel
			}
			if (base.isDefined(basic.onLicensePlace)) {
				data['loanUser.onLicensePlace'] = basic.onLicensePlace
			}
			if (base.isDefined(basic.bankId)) {
				data['loanUser.bankId'] = basic.bankId
			} else {
				base.alert('经办银行为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(basic.licenseCategory)) {
				data['loanUser.licenseCategory'] = basic.licenseCategory
			} else {
				base.alert('牌照类型是必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(basic.surveyId)) {
				data['loanOrder.surveyId'] = basic.surveyId
			} else {
				data['loanOrder.surveyId'] = 0;
			}

			if (base.isDefined(basic.sponsorId)) {
				data['loanOrder.sponsorId'] = basic.sponsorId
			} else {
				data['loanOrder.sponsorId'] = 0;
			}
			if (base.isDefined(basic.assistId)) {
				data['loanOrder.assistId'] = basic.assistId
			} else {
				data['loanOrder.assistId'] = 0;
			}
			if (base.isDefined(basic.signId)) {
				data['loanOrder.signId'] = basic.signId
			} else {
				data['loanOrder.signId'] = 0
			}
			srv.updBasic(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.basicInformation = !$scope.mode.basicInformation
					$scope.table.basicInformation = angular.copy($scope.tableCopy.basicInformation);
				} else {
					base.alert('保存基本信息失败，' + xhr.msg);
				}
			})
		}
		$scope.cancelBasic = function() {
			$scope.branchDept.deptId = null;
			$scope.deptUserList ={};
				$scope.mode.basicInformation = !$scope.mode.basicInformation;
				$scope.tableCopy.basicInformation = angular.copy($scope.table.basicInformation);
			}
			/**
			 * 分期数据
			 */
		$scope.saveStage = function() {
			var stage = $scope.tableCopy.loanUserStage,
				data = {
					'loanUserStage.orderNo': $scope.orderNo
				};
			if (base.isDefined(stage.advancedMoney)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(stage.advancedMoney)) {
					base.alert('垫资金额必须是数字');
					return;
				}
				data['loanUserStage.advancedMoney'] = stage.advancedMoney;
			} else {
				base.alert('垫资金额是必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(stage.commissionFeeRate)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(stage.commissionFeeRate)) {
					base.alert('分期手续费率必须是数字');
					return;
				}
				data['loanUserStage.commissionFeeRate'] = stage.commissionFeeRate;
			} else {
				base.alert('分期手续费是必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(stage.loanMoney)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(stage.loanMoney)) {
					base.alert('贷款金额必须是数字');
					return;
				}
				data['loanUserStage.loanMoney'] = stage.loanMoney;
			} else {
				base.alert('贷款金额是必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(stage.repayPeriod)) {
				data['loanUserStage.repayPeriod'] = stage.repayPeriod;
			}
			srv.updStage(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.loanUserStage = !$scope.mode.loanUserStage;
					$scope.table.loanUserStage = angular.copy($scope.tableCopy.loanUserStage);
				} else {
					base.alert('保存分期信息失败，' + xhr.msg);
				}
			})
		}
		$scope.cancelState = function() {
				$scope.mode.loanUserStage = !$scope.mode.loanUserStage;
				$scope.tableCopy.loanUserStage = angular.copy($scope.table.loanUserStage);
			}
			/**
			 * 保存购车信息
			 */
		$scope.saveLoanUserCar = function() {
			$scope.selectOrganId();
			var car = $scope.tableCopy.loanUserCar,
				data = {
					'loanUserCar.orderNo': $scope.orderNo
				};

			if (base.isDefined(car.specId))
				data['loanUserCar.specId'] = car.specId
			else {
				base.alert('车辆型号为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(car.certificateNo)) {
				if (!/^[a-zA-Z0-9]{17}$/.test(car.certificateNo)) {
					base.alert('车架号必须是17位英文字母');
					return;
				}
				data['loanUserCar.certificateNo'] = car.certificateNo
			}
			if (base.isDefined(car.carPrice))
				data['loanUserCar.carPrice'] = car.carPrice
			else {
				base.alert('车辆价格为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(car.organId))
				data['loanUserCar.organId'] = car.organId
			else {
				if(!$scope.is4SOrder){
					base.alert('经销商为必填项，请完成后再保存');
					return;
				}
			}
			if (base.isDefined(car.discountId))
				data['loanUserCar.discountId'] = car.discountId;
			if (base.isDefined(car.renewalMode))
				data['loanUserCar.renewalMode'] = car.renewalMode
			else {
				base.alert('保险续费为必填项，请完成后再保存');
				return;
			}
			srv.updCar(data, function(xhr) {
				if (!xhr.code) {
						srv.info($scope.orderNo, function(xhr) {
							if (!xhr.code) {
								$scope.table = xhr.data;
								$scope.tableCopy = angular.copy($scope.table);
								
							}
						})
					$scope.mode.loanUserCar = !$scope.mode.loanUserCar;
					$scope.table.loanUserCar = angular.copy($scope.tableCopy.loanUserCar);
				} else {
					base.alert('保存购车信息失败，' + xhr.msg);
				}
			})
		}
		$scope.cancelCar = function() {
			$scope.mode.loanUserCar = !$scope.mode.loanUserCar;
			$scope.tableCopy.loanUserCar = angular.copy($scope.table.loanUserCar);
			if(null != $scope.table.loanUserCar.organId){
				$( "#carShop").val($scope.carShop[$scope.table.loanUserCar.organId].shopName);
			}

		}
		$scope.saveLender = function() {
			if(isNaN($scope.tableCopy.lender.monthIncomeMoney)){
				base.alert("请正确输入税后月收入");
				return;
			}
			var len = $scope.tableCopy.lender,
				data = {
					'loanUser.orderNo': $scope.orderNo
				};
			if (base.isDefined(len.company))
				data['loanUser.company'] = len.company
			else {
				base.alert('单位名称为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(len.companyTel))
				data['loanUser.companyTel'] = len.companyTel
			if (base.isDefined(len.familyTel))
				data['loanUser.familyTel'] = len.familyTel
			else {
				if(!$scope.is4SOrder){
					base.alert('家庭电话为必填项，请完成后再保存');
					return;
				}
			}
			if (base.isDefined(len.familyAddress))
				data['loanUser.familyAddress'] = len.familyAddress
			else {
				base.alert('家庭住址为必填项，请完成后再保存');
				return;
			}

			if (base.isDefined(len.mobile))
				data['loanUser.mobile'] = len.mobile;
			if (base.isDefined(len.account))
				data['loanUser.account'] = len.account;
			if (base.isDefined(len.password))
				data['loanUser.password'] = len.password;
			if (base.isDefined(len.companyAddress))
				data['loanUser.companyAddress'] = len.companyAddress;

			if (base.isDefined(len.residentType))
				data['loanUser.residentType'] = $scope.tableCopy.lender.residentType;
			if (base.isDefined(len.monthIncomeMoney))
				data['loanUser.monthIncomeMoney'] = $scope.tableCopy.lender.monthIncomeMoney;
			srv.updLoanUser(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.lender = !$scope.mode.lender;
					$scope.table.lender = angular.copy($scope.tableCopy.lender);
					$scope.getTypeName();
					$scope.table.lender["residentName"] = $scope.typeName;
				} else {
					base.alert('保存贷款人信息失败，' + xhr.msg);
				}
			})
		}

		$scope.cancelLender = function() {
			$scope.mode.lender = !$scope.mode.lender;
			$scope.tableCopy.lender = angular.copy($scope.table.lender);
		}

		$scope.saveMate = function() {
			var mate = $scope.tableCopy.loanUserSpouse,
				data = {
					'lenderDependent.orderNo': $scope.orderNo,
					'lenderDependent.lenderRelevance': 0
				};

			if (base.isDefined(mate.lenderPhone))
				data['lenderDependent.lenderPhone'] = mate.lenderPhone
			else {
				base.alert('联系电话为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(mate.lenderIsProperty))
				data['lenderDependent.lenderIsProperty'] = mate.lenderIsProperty
			if (base.isDefined(mate.lenderWorkUnit))
				data['lenderDependent.lenderWorkUnit'] = mate.lenderWorkUnit
			else {
				base.alert('单位名称为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(mate.lenderCompanyPhone))
				data['lenderDependent.lenderCompanyPhone'] = mate.lenderCompanyPhone
			if (base.isDefined(mate.familyPhone))
				data['lenderDependent.familyPhone'] = mate.familyPhone
			if (base.isDefined(mate.familyAddress))
				data['lenderDependent.familyAddress'] = mate.familyAddress

			srv.updMate(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.loanUserSpouse = !$scope.mode.loanUserSpouse;
					$scope.table.loanUserSpouse = angular.copy($scope.tableCopy.loanUserSpouse);
				} else {
					base.alert('保存配偶信息失败,' + xhr.msg)
				}
			})
		}

		$scope.cancelMate = function() {
			$scope.mode.loanUserSpouse = !$scope.mode.loanUserSpouse;
			$scope.tableCopy.loanUserSpouse = angular.copy($scope.table.loanUserSpouse);
		}

		$scope.saveAssure = function() {
			var as = $scope.tableCopy.loanUserGuarantee,
				data = {
					'lenderDependent.orderNo': $scope.orderNo,
					'lenderDependent.lenderRelevance': 1
				};

			if (base.isDefined(as.lenderPhone))
				data['lenderDependent.lenderPhone'] = as.lenderPhone
			if (base.isDefined(as.lenderIsProperty))
				data['lenderDependent.lenderIsProperty'] = as.lenderIsProperty
			if (base.isDefined(as.lenderWorkUnit))
				data['lenderDependent.lenderWorkUnit'] = as.lenderWorkUnit
			if (base.isDefined(as.lenderCompanyPhone))
				data['lenderDependent.lenderCompanyPhone'] = as.lenderCompanyPhone
			if (base.isDefined(as.familyAddress))
				data['lenderDependent.familyAddress'] = as.familyAddress
			if (base.isDefined(as.familyPhone))
				data['lenderDependent.familyPhone'] = as.familyPhone

			srv.updGuarantor(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.loanUserGuarantee = !$scope.mode.loanUserGuarantee;
					$scope.table.loanUserGuarantee = angular.copy($scope.tableCopy.loanUserGuarantee);
				} else {
					base.alert('保存反担保人信息失败，' + xhr.msg);
				}
			})
		}
		$scope.cancelAssure = function() {
			$scope.mode.loanUserGuarantee = !$scope.mode.loanUserGuarantee;
			$scope.tableCopy.loanUserGuarantee = angular.copy($scope.table.loanUserGuarantee);
		}

		$scope.saveContact = function() {
			var cc = $scope.tableCopy.loanUserContact,
				data = {
					'loanUser.orderNo': $scope.orderNo
				};
			if (base.isDefined(cc.firstEmergencyName))
				data['loanUser.firstEmergencyName'] = cc.firstEmergencyName
			else {
				base.alert('紧急联系人1为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(cc.firstEmergencyTel))
				data['loanUser.firstEmergencyTel'] = cc.firstEmergencyTel
			else {
				base.alert('联系电话为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(cc.firstEmergencyRalation))
				data['loanUser.firstEmergencyRalation'] = cc.firstEmergencyRalation
			if (base.isDefined(cc.twoEmergencyName))
				data['loanUser.twoEmergencyName'] = cc.twoEmergencyName
			else {
				base.alert('紧急联系人2为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(cc.twoEmergencyTel))
				data['loanUser.twoEmergencyTel'] = cc.twoEmergencyTel
			else {
				base.alert('联系电话为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(cc.twoEmergencyRalation))
				data['loanUser.twoEmergencyRalation'] = cc.twoEmergencyRalation

			srv.updContact(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.loanUserContact = !$scope.mode.loanUserContact;
					$scope.table.loanUserContact = angular.copy($scope.tableCopy.loanUserContact);
				} else {
					base.alert('保存紧急联系人失败，' + xhr.msg);
				}
			})
		}

		$scope.cancelContract = function() {
			$scope.mode.loanUserContact = !$scope.mode.loanUserContact;
			$scope.tableCopy.loanUserContact = angular.copy($scope.table.loanUserContact);
		}
		$scope.saveLoanOrgn = function() {
			var lo = $scope.tableCopy.loanOrgn,
				data = {
					'loanOrgn.orderNo': $scope.orderNo
				}
			if (base.isDefined(lo.contractPrice)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.contractPrice)) {
					base.alert('合同价必须是数字');
					return;
				}
				data['loanOrgn.contractPrice'] = lo.contractPrice;
			}
			if (base.isDefined(lo.loanBond)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.loanBond)) {
					base.alert('贷款保证金必须是数字');
					return;
				}
				data['loanOrgn.loanBond'] = lo.loanBond;
			}
			if (base.isDefined(lo.mortgageFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.mortgageFee)) {
					base.alert('按揭费必须是数字');
					return;
				}
				data['loanOrgn.mortgageFee'] = lo.mortgageFee;
			}
			if (base.isDefined(lo.totalFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.totalFee)) {
					base.alert('总费用必须是数字');
					return;
				}
				data['loanOrgn.totalFee'] = lo.totalFee;
			}
			if (base.isDefined(lo.manageFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.manageFee)) {
					base.alert('资产管理费必须是数字');
					return;
				}
				data['loanOrgn.manageFee'] = lo.manageFee;
			}
			if (base.isDefined(lo.marketFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.marketFee)) {
					base.alert('营销费用必须是数字');
					return;
				}
				data['loanOrgn.marketFee'] = lo.marketFee;
			}
			if (base.isDefined(lo.onCarBond)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.onCarBond)) {
					base.alert('上牌保证金必须是数字');
					return;
				}
				data['loanOrgn.onCarBond'] = lo.onCarBond;
			}
			if (base.isDefined(lo.collectingFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.collectingFee)) {
					base.alert('代收费用必须是数字');
					return;
				}
				data['loanOrgn.collectingFee'] = lo.collectingFee;
			}
			srv.updLoanOrgn(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.loanOrgn = !$scope.mode.loanOrgn;
					$scope.table.loanOrgn = angular.copy($scope.tableCopy.loanOrgn);
				} else {
					base.alert('保存失败，' + xhr.msg);
				}
			})
		}

		$scope.cancelLoanOrgn = function() {
			$scope.mode.loanOrgn = !$scope.mode.loanOrgn;
			$scope.table.loanOrgn = angular.copy($scope.tableCopy.loanOrgn);
		}

		$scope.setCarBrand = function() {
			$scope.carSeries = {};
			$scope.carSpecs = {};
			$scope.carApr = {};
			$scope.tableCopy.loanUserCar.serieId = null;
			$scope.tableCopy.loanUserCar.specId = null;
			//$scope.tableCopy.loanUserCar.discountId = null;
			if (!$scope.tableCopy.loanUserCar.brandId) return;
			getCarSeries($scope.tableCopy.loanUserCar.brandId);

		}

		$scope.setCarSerie = function() {
			$scope.carSpecs = {};
			$scope.carApr = {};
			$scope.tableCopy.loanUserCar.specId = null;
			//$scope.tableCopy.loanUserCar.discountId = null;
			if (!$scope.tableCopy.loanUserCar.serieId) return;
			getCarSpecs($scope.tableCopy.loanUserCar.serieId);
		}

		$scope.setCarSpec = function() {
			$scope.carApr = {};
			//$scope.tableCopy.loanUserCar.discountId = null;
			if (!$scope.tableCopy.loanUserCar.specId) return;
			//getCarApr($scope.tableCopy.loanUserCar.specId);
		}

		$scope.isempty = function(o) {
			return angular.element.isEmptyObject(o);
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			//		$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/car');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}
					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
		$scope.checkChange = function() {
			srv.presend($scope.orderNo, function(xhr) {
				if (!!xhr.code) {
					var diag = base.alert(xhr.msg);
					diag.closePromise.then(function() {
						$scope.tableCopy.basicInformation.surveyId = $scope.copySurveyId;
					})

					return;
				}
			})
		}
	}
])
kry.controller('ctrl.loan.srv.auth', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '客服退回审核意见',
			menuKey: 'loanMaterialConfig'
		})

		$scope.orderNo = $params.orderNo;

		srv.auth($scope.orderNo, function(xhr) {
			if (!xhr.code)
				$scope.authRes = xhr.data;
		})

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}
					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}

	}
])
kry.controller('ctrl.loan.srv.files', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'base',
	'ngDialog',
	'srv',
	'navs',
	function(
		$scope,
		$root,
		$params,
		$location,
		base,
		dialog,
		srv,
		navs
	) {
		$root.setSite({
			title: '客服退回贷款材料',
			menuKey: 'loanMaterialConfig'
		})
		$scope.orderNo = $params.orderNo;
		$scope.flowId = 2;
		$scope.showKey = '';
		$scope.fillMates = [];
		$scope.emptyMates = [];
		getFlowId();
		//得到flowId
		function getFlowId(){
			$.ajax({
				url:'../loanOrder/getLoanOrderByOrderNo.html',
				data:{'orderNo':$scope.orderNo},
				type:'POST',
				async:false,
				dataType:'JSON',
				success:function(datas){
					$scope.flowId = datas.data.flowId;
				},
				error:function(textStatus){
				}
			})
		}
		srv.files($scope.flowId, $scope.orderNo, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				$scope.showKey = $scope.fileList[0].key;
				if (!$scope.lastFile) return;
				for (var i in $scope.lastFile.mate) {
					var f = $scope.lastFile.mate[i];
					if (!!f.mateStatus)
						$scope.fillMates.push(f);
					else {
						$scope.emptyMates.push(f);
					}
				}
				$scope.em = $scope.emptyMates[0];
			} else {
				base.alert('获取材料列表失败');
			}
		})

		$scope.getFile = function(f) {
			if (!f) return 0;
			var count = 0;
			for (var i in f.mate) {
				var m = f.mate[i];
				if (!!m.mateStatus) {
					count++;
				}
			}
			return count;
		}

		$scope.deleteFile = function(m) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletefile($scope.orderNo, m.mateId, function(xhr) {
					if (!xhr.code) {
						m.mateStatus = 0;
						m.matePic = '';
						m.thumbnailPic ='';
						m.auditResult = null;
						m.auditOpinion = null;
					} else {
						base.alert('删除' + m.mateName + '图片失败');
					}
				})
			});
		}

		$scope.viewImage = function(m) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $root.globalImgPath + m.matePic
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}
		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.uploadSuccess = function(res, cfg, tar) {
			if (!res.code) {
				tar.mateStatus = 1;
				tar.matePic = res.url;
				tar.auditResult = null;
				tar.auditOpinion = null;
				tar.thumbnailPic = res.url;
			}
		}

		$scope.deleteOtherFile = function(f, idx) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value == 1) {
					srv.deletefile($scope.orderNo, f.mateId, function(xhr) {
						if (!xhr.code) {
							f.mateStatus = 0;
							f.matePic = '';
							f.thumbnailPic = '';
							f.auditResult = null;
							f.auditOpinion = null;
							$scope.emptyMates.push(f);
							$scope.fillMates.splice(idx, 1);
							$scope.em = $scope.emptyMates[0];
						} else {
							base.alert('删除' + m.mateName + '图片失败');
						}
					})
				}
			})
		}

		$scope.otherSuccess = function(res, cfg, tar) {
			if (!res.code) {
				if (!!tar.mateStatus) {
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditResult = null;
					tar.auditOpinion = null;
				} else {
					tar.mateStatus = 1;
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditResult = null;
					tar.auditOpinion = null;
					$scope.fillMates.push(tar);
					$scope.emptyMates.splice(0, 1);
					$scope.em = $scope.emptyMates[0];
				}
			}
		}

		$scope.setWrapper = function(file) {
			if ($scope.showKey == file.key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = file.key;
			}
		}
		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}
					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.loan.srv', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '客服退单订单详情(流转单)',
			menuKey: 'loanMaterialConfig'
		})

		$scope.orderNo = $params.orderNo;

		$scope.bussMode = [{
			id: 0,
			name: '标准'
		}, {
			id: 1,
			name: '资产管理'
		}]
		$scope.payLimit = [{
			limit: 12,
			name: '12期'
		}, {
			limit: 18,
			name: '18期'
		}, {
			limit: 24,
			name: '24期'
		}, {
			limit: 36,
			name: '36期'
		}]
		$scope.renewalMode = [{
			id: 0,
			name: '自行办理'
		}, {
			id: 1,
			name: '单位承保'
		}]
		$scope.house = [{
			id: 0,
			name: '无'
		}, {
			id: 1,
			name: '有'
		}]
		$scope.basicDataList = {};
		var carShops = new Array();
		$scope.carShopNames={};
		$scope.mCarShopNames={};
		$scope.is4SOrder = false;
		$scope.branchDeptList = {};
		$scope.branchDept = {'deptId':'','deptName':''};
		$scope.deptUser = {'userId':'','userName':''}
		$scope.deptUserList = {};
		$scope.musers4S ={};

		//检查是否是4S订单
		$scope.check4SOrder= function(){
			srv.is4SOrder($scope.orderNo,function(result){
				$scope.is4SOrder = false;
				if(!result.code){
					if(result.data == "true"){
						$scope.is4SOrder = true;
						var param = {'user.userDeptParentId':$scope.branchDept.deptId,'user.userDeptId':$scope.branchDept.deptId};
						srv.getUserList(param,function(xhr) {
							if (!xhr.code) {
								var us = {};
								for (var i in xhr.data) {
									var u = xhr.data[i];
									us[u.userId] = u;
								}
								$scope.musers4S = us;
							} else {
							}
						})
					}
				}
			});
		}

		srv.info($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.table = xhr.data;
				$scope.tableCopy = angular.copy($scope.table);
				$scope.copySurveyId = angular.copy($scope.table.basicInformation.surveyId);
				if ($scope.table.loanUserCar && $scope.table.loanUserCar.brandId) {
					initCar();
				}
				$scope.branchDept.deptId = $scope.table.loanOrder.deptId
				//获取分公司
				srv.getBranchDept($scope.table.loanOrder.deptId,function(result){
					if(!result.code){
						$scope.branchDeptList = result.data;
					}
				});

				$scope.check4SOrder();
			}
		});
		$scope.getDeptUser = function(){
			if(null == $scope.branchDept.deptId){
				$scope.deptUserList = {};

			}else {
				var params = {'user.userDeptId':$scope.branchDept.deptId};
				srv.getUserList(params,function(result){
					if(!result.code){
						$scope.deptUserList = result.data;
					}
				})
			}

		}

		$scope.mode = {
				//基本信息
				basicInformation: false,
				//分期信息
				loanUserStage: false,
				//购车信息
				loanUserCar: false,
				lender: false,
				loanUserSpouse: false,
				loanUserGuarantee: false,
				loanUserContact: false,
				loanOrgn: false,
				approval: false
			}
			/********************初始化*********************/
		getBankList();
		get4Shop();
		getUser();
		getBrands();
		getResidentType();
		/**
		 * 获取银行列表
		 */
		function getBankList() {
			srv.queryBank(function(xhr) {
				if (!xhr.code) {
					var banks = {};
					for (var i in xhr.data) {
						var row = xhr.data[i];
						banks[row.bankId] = row;
					}
					$scope.banks = banks;
				} else {
					base.alert('获取银行列表失败');
				}
			})
		}
		/**
		 * 获取4S店
		 */
		function get4Shop() {
			srv.carShop(function(xhr) {
				if (!xhr.code) {
					var shop = {};
					for (var i in xhr.data) {
						var s = xhr.data[i];
						shop[s.shopId] = s;
						carShops[i] = s.shopName;
						$scope.carShopNames[i] = s.shopName;
						$scope.mCarShopNames[s.shopName] = s;
					}
					$scope.carShop = shop;
				} else {
					base.alert('获取4S店信息失败');
				}
			})
		}
		$scope.getShops = function(){
			if(null != $scope.table.loanUserCar && $scope.table.loanUserCar != undefined && $scope.carShop != undefined){
				if($scope.carShop[$scope.table.loanUserCar.organId] != undefined && $scope.carShop[$scope.table.loanUserCar.organId]!=""){
					$( "#carShop").val($scope.carShop[$scope.table.loanUserCar.organId].shopName);
				}
			}

			$( "#carShop" ).autocomplete({
				source: carShops,
				autoFocus:true,
				appendTo:"#selectTd"
			});
		}
		$scope.setInputVal = function(){
			$("#carShop").val($scope.carShop[$scope.tableCopy.loanUserCar.organId].shopName);
		}
		//Mender wq 2016-03-23
		$scope.selecBoolean = true;
		$scope.selectOrganId = function(){
			var organ ;
			if($("#carShop").val() != undefined && $("#carShop").val() != ""){
				organ = $scope.mCarShopNames[$("#carShop").val()];
				if(organ != undefined && organ != null && organ.shopId != undefined && organ.shopId != ""){
					if(null != $scope.tableCopy.loanUserCar){
						$scope.tableCopy.loanUserCar.organId = organ.shopId;
						$scope.selecBoolean = true;
					}

				}else {
					$("#carShop").val("");
					//base.alert("请填入正确的经销商");
					$scope.selecBoolean = false;
				}
			}else{
				if($scope.tableCopy.loanUserCar != undefined && $scope.tableCopy.loanUserCar != null){
					$scope.tableCopy.loanUserCar.organId = "";
				}

			}
		}
		/**
		 * 获取经办人列表
		 */
		function getUser() {
			srv.muser(function(xhr) {
				if (!xhr.code) {
					var us = {};
					us[0] = {
						key: 0,
						value: ""
					};
					for (var i in xhr.data) {
						var u = xhr.data[i];
						us[u.key] = u;
					}
					$scope.musers = us;
				} else {
					base.alert('获取经办人信息失败');
				}
			})
		}
		/**
		 * 获取汽车品牌
		 */
		function getBrands() {
			srv.carBrands(function(xhr) {
				if (!xhr.code) {
					var brands = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						brands[r.brandId] = r;
					}
					$scope.carbrands = brands;
				} else {
					base.alert('获取汽车品牌失败');
				}
			})
		}
		/**
		 * 获取车系列
		 */
		function getCarSeries(brandid) {
			srv.carSeries(brandid, function(xhr) {
				if (!xhr.code) {
					var sers = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						sers[r.serieId] = r;
					}
					$scope.carSeries = sers;
				} else {
					base.alert('获取汽车系列表失败');
				}
			})
		}
		/**
		 * 获取车型列表
		 */
		function getCarSpecs(serieid) {
			srv.carSpecs(serieid, function(xhr) {
				if (!xhr.code) {
					var spes = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						spes[r.specId] = r;
					}
					$scope.carSpecs = spes;
				} else {
					base.alert('获取车型列表失败');
				}
			})
		}
		/**
		 * 获取贴息
		 */
		function getCarApr(specid) {
			srv.carApr(specid, function(xhr) {
				if (!xhr.code) {
					var apr = {};
					for (var i in xhr.data) {
						var r = xhr.data[i];
						apr[r.discountId] = r;
					}
					$scope.carApr = apr;
				}
			})
		}

		function initCar() {
			var brandid = $scope.table.loanUserCar.brandId,
				serieId = $scope.table.loanUserCar.serieId,
				specId = $scope.table.loanUserCar.specId;
			getCarSeries(brandid);
			if (serieId) getCarSpecs(serieId);
			//if(specId) getCarApr(specId);
		}
		/**
		 * 获取本地常驻类型 @author wq 2016-02-18
		 */

		function getResidentType() {
			$.ajax({
					url: '../basicData/getResidentType.html',
					data: {
						'basicType': 4
					},
					async: false,
					dataType: 'JSON',
					success: function(datas) {
						var myData = datas;
						if (myData["code"] == 0) {
							$scope.basicDataList = myData.data;
						} else {
							console.log(datas);
						}
					},
					error: function(XMLHttpRequest, textStatus, errorThrown) {
						console.log(textStatus);
					}
				})
				//srv.getResidentType(function(xhr){
				//	if(!xhr.code){
				//		$scope.basicDataList = xhr.data;
				//	}
				//})
		}
		$scope.typeName = "";
		$scope.getTypeName = function() {
				var typeId = $scope.tableCopy.lender.residentType;
				$.map($scope.basicDataList, function(dataList, key) {
					if (dataList.typeId == typeId) {
						$scope.typeName = dataList.typeName;
					}
				})
			}
			/**********绑定事件**********/
		$scope.saveBasic = function() {
			var basic = $scope.tableCopy.basicInformation,
				data = {
					'loanUser.orderNo': $scope.orderNo
				};
			if (base.isDefined(basic.regFrom))
				data['loanUser.regFrom'] = basic.regFrom;
			if (base.isDefined(basic.businessModel)) {
				data['loanUser.businessModel'] = basic.businessModel
			}
			if (base.isDefined(basic.onLicensePlace)) {
				data['loanUser.onLicensePlace'] = basic.onLicensePlace
			}

			if (base.isDefined(basic.bankId)) {
				data['loanUser.bankId'] = basic.bankId
			} else {
				base.alert('经办银行为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(basic.licenseCategory)) {
				data['loanUser.licenseCategory'] = basic.licenseCategory
			} else {
				base.alert('牌照类型是必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(basic.surveyId)) {
				data['loanOrder.surveyId'] = basic.surveyId
			} else {
				data['loanOrder.surveyId'] = 0;
			}

			if (base.isDefined(basic.sponsorId)) {
				data['loanOrder.sponsorId'] = basic.sponsorId
			} else {
				data['loanOrder.sponsorId'] = 0;
			}
			if (base.isDefined(basic.assistId)) {
				data['loanOrder.assistId'] = basic.assistId
			} else {
				data['loanOrder.assistId'] = 0;
			}
			if (base.isDefined(basic.signId)) {
				data['loanOrder.signId'] = basic.signId
			} else {
				data['loanOrder.signId'] = 0
			}
			srv.updBasic(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.basicInformation = !$scope.mode.basicInformation
					$scope.table.basicInformation = angular.copy($scope.tableCopy.basicInformation);
				} else {
					base.alert('保存基本信息失败，' + xhr.msg);
				}
			})
		}
		$scope.cancelBasic = function() {
			$scope.branchDept.deptId = null;
			$scope.deptUserList ={};
			$scope.mode.basicInformation = !$scope.mode.basicInformation;
			$scope.tableCopy.basicInformation = angular.copy($scope.table.basicInformation);
		}
			/**
			 * 分期数据
			 */
		$scope.saveStage = function() {
			var stage = $scope.tableCopy.loanUserStage,
				data = {
					'loanUserStage.orderNo': $scope.orderNo
				};
			if (base.isDefined(stage.advancedMoney)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(stage.advancedMoney)) {
					base.alert('垫资金额必须是数字');
					return;
				}
				data['loanUserStage.advancedMoney'] = stage.advancedMoney;
			} else {
				base.alert('垫资金额是必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(stage.commissionFeeRate)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(stage.commissionFeeRate)) {
					base.alert('分期手续费率必须是数字');
					return;
				}
				data['loanUserStage.commissionFeeRate'] = stage.commissionFeeRate;
			} else {
				base.alert('分期手续费是必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(stage.loanMoney)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(stage.loanMoney)) {
					base.alert('贷款金额必须是数字');
					return;
				}
				data['loanUserStage.loanMoney'] = stage.loanMoney;
			} else {
				base.alert('贷款金额是必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(stage.repayPeriod)) {
				data['loanUserStage.repayPeriod'] = stage.repayPeriod;
			} else {
				base.alert('还款期限是必填项，请完成后再保存');
				return;
			}
			srv.updStage(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.loanUserStage = !$scope.mode.loanUserStage;
					$scope.table.loanUserStage = angular.copy($scope.tableCopy.loanUserStage);
				} else {
					base.alert('保存分期信息失败，' + xhr.msg);
				}
			})
		}
		$scope.cancelState = function() {
				$scope.mode.loanUserStage = !$scope.mode.loanUserStage;
				$scope.tableCopy.loanUserStage = angular.copy($scope.table.loanUserStage);
			}
			/**
			 * 保存购车信息
			 */
		$scope.saveLoanUserCar = function() {
			$scope.selectOrganId();
			var car = $scope.tableCopy.loanUserCar,
				data = {
					'loanUserCar.orderNo': $scope.orderNo
				};

			if (base.isDefined(car.specId))
				data['loanUserCar.specId'] = car.specId
			else {
				base.alert('车辆型号为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(car.certificateNo)) {
				if (!/^[a-zA-Z0-9]{17}$/.test(car.certificateNo)) {
					base.alert('车架号必须是17位英文字母');
					return;
				}
				data['loanUserCar.certificateNo'] = car.certificateNo
			}
			if (base.isDefined(car.carPrice))
				data['loanUserCar.carPrice'] = car.carPrice
			else {
				base.alert('车辆价格为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(car.organId))
				data['loanUserCar.organId'] = car.organId
			else {
				if(!$scope.is4SOrder){
					base.alert('经销商为必填项，请完成后再保存');
					return;
				}
			}
			if (base.isDefined(car.discountId))
				data['loanUserCar.discountId'] = car.discountId;
			if (base.isDefined(car.renewalMode))
				data['loanUserCar.renewalMode'] = car.renewalMode
			srv.updCar(data, function(xhr) {
				if (!xhr.code) {
						srv.info($scope.orderNo, function(xhr) {
							if (!xhr.code) {
								$scope.table = xhr.data;
								$scope.tableCopy = angular.copy($scope.table);
								
							}
						})
					$scope.mode.loanUserCar = !$scope.mode.loanUserCar;
					$scope.table.loanUserCar = angular.copy($scope.tableCopy.loanUserCar);
				} else {
					base.alert('保存购车信息失败，' + xhr.msg);
				}
			})
		}
		$scope.cancelCar = function() {
			$scope.mode.loanUserCar = !$scope.mode.loanUserCar;
			$scope.tableCopy.loanUserCar = angular.copy(angular.table.loanUserCar);
			if(null != $scope.table.loanUserCar.organId){
				$( "#carShop").val($scope.carShop[$scope.table.loanUserCar.organId].shopName);
			}

		}
		$scope.saveLender = function() {
			if(isNaN($scope.tableCopy.lender.monthIncomeMoney)){
				base.alert("请正确输入税后月收入");
				return;
			}
			var len = $scope.tableCopy.lender,
				data = {
					'loanUser.orderNo': $scope.orderNo
				};
			if (base.isDefined(len.company))
				data['loanUser.company'] = len.company
			else {
				base.alert('单位名称为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(len.companyTel))
				data['loanUser.companyTel'] = len.companyTel
			if (base.isDefined(len.familyTel))
				data['loanUser.familyTel'] = len.familyTel
			else {
				if(!$scope.is4SOrder){
					base.alert('家庭电话为必填项，请完成后再保存');
					return;
				}
			}
			if (base.isDefined(len.familyAddress))
				data['loanUser.familyAddress'] = len.familyAddress
			else {
				base.alert('家庭住址为必填项，请完成后再保存');
				return;
			}

			if (base.isDefined(len.mobile))
				data['loanUser.mobile'] = len.mobile;
			if (base.isDefined(len.account))
				data['loanUser.account'] = len.account;
			if (base.isDefined(len.password))
				data['loanUser.password'] = len.password;
			if (base.isDefined(len.companyAddress))
				data['loanUser.companyAddress'] = len.companyAddress;
			if (base.isDefined(len.residentType))
				data['loanUser.residentType'] = $scope.tableCopy.lender.residentType;
			if (base.isDefined(len.monthIncomeMoney))
				data['loanUser.monthIncomeMoney'] = $scope.tableCopy.lender.monthIncomeMoney;
			srv.updLoanUser(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.lender = !$scope.mode.lender;
					$scope.table.lender = angular.copy($scope.tableCopy.lender);
					$scope.getTypeName();
					$scope.table.lender["residentName"] = $scope.typeName;
				} else {
					base.alert('保存贷款人信息失败，' + xhr.msg);
				}
			})
		}

		$scope.cancelLender = function() {
			$scope.mode.lender = !$scope.mode.lender;
			$scope.tableCopy.lender = angular.copy($scope.table.lender);
		}

		$scope.saveMate = function() {
			var mate = $scope.tableCopy.loanUserSpouse,
				data = {
					'lenderDependent.orderNo': $scope.orderNo,
					'lenderDependent.lenderRelevance': 0
				};

			if (base.isDefined(mate.lenderPhone))
				data['lenderDependent.lenderPhone'] = mate.lenderPhone
			else {
				base.alert('联系电话为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(mate.lenderIsProperty))
				data['lenderDependent.lenderIsProperty'] = mate.lenderIsProperty
			if (base.isDefined(mate.lenderWorkUnit))
				data['lenderDependent.lenderWorkUnit'] = mate.lenderWorkUnit
			else {
				base.alert('单位名称为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(mate.lenderCompanyPhone))
				data['lenderDependent.lenderCompanyPhone'] = mate.lenderCompanyPhone
			if (base.isDefined(mate.familyPhone))
				data['lenderDependent.familyPhone'] = mate.familyPhone
			if (base.isDefined(mate.familyAddress))
				data['lenderDependent.familyAddress'] = mate.familyAddress

			srv.updMate(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.loanUserSpouse = !$scope.mode.loanUserSpouse;
					$scope.table.loanUserSpouse = angular.copy($scope.tableCopy.loanUserSpouse);
				} else {
					base.alert('保存配偶信息失败,' + xhr.msg)
				}
			})
		}

		$scope.cancelMate = function() {
			$scope.mode.loanUserSpouse = !$scope.mode.loanUserSpouse;
			$scope.tableCopy.loanUserSpouse = angular.copy($scope.table.loanUserSpouse);
		}

		$scope.saveAssure = function() {
			var as = $scope.tableCopy.loanUserGuarantee,
				data = {
					'lenderDependent.orderNo': $scope.orderNo,
					'lenderDependent.lenderRelevance': 1
				};

			if (base.isDefined(as.lenderPhone))
				data['lenderDependent.lenderPhone'] = as.lenderPhone
			if (base.isDefined(as.lenderIsProperty))
				data['lenderDependent.lenderIsProperty'] = as.lenderIsProperty
			if (base.isDefined(as.lenderWorkUnit))
				data['lenderDependent.lenderWorkUnit'] = as.lenderWorkUnit
			if (base.isDefined(as.lenderCompanyPhone))
				data['lenderDependent.lenderCompanyPhone'] = as.lenderCompanyPhone
			if (base.isDefined(as.familyAddress))
				data['lenderDependent.familyAddress'] = as.familyAddress
			if (base.isDefined(as.familyPhone))
				data['lenderDependent.familyPhone'] = as.familyPhone

			srv.updGuarantor(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.loanUserGuarantee = !$scope.mode.loanUserGuarantee;
					$scope.table.loanUserGuarantee = angular.copy($scope.tableCopy.loanUserGuarantee);
				} else {
					base.alert('保存反担保人信息失败，' + xhr.msg);
				}
			})
		}
		$scope.cancelAssure = function() {
			$scope.mode.loanUserGuarantee = !$scope.mode.loanUserGuarantee;
			$scope.tableCopy.loanUserGuarantee = angular.copy($scope.table.loanUserGuarantee);
		}

		$scope.saveContact = function() {
			var cc = $scope.tableCopy.loanUserContact,
				data = {
					'loanUser.orderNo': $scope.orderNo
				};
			if (base.isDefined(cc.firstEmergencyName))
				data['loanUser.firstEmergencyName'] = cc.firstEmergencyName
			else {
				base.alert('紧急联系人1为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(cc.firstEmergencyTel))
				data['loanUser.firstEmergencyTel'] = cc.firstEmergencyTel
			else {
				base.alert('联系电话为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(cc.firstEmergencyRalation))
				data['loanUser.firstEmergencyRalation'] = cc.firstEmergencyRalation
			if (base.isDefined(cc.twoEmergencyName))
				data['loanUser.twoEmergencyName'] = cc.twoEmergencyName
			else {
				base.alert('紧急联系人2为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(cc.twoEmergencyTel))
				data['loanUser.twoEmergencyTel'] = cc.twoEmergencyTel
			else {
				base.alert('联系电话为必填项，请完成后再保存');
				return;
			}
			if (base.isDefined(cc.twoEmergencyRalation))
				data['loanUser.twoEmergencyRalation'] = cc.twoEmergencyRalation

			srv.updContact(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.loanUserContact = !$scope.mode.loanUserContact;
					$scope.table.loanUserContact = angular.copy($scope.tableCopy.loanUserContact);
				} else {
					base.alert('保存紧急联系人失败，' + xhr.msg);
				}
			})
		}

		$scope.cancelContract = function() {
			$scope.mode.loanUserContact = !$scope.mode.loanUserContact;
			$scope.tableCopy.loanUserContact = angular.copy($scope.table.loanUserContact);
		}

		$scope.saveLoanOrgn = function() {
			var lo = $scope.tableCopy.loanOrgn,
				data = {
					'loanOrgn.orderNo': $scope.orderNo
				}
			if (base.isDefined(lo.contractPrice)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.contractPrice)) {
					base.alert('合同价必须是数字');
					return;
				}
				data['loanOrgn.contractPrice'] = lo.contractPrice;
			}
			if (base.isDefined(lo.loanBond)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.loanBond)) {
					base.alert('贷款保证金必须是数字');
					return;
				}
				data['loanOrgn.loanBond'] = lo.loanBond;
			}
			if (base.isDefined(lo.mortgageFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.mortgageFee)) {
					base.alert('按揭费必须是数字');
					return;
				}
				data['loanOrgn.mortgageFee'] = lo.mortgageFee;
			}
			if (base.isDefined(lo.totalFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.totalFee)) {
					base.alert('总费用必须是数字');
					return;
				}
				data['loanOrgn.totalFee'] = lo.totalFee;
			}
			if (base.isDefined(lo.manageFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.manageFee)) {
					base.alert('资产管理费必须是数字');
					return;
				}
				data['loanOrgn.manageFee'] = lo.manageFee;
			}
			if (base.isDefined(lo.marketFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.marketFee)) {
					base.alert('营销费用必须是数字');
					return;
				}
				data['loanOrgn.marketFee'] = lo.marketFee;
			}
			if (base.isDefined(lo.onCarBond)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.onCarBond)) {
					base.alert('上牌保证金必须是数字');
					return;
				}
				data['loanOrgn.onCarBond'] = lo.onCarBond;
			}
			if (base.isDefined(lo.collectingFee)) {
				if (!/^-?\d+\.{0,}\d{0,}$/.test(lo.collectingFee)) {
					base.alert('代收费用必须是数字');
					return;
				}
				data['loanOrgn.collectingFee'] = lo.collectingFee;
			}
			srv.updLoanOrgn(data, function(xhr) {
				if (!xhr.code) {
					$scope.mode.loanOrgn = !$scope.mode.loanOrgn;
					$scope.table.loanOrgn = angular.copy($scope.tableCopy.loanOrgn);
				} else {
					base.alert('保存失败，' + xhr.msg);
				}
			})
		}

		$scope.cancelLoanOrgn = function() {
			$scope.mode.loanOrgn = !$scope.mode.loanOrgn;
			$scope.table.loanOrgn = angular.copy($scope.tableCopy.loanOrgn);
		}
		$scope.setCarBrand = function() {
			$scope.carSeries = {};
			$scope.carSpecs = {};
			$scope.carApr = {};
			$scope.tableCopy.loanUserCar.serieId = null;
			$scope.tableCopy.loanUserCar.specId = null;
			//$scope.tableCopy.loanUserCar.discountId = null;
			if (!$scope.tableCopy.loanUserCar.brandId) return;
			getCarSeries($scope.tableCopy.loanUserCar.brandId);

		}

		$scope.setCarSerie = function() {
			$scope.carSpecs = {};
			$scope.carApr = {};
			$scope.tableCopy.loanUserCar.specId = null;
			//$scope.tableCopy.loanUserCar.discountId = null;
			if (!$scope.tableCopy.loanUserCar.serieId) return;
			getCarSpecs($scope.tableCopy.loanUserCar.serieId);
		}

		$scope.setCarSpec = function() {
			$scope.carApr = {};
			$scope.tableCopy.loanUserCar.discountId = null;
			if (!$scope.tableCopy.loanUserCar.specId) return;
			//getCarApr($scope.tableCopy.loanUserCar.specId);
		}

		$scope.isempty = function(o) {
			return angular.element.isEmptyObject(o);
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}
					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
		$scope.checkChange = function() {
			srv.presend($scope.orderNo, function(xhr) {
				if (!!xhr.code) {
					var diag = base.alert(xhr.msg);
					diag.closePromise.then(function() {
						$scope.tableCopy.basicInformation.surveyId = $scope.copySurveyId;
					})

					return;
				}
			})
		}
	}
])
kry.controller('log', ['', function() {

}])
kry.controller('ctrl.register.auth', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '审核意见',
			menuKey: 'vehicleConfig'
		})

		$scope.orderNo = $params.orderNo;

		srv.auth($scope.orderNo, function(xhr) {
			if (!xhr.code)
				$scope.authRes = xhr.data;
		})

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.register.files', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'base',
	'ngDialog',
	'srv',
	'navs',
	function(
		$scope,
		$root,
		$params,
		$location,
		base,
		dialog,
		srv,
		navs
	) {
		$root.setSite({
			title: '注册登记证',
			menuKey: 'vehicleConfig'
		})
		$scope.orderNo = $params.orderNo;
		$scope.flowId = 10;
		$scope.showKey = '';
		$scope.fillMates = [];
		$scope.emptyMates = [];
		getFlowId();
		//得到flowId
		function getFlowId(){
			$.ajax({
				url:'../loanOrder/getLoanOrderByOrderNo.html',
				data:{'orderNo':$scope.orderNo},
				type:'POST',
				async:false,
				dataType:'JSON',
				success:function(datas){
					$scope.flowId = datas.data.flowId;
				},
				error:function(textStatus){
				}
			})
		}
		srv.files($scope.flowId, $scope.orderNo, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				$scope.showKey = $scope.fileList[0].key;
				if (!$scope.lastFile) return;
				for (var i in $scope.lastFile.mate) {
					var f = $scope.lastFile.mate[i];
					if (!!f.mateStatus)
						$scope.fillMates.push(f);
					else {
						$scope.emptyMates.push(f);
					}
				}
				$scope.em = $scope.emptyMates[0];
			} else {
				base.alert('获取材料列表失败');
			}
		})

		$scope.getFile = function(f) {
			if (!f) return 0;
			var count = 0;
			for (var i in f.mate) {
				var m = f.mate[i];
				if (!!m.mateStatus) {
					count++;
				}
			}
			return count;
		}

		$scope.deleteFile = function(m) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletefile($scope.orderNo, m.mateId, function(xhr) {
					if (!xhr.code) {
						m.mateStatus = 0;
						m.matePic = '';
						tar.thumbnailPic = '';
					} else {
						base.alert('删除' + m.mateName + '图片失败');
					}
				})
			});
		}

		$scope.viewImage = function(m) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $root.globalImgPath + m.matePic
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}
		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.uploadSuccess = function(res, cfg, tar) {
			if (!res.code) {
				tar.mateStatus = 1;
				tar.matePic = res.url;
				tar.thumbnailPic = res.url;
			}
		}

		$scope.deleteOtherFile = function(f, idx) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value == 1) {
					srv.deletefile($scope.orderNo, f.mateId, function(xhr) {
						if (!xhr.code) {
							f.mateStatus = 0;
							f.matePic = '';
							f.thumbnailPic = '';
							$scope.emptyMates.push(f);
							$scope.fillMates.splice(idx, 1);
							$scope.em = $scope.emptyMates[0];
						} else {
							base.alert('删除' + m.mateName + '图片失败');
						}
					})
				}
			})
		}

		$scope.otherSuccess = function(res, cfg, tar) {
			if (!res.code) {
				if (!!tar.mateStatus) {
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
				} else {
					tar.mateStatus = 1;
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					$scope.fillMates.push(tar);
					$scope.emptyMates.splice(0, 1);
					$scope.em = $scope.emptyMates[0];
				}
			}
		}

		$scope.setWrapper = function(file) {
			if ($scope.showKey == file.key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = file.key;
			}
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value || '', function(xhr) {
									if (!xhr.code) {
										$location.path('/register');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.register.info', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '未提交订单详情(流转单)',
			menuKey: 'vehicleConfig'
		})
		$scope.orderNo = $params.orderNo;

		$scope.bussMode = [{
			id: 0,
			name: '标准'
		}, {
			id: 1,
			name: '资产管理'
		}]
		$scope.payLimit = [{
			limit: 12,
			name: '12期'
		}, {
			limit: 18,
			name: '18期'
		}, {
			limit: 24,
			name: '24期'
		}, {
			limit: 36,
			name: '36期'
		}]
		$scope.renewalMode = [{
			id: 0,
			name: '自行办理'
		}, {
			id: 1,
			name: '单位承保'
		}]
		$scope.house = [{
			id: 0,
			name: '无'
		}, {
			id: 1,
			name: '有'
		}]

		srv.info($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.table = xhr.data;
				$scope.copySurveyId = angular.copy($scope.table.basicInformation.surveyId);
				if ($scope.table.loanUserCar && $scope.table.loanUserCar.brandId) {
					initCar();
				}
			}
		})

		$scope.mode = {
				//基本信息
				basicInformation: false,
				//分期信息
				loanUserStage: false,
				//购车信息
				loanUserCar: false,
				lender: false,
				loanUserSpouse: false,
				loanUserGuarantee: false,
				loanUserContact: false,
				loanOrgn: false,
				approval: false
			}
			/********************初始化*********************/
		getBankList();
		get4Shop();
		getUser();
		getBrands();
		/**
		 * 获取银行列表
		 */
		function getBankList() {
			srv.queryBank(function(xhr) {
				if (!xhr.code) {
					var banks = {};
					for (var i in xhr.data) {
						var row = xhr.data[i];
						banks[row.bankId] = row;
					}
					$scope.banks = banks;
				} else {
					base.alert('获取银行列表失败');
				}
			})
		}
		/**
		 * 获取4S店
		 */
		function get4Shop() {
			srv.carShop(function(xhr) {
				if (!xhr.code) {
					var shop = {};
					for (var i in xhr.data) {
						var s = xhr.data[i];
						shop[s.shopId] = s;
					}
					$scope.carShop = shop;
				} else {
					base.alert('获取4S店信息失败');
				}
			})
		}
		/**
		 * 获取经办人列表
		 */
		function getUser() {
			srv.muser(function(xhr) {
				if (!xhr.code) {
					var us = {}
					for (var i in xhr.data) {
						var u = xhr.data[i];
						us[u.key] = u;
					}
					$scope.musers = us;
				} else {
					base.alert('获取经办人信息失败');
				}
			})
		}
		/**
		 * 获取汽车品牌
		 */
		function getBrands() {
			srv.carBrands(function(xhr) {
				if (!xhr.code) {
					var brands = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						brands[r.brandId] = r;
					}
					$scope.carbrands = brands;
				} else {
					base.alert('获取汽车品牌失败');
				}
			})
		}
		/**
		 * 获取车系列
		 */
		function getCarSeries(brandid) {
			srv.carSeries(brandid, function(xhr) {
				if (!xhr.code) {
					var sers = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						sers[r.serieId] = r;
					}
					$scope.carSeries = sers;
				} else {
					base.alert('获取汽车系列表失败');
				}
			})
		}
		/**
		 * 获取车型列表
		 */
		function getCarSpecs(serieid) {
			srv.carSpecs(serieid, function(xhr) {
				if (!xhr.code) {
					var spes = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						spes[r.specId] = r;
					}
					$scope.carSpecs = spes;
				} else {
					base.alert('获取车型列表失败');
				}
			})
		}
		/**
		 * 获取贴息
		 */
		function getCarApr(specid) {
			srv.carApr(specid, function(xhr) {
				if (!xhr.code) {
					$scope.carApr = xhr.data;
				}
			})
		}

		function initCar() {
			var brandid = $scope.table.loanUserCar.brandId,
				serieId = $scope.table.loanUserCar.serieId,
				specId = $scope.table.loanUserCar.specId;
			getCarSeries(brandid);
			if (serieId) getCarSpecs(serieId);
			if (specId) getCarApr(specId);
		}

		$scope.submitOrder = function() {

			if ($scope.sending_order) return;
			$scope.sending_order = true;

			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						$scope.auditDb = res.data;
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {

								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}

								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})

						} else {
							base.alert('获取审核列表失败');
						}

					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			});
		}
	}
])
kry.controller('ctrl.register', [
	'$scope',
	'$rootScope',
	'$location',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$location,
		base,
		srv
	) {
		$root.setSite({
			title: '注册登记证管理',
			menuKey: 'vehicleConfig'
		})

		$scope.pageParams = {
			'loanOrderMaterial.backStatus': parseInt($location.$$search.type) || 0,
			'pageNum': 1,
			'loanOrderMaterial.idCard': '',
			'loanOrderMaterial.realName': '',
			'loanOrderMaterial.orderNo': ''
		};
		$scope.page = {};

		srv.tiper(10, function(xhr) {
			if (!xhr.code) {
				$scope.tipers = xhr.data;
			}
		})

		function getLoan() {
			srv.material(10, $scope.pageParams, function(xhr) {
				if (xhr.total > 0) {
					$scope.page.lists = xhr.rows;
					$scope.pageParams['pageNum'] = xhr.page;
					$scope.page.pageSize = xhr.pageSize;
					$scope.page.total = xhr.total;
					$scope.page.totalPage = parseInt(xhr.total / xhr.pageSize) + (xhr.total % xhr.pageSize > 0 ? 1 : 0);
					$scope.page.totalPagesArr = [];
					for (var i = 0; i < $scope.page.totalPage; i++) {
						$scope.page.totalPagesArr.push(i);
					}
				} else {
					$scope.page.lists = xhr.rows;
					$scope.page.total = 0;
				}
			})
		}

		getLoan();

		$scope.isStatus = function(code) {
			return $scope.pageParams['loanOrderMaterial.backStatus'] == code;
		}
		$scope.getUrl = function() {
			return ['#/register/info/', '#/register/srv/', '#/register/risk/'][$scope.pageParams['loanOrderMaterial.backStatus']];
		}

		$scope.search = function() {
			$scope.pageParams['pageNum'] = 1;
			getLoan();
		}

		$scope.pagePrev = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == 1) return;
			$scope.pageParams['pageNum'] = cp - 1;
			getLoan()
		}

		$scope.pageNext = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == $scope.page.totalPage) return;
			$scope.pageParams['pageNum'] = cp + 1;
			getLoan()
		}

		$scope.setPage = function(p) {
			if (p == $scope.pageParams['pageNum']) return;
			$scope.pageParams['pageNum'] = p;
			getLoan()
		}
		$scope.setBackStatus = function(code) {
			$scope.pageParams['loanOrderMaterial.backStatus'] = code;
			$scope.pageParams['pageNum'] = 1; //tab切换时重置页码。
			getLoan();
		}

	}
])
kry.controller('ctrl.register.risk.auth', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '审核意见',
			menuKey: 'vehicleConfig'
		})

		$scope.orderNo = $params.orderNo;

		srv.auth($scope.orderNo, function(xhr) {
			if (!xhr.code)
				$scope.authRes = xhr.data;
		})

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.search({
											type: 2
										});
										$location.path('/register');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.register.risk.files', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'base',
	'ngDialog',
	'srv',
	'navs',
	function(
		$scope,
		$root,
		$params,
		$location,
		base,
		dialog,
		srv,
		navs
	) {
		$root.setSite({
			title: '注册登记证',
			menuKey: 'vehicleConfig'
		})
		$scope.orderNo = $params.orderNo;
		$scope.flowId = 10;
		$scope.showKey = '';
		$scope.fillMates = [];
		$scope.emptyMates = [];
		getFlowId();
		//得到flowId
		function getFlowId(){
			$.ajax({
				url:'../loanOrder/getLoanOrderByOrderNo.html',
				data:{'orderNo':$scope.orderNo},
				type:'POST',
				async:false,
				dataType:'JSON',
				success:function(datas){
					$scope.flowId = datas.data.flowId;
				},
				error:function(textStatus){
				}
			})
		}
		srv.files($scope.flowId, $scope.orderNo, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				$scope.showKey = $scope.fileList[0].key;
				if (!$scope.lastFile) return;
				for (var i in $scope.lastFile.mate) {
					var f = $scope.lastFile.mate[i];
					if (!!f.mateStatus)
						$scope.fillMates.push(f);
					else {
						$scope.emptyMates.push(f);
					}
				}
				$scope.em = $scope.emptyMates[0];
			} else {
				base.alert('获取材料列表失败');
			}
		})

		$scope.getFile = function(f) {
			if (!f) return 0;
			var count = 0;
			for (var i in f.mate) {
				var m = f.mate[i];
				if (!!m.mateStatus) {
					count++;
				}
			}
			return count;
		}

		$scope.deleteFile = function(m) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletefile($scope.orderNo, m.mateId, function(xhr) {
					if (!xhr.code) {
						m.mateStatus = 0;
						m.matePic = '';
						m.thumbnailPic = '';
						m.auditResult = null;
						m.auditOpinion = null;
					} else {
						base.alert('删除' + m.mateName + '图片失败');
					}
				})
			});
		}

		$scope.viewImage = function(m) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $root.globalImgPath + m.matePic
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}
		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.uploadSuccess = function(res, cfg, tar) {
			if (!res.code) {
				tar.mateStatus = 1;
				tar.matePic = res.url;
				tar.thumbnailPic = res.url;
				tar.auditOpinion = null;
				tar.auditResult = null;
			}
		}

		$scope.deleteOtherFile = function(f, idx) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value == 1) {
					srv.deletefile($scope.orderNo, f.mateId, function(xhr) {
						if (!xhr.code) {
							f.mateStatus = 0;
							f.matePic = '';
							f.thumbnailPic = '';
							f.auditResult = null;
							f.auditOpinion = null;
							$scope.emptyMates.push(f);
							$scope.fillMates.splice(idx, 1);
							$scope.em = $scope.emptyMates[0];
						} else {
							base.alert('删除' + m.mateName + '图片失败');
						}
					})
				}
			})
		}

		$scope.otherSuccess = function(res, cfg, tar) {
			if (!res.code) {
				if (!!tar.mateStatus) {
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditResult = null;
					tar.auditOpinion = null;
				} else {
					tar.mateStatus = 1;
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditResult = null;
					tar.auditOpinion = null;
					$scope.fillMates.push(tar);
					$scope.emptyMates.splice(0, 1)
					$scope.em = $scope.emptyMates[0];
				}
			}
		}

		$scope.setWrapper = function(file) {
			if ($scope.showKey == file.key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = file.key;
			}
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			//$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.search({
											type: 2
										});
										$location.path('/register');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					//$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.register.risk', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '未提交订单详情(流转单)',
			menuKey: 'vehicleConfig'
		})
		$scope.orderNo = $params.orderNo;

		$scope.bussMode = [{
			id: 0,
			name: '标准'
		}, {
			id: 1,
			name: '资产管理'
		}]
		$scope.payLimit = [{
			limit: 12,
			name: '12期'
		}, {
			limit: 18,
			name: '18期'
		}, {
			limit: 24,
			name: '24期'
		}, {
			limit: 36,
			name: '36期'
		}]
		$scope.renewalMode = [{
			id: 0,
			name: '自行办理'
		}, {
			id: 1,
			name: '单位承保'
		}]
		$scope.house = [{
			id: 0,
			name: '无'
		}, {
			id: 1,
			name: '有'
		}]

		srv.info($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.table = xhr.data;
				$scope.copySurveyId = angular.copy($scope.table.basicInformation.surveyId);
				if ($scope.table.loanUserCar && $scope.table.loanUserCar.brandId) {
					initCar();
				}
			}
		})

		$scope.mode = {
				//基本信息
				basicInformation: false,
				//分期信息
				loanUserStage: false,
				//购车信息
				loanUserCar: false,
				lender: false,
				loanUserSpouse: false,
				loanUserGuarantee: false,
				loanUserContact: false,
				loanOrgn: false,
				approval: false
			}
			/********************初始化*********************/
		getBankList();
		get4Shop();
		getUser();
		getBrands();
		/**
		 * 获取银行列表
		 */
		function getBankList() {
			srv.queryBank(function(xhr) {
				if (!xhr.code) {
					var banks = {};
					for (var i in xhr.data) {
						var row = xhr.data[i];
						banks[row.bankId] = row;
					}
					$scope.banks = banks;
				} else {
					base.alert('获取银行列表失败');
				}
			})
		}
		/**
		 * 获取4S店
		 */
		function get4Shop() {
			srv.carShop(function(xhr) {
				if (!xhr.code) {
					var shop = {};
					for (var i in xhr.data) {
						var s = xhr.data[i];
						shop[s.shopId] = s;
					}
					$scope.carShop = shop;
				} else {
					base.alert('获取4S店信息失败');
				}
			})
		}
		/**
		 * 获取经办人列表
		 */
		function getUser() {
			srv.muser(function(xhr) {
				if (!xhr.code) {
					var us = {}
					for (var i in xhr.data) {
						var u = xhr.data[i];
						us[u.key] = u;
					}
					$scope.musers = us;
				} else {
					base.alert('获取经办人信息失败');
				}
			})
		}
		/**
		 * 获取汽车品牌
		 */
		function getBrands() {
			srv.carBrands(function(xhr) {
				if (!xhr.code) {
					var brands = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						brands[r.brandId] = r;
					}
					$scope.carbrands = brands;
				} else {
					base.alert('获取汽车品牌失败');
				}
			})
		}
		/**
		 * 获取车系列
		 */
		function getCarSeries(brandid) {
			srv.carSeries(brandid, function(xhr) {
				if (!xhr.code) {
					var sers = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						sers[r.serieId] = r;
					}
					$scope.carSeries = sers;
				} else {
					base.alert('获取汽车系列表失败');
				}
			})
		}
		/**
		 * 获取车型列表
		 */
		function getCarSpecs(serieid) {
			srv.carSpecs(serieid, function(xhr) {
				if (!xhr.code) {
					var spes = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						spes[r.specId] = r;
					}
					$scope.carSpecs = spes;
				} else {
					base.alert('获取车型列表失败');
				}
			})
		}
		/**
		 * 获取贴息
		 */
		function getCarApr(specid) {
			srv.carApr(specid, function(xhr) {
				if (!xhr.code) {
					$scope.carApr = xhr.data;
				}
			})
		}

		function initCar() {
			var brandid = $scope.table.loanUserCar.brandId,
				serieId = $scope.table.loanUserCar.serieId,
				specId = $scope.table.loanUserCar.specId;
			getCarSeries(brandid);
			if (serieId) getCarSpecs(serieId);
			if (specId) getCarApr(specId);
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			//$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.search({
											type: 2
										});
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			});
		}
	}
])
kry.controller('ctrl.register.srv.auth', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '审核意见',
			menuKey: 'vehicleConfig'
		})

		$scope.orderNo = $params.orderNo;

		srv.auth($scope.orderNo, function(xhr) {
			if (!xhr.code)
				$scope.authRes = xhr.data;
		})

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			//	$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.search({
											type: 1
										});
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})
				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.register.srv.files', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'base',
	'ngDialog',
	'srv',
	'navs',
	function(
		$scope,
		$root,
		$params,
		$location,
		base,
		dialog,
		srv,
		navs
	) {
		$root.setSite({
			title: '注册登记证',
			menuKey: 'vehicleConfig'
		})
		$scope.orderNo = $params.orderNo;
		$scope.flowId = 10;
		$scope.showKey = '';
		$scope.fillMates = [];
		$scope.emptyMates = [];
		getFlowId();
		//得到flowId
		function getFlowId(){
			$.ajax({
				url:'../loanOrder/getLoanOrderByOrderNo.html',
				data:{'orderNo':$scope.orderNo},
				type:'POST',
				async:false,
				dataType:'JSON',
				success:function(datas){
					$scope.flowId = datas.data.flowId;
				},
				error:function(textStatus){
				}
			})
		}
		srv.files($scope.flowId, $scope.orderNo, function(xhr) {
			if (!xhr.code) {
				if (xhr.data.length > 1) {
					$scope.fileList = xhr.data.splice(0, xhr.data.length - 1);
					$scope.lastFile = xhr.data[0];
				} else {
					$scope.fileList = xhr.data;
				}
				$scope.showKey = $scope.fileList[0].key;
				if (!$scope.lastFile) return;
				for (var i in $scope.lastFile.mate) {
					var f = $scope.lastFile.mate[i];
					if (!!f.mateStatus)
						$scope.fillMates.push(f);
					else {
						$scope.emptyMates.push(f);
					}
				}
				$scope.em = $scope.emptyMates[0];
			} else {
				base.alert('获取材料列表失败');
			}
		})

		$scope.getFile = function(f) {
			if (!f) return 0;
			var count = 0;
			for (var i in f.mate) {
				var m = f.mate[i];
				if (!!m.mateStatus) {
					count++;
				}
			}
			return count;
		}

		$scope.deleteFile = function(m) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value != 1) return;
				srv.deletefile($scope.orderNo, m.mateId, function(xhr) {
					if (!xhr.code) {
						m.mateStatus = 0;
						m.matePic = '';
						m.thumbnailPic = '';
						m.auditResult = null;
						m.auditOpinion = null;
					} else {
						base.alert('删除' + m.mateName + '图片失败');
					}
				})
			});
		}

		$scope.viewImage = function(m) {
			dialog.open({
				templateUrl: './templates/dialog/dialog.viewimage.htm',
				data: {
					imageUrl: $root.globalImgPath + m.matePic
				},
				scope: $scope,
				className: 'ngdialog-theme-view',
				controller: 'ctrl.dialog.upload'
			})
		}
		$scope.rotateImgCss = 0;
		$scope.rotateImg = function() {
			$scope.rotateImgCss = $scope.rotateImgCss == 3 ? 0 : ($scope.rotateImgCss + 1);
		}

		$scope.rotateStyle = function() {
			var h = document.documentElement.clientHeight * 0.8,
				w = document.documentElement.clientWidth * 0.8;
			return {
				'max-width': ($scope.rotateImgCss % 2 == 0 ? w : h) + 'px',
				'max-height': ($scope.rotateImgCss % 2 == 0 ? h : w) + 'px'
			};
		}

		$scope.getRotate = function() {
			return ['', 'deg90', 'deg180', 'deg270'][$scope.rotateImgCss];
		}

		$scope.uploadSuccess = function(res, cfg, tar) {
			if (!res.code) {
				tar.mateStatus = 1;
				tar.matePic = res.url;
				tar.thumbnailPic = res.url;
				tar.auditResult = null;
				tar.auditOpinion = null;
			}
		}

		$scope.deleteOtherFile = function(f, idx) {
			var diag = base.confirm('是否删除图片？');
			diag.closePromise.then(function(v) {
				if (v.value == 1) {
					srv.deletefile($scope.orderNo, f.mateId, function(xhr) {
						if (!xhr.code) {
							f.mateStatus = 0;
							f.matePic = '';
							f.thumbnailPic = '';
							f.auditResult = null;
							f.auditOpinion = null;
							$scope.emptyMates.push(f);
							$scope.fillMates.splice(idx, 1);
							$scope.em = $scope.emptyMates[0];
						} else {
							base.alert('删除' + m.mateName + '图片失败');
						}
					})
				}
			})
		}

		$scope.otherSuccess = function(res, cfg, tar) {
			if (!res.code) {
				if (!!tar.mateStatus) {
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditResult = null;
					tar.auditOpinion = null;
				} else {
					tar.mateStatus = 1;
					tar.matePic = res.url;
					tar.thumbnailPic = res.url;
					tar.auditResult = null;
					tar.auditOpinion = null;
					$scope.fillMates.push(tar);
					$scope.emptyMates.splice(0, 1);
					$scope.em = $scope.emptyMates[0];
				}
			}
		}

		$scope.setWrapper = function(file) {
			if ($scope.showKey == file.key) {
				$scope.showKey = '';
			} else {
				$scope.showKey = file.key;
			}
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			//$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.search({
											type: 1
										});
										$location.path('/loan');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.register.srv', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'ngDialog',
	'base',
	'srv',
	function(
		$scope,
		$root,
		$params,
		$location,
		dialog,
		base,
		srv
	) {
		$root.setSite({
			title: '未提交订单详情(流转单)',
			menuKey: 'vehicleConfig'
		})
		$scope.orderNo = $params.orderNo;

		$scope.bussMode = [{
			id: 0,
			name: '标准'
		}, {
			id: 1,
			name: '资产管理'
		}]
		$scope.payLimit = [{
			limit: 12,
			name: '12期'
		}, {
			limit: 18,
			name: '18期'
		}, {
			limit: 24,
			name: '24期'
		}, {
			limit: 36,
			name: '36期'
		}]
		$scope.renewalMode = [{
			id: 0,
			name: '自行办理'
		}, {
			id: 1,
			name: '单位承保'
		}]
		$scope.house = [{
			id: 0,
			name: '无'
		}, {
			id: 1,
			name: '有'
		}]

		srv.info($scope.orderNo, function(xhr) {
			if (!xhr.code) {
				$scope.table = xhr.data;
				$scope.copySurveyId = angular.copy($scope.table.basicInformation.surveyId);
				if ($scope.table.loanUserCar && $scope.table.loanUserCar.brandId) {
					initCar();
				}
			}
		})

		$scope.mode = {
				//基本信息
				basicInformation: false,
				//分期信息
				loanUserStage: false,
				//购车信息
				loanUserCar: false,
				lender: false,
				loanUserSpouse: false,
				loanUserGuarantee: false,
				loanUserContact: false,
				loanOrgn: false,
				approval: false
			}
			/********************初始化*********************/
		getBankList();
		get4Shop();
		getUser();
		getBrands();
		/**
		 * 获取银行列表
		 */
		function getBankList() {
			srv.queryBank(function(xhr) {
				if (!xhr.code) {
					var banks = {};
					for (var i in xhr.data) {
						var row = xhr.data[i];
						banks[row.bankId] = row;
					}
					$scope.banks = banks;
				} else {
					base.alert('获取银行列表失败');
				}
			})
		}
		/**
		 * 获取4S店
		 */
		function get4Shop() {
			srv.carShop(function(xhr) {
				if (!xhr.code) {
					var shop = {};
					for (var i in xhr.data) {
						var s = xhr.data[i];
						shop[s.shopId] = s;
					}
					$scope.carShop = shop;
				} else {
					base.alert('获取4S店信息失败');
				}
			})
		}
		/**
		 * 获取经办人列表
		 */
		function getUser() {
			srv.muser(function(xhr) {
				if (!xhr.code) {
					var us = {}
					for (var i in xhr.data) {
						var u = xhr.data[i];
						us[u.key] = u;
					}
					$scope.musers = us;
				} else {
					base.alert('获取经办人信息失败');
				}
			})
		}
		/**
		 * 获取汽车品牌
		 */
		function getBrands() {
			srv.carBrands(function(xhr) {
				if (!xhr.code) {
					var brands = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						brands[r.brandId] = r;
					}
					$scope.carbrands = brands;
				} else {
					base.alert('获取汽车品牌失败');
				}
			})
		}
		/**
		 * 获取车系列
		 */
		function getCarSeries(brandid) {
			srv.carSeries(brandid, function(xhr) {
				if (!xhr.code) {
					var sers = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						sers[r.serieId] = r;
					}
					$scope.carSeries = sers;
				} else {
					base.alert('获取汽车系列表失败');
				}
			})
		}
		/**
		 * 获取车型列表
		 */
		function getCarSpecs(serieid) {
			srv.carSpecs(serieid, function(xhr) {
				if (!xhr.code) {
					var spes = {}
					for (var i in xhr.data) {
						var r = xhr.data[i];
						spes[r.specId] = r;
					}
					$scope.carSpecs = spes;
				} else {
					base.alert('获取车型列表失败');
				}
			})
		}
		/**
		 * 获取贴息
		 */
		function getCarApr(specid) {
			srv.carApr(specid, function(xhr) {
				if (!xhr.code) {
					$scope.carApr = xhr.data;
				}
			})
		}

		function initCar() {
			var brandid = $scope.table.loanUserCar.brandId,
				serieId = $scope.table.loanUserCar.serieId,
				specId = $scope.table.loanUserCar.specId;
			getCarSeries(brandid);
			if (serieId) getCarSpecs(serieId);
			if (specId) getCarApr(specId);
		}

		$scope.submitOrder = function() {
			if ($scope.sending_order) return;
			$scope.sending_order = true;
			srv.presend($scope.orderNo, function(xhr) {
				if (!xhr.code) {
					srv.getAudit($scope.orderNo, function(res) {
						if (!res.code) {
							$scope.auditDb = res.data;
							var diag = dialog.open({
								templateUrl: 'templates/dialog/dialog.authidea.htm',
								scope: $scope,
								controller:'ctrl.dialog.authidea',
								className: 'ngdialog-theme-input'
							});
							diag.closePromise.then(function(v) {
								if (!v || v.value == undefined) {
									$scope.sending_order = false;
									return;
								}
								srv.sendorder($scope.orderNo, v.value.idea || '', v.value.audit, function(xhr) {
									if (!xhr.code) {
										$location.search({
											type: 1
										});
										$location.path('/register');
									} else {
										base.alert(xhr.msg);
									}
									$scope.sending_order = false;
								})
							})
						} else {
							base.alert('获取审核列表失败');
						}

					})

				} else {
					$scope.sending_order = false;
					base.alert(xhr.msg);
				}
			});
		}
	}
])
kry.controller('setting', ['', function() {

}])
kry.controller('sign', ['', function() {

}])
kry.controller('plugin.banklist', [
		'$scope',
		'ngDialog',
		'srv',
		'base',
		function($scope, dialog, srv, base) {
			var orderNo = $scope.$parent.orderNo;
			$scope.bankcopy = {};

			srv.plugin.bankinfo(orderNo, function(res) {
				if (!res.code) {
					$scope.canSelect = res.canSelect;
					$scope.canModify = res.canModify;
					$scope.banklist = res.banklist;
					$scope.arealist = res.arealist;
					$scope.branchlist = res.branchlist;
					if (res.bankinfo) {
						$scope.hasBank = true;
						$scope.bankname = res.bankname;
						$scope.bankcopy = res.bankinfo;
						$scope.bankinfo = angular.copy($scope.bankcopy);
					}
				} else {
					$scope.canSelect = false;
				}
			})

			$scope.pickBank = function() {
				var diag = dialog.open({
					templateUrl: 'templates/dialog/dialog.banklist.htm',
					scope: $scope,
					className: 'ngdialog-theme-bank'
				});
				diag.closePromise.then(function(v) {
					if (v && !!v.value) {
						if (!$scope.bankinfo.bank || !$scope.bankinfo.area || !$scope.bankinfo.branch) {
							base.alert('请选择银行信息');
							return;
						}
						srv.plugin.sendbank($scope.orderNo, $scope.bankinfo, function(res) {
							if (!res.code) {
								$scope.bankcopy = angular.copy($scope.bankinfo);
								$scope.bankname = res.name;
							} else {
								$scope.bankinfo = angular.copy($scope.bankcopy);
								base.alert(res.msg);
							}
						})
					}
				})
			}

			$scope.saveBank = function() {
				console.log($scope.bankinfo);
			}
			$scope.closePicker = function() {
				$scope.popup = false;
			}
		}
	])
	//消息中心
kry.controller('ctrl.msg', [
	'$scope',
	'ngDialog',
	'srv',
	'base',
	'$rootScope',
	'$location',
	function($scope, ngDialog, srv, base, $rootScope, $location) {

		$rootScope.setSite({
			title: '消息中心',
			menuKey: 'key_msg'
		})
		$scope.page = {};
		$scope.pageParams = {
			pageNum: 1
		}
		$scope.backStatus = -1;

		$scope.isStatus = function(code) {
			return $scope.backStatus == code;
		}
		$scope.setBackStatus = function(code) {
			$scope.backStatus = code;
			if (code != -1) {
				$scope.pageParams.isRead = code; // = jsonarray;
			} else {
				delete $scope.pageParams.isRead;
			}
			$scope.pageParams['pageNum'] = 1; //tab切换时重置页码。
			getData();

		}

		var myMenuList = $scope.navRoute.user;
		srv.getUserCount(myMenuList, $scope);
		//获取数据
		getData();
		getDataCount();

		//查询
		$scope.search = function() {
			$scope.pageParams["pageNum"] = 1;
			for (var i = 0; i < $scope.pageParams.length; i++) {
				if ($scope.pageParams[i] == "") {
					delete $scope.pageParams[i];
				}
			}
			if ($scope.pageParams['orderNo'] == "") {
				delete $scope.pageParams['orderNo'];
			}
			getData();
		}

		$scope.showInfo = function(approvalStatus, approvalFlowId, orderNo, approvalRecordId, backStatus) {

			//更新消息已读
			$.ajax({
				url: '../approval/updateApprovalRecord.html',
				type: 'POST',
				data: {
					'approvalRecord.approvalRecordId': approvalRecordId
				},
				dataType: 'JSON',
				success: function(datas) {

					if (datas.code == 0) {
						if (approvalStatus == 2) {
							getDataCount();
							base.alert("订单已终止");
							return false;
						}
						if (approvalFlowId == 1) {
							$location.path("/credit/query/" + orderNo);
						} else if (backStatus == 1) {
							$location.path('/loan/srv/' + orderNo);
						} else if (backStatus == 2) {
							$location.path('/loan/risk/' + orderNo);
						} else {
							$location.path('/loan/info/' + orderNo);
						}
						$scope.$apply();
					} else {
						console.log(datas);
						base.alert("系统异常,请重新操作");
					}
				}
			})
		}

		$scope.pagePrev = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == 1) return;
			$scope.pageParams['pageNum'] = cp - 1;
			getData();
		}
		$scope.pageNext = function() {
			var cp = $scope.pageParams['pageNum'];
			if (cp == $scope.page.totalPage) return;
			$scope.pageParams['pageNum'] = cp + 1;
			getData();
		}
		$scope.setPage = function(p) {
			if (p == $scope.pageParams['pageNum']) return;
			$scope.pageParams['pageNum'] = p;
			getData();
		}

		//获取数据集合
		function getData() {
			$.ajax({
				url: '../approval/queryApprovalRecordList.html',
				type: "POST",
				dataType: "JSON",
				data: $scope.pageParams,
				//async:true,
				success: function(datas) {
					if (datas.code == 0 && datas.data != null) {
						var myData = datas.data;
						$scope.page.Resource = myData.data;
						$scope.pageParams['pageNum'] = myData.page;
						$scope.page.pageSize = myData.pageSize;
						$scope.page.total = myData.total;
						$scope.page.totalPage = parseInt(myData.total / myData.pageSize) + (myData.total % myData.pageSize > 0 ? 1 : 0);
						$scope.page.totalPagesArr = [];
						for (var i = 0; i < $scope.page.totalPage; i++) {
							$scope.page.totalPagesArr.push(i);
						}
					} else {
						$scope.page.Resource = [];
						$scope.page.total = 0;
					}
					$scope.$digest();
				},
				error: function(jqXHR, textStatus, errorThrown) {
					console.log(textStatus);
					base.alert("数据初始化异常,请重新刷新页面");
				}
			})
		}
		//获取数据条数
		function getDataCount() {
			$.ajax({
				url: '../approval/getMessageCount.html',
				type: 'POST',
				dataType: 'JSON',
				success: function(datas) {
					if (datas.code == 0 && datas.data != null) {
						$scope.tipers = datas.data;
						$scope.$digest();
					} else {
						console.log(datas);
					}
				},
				error: function(jqrXHR, textStatus, errorThrown) {
					console.log(textStatus);
				}
			});

		}
	}
])
kry.controller('ctrl.dialog.authidea', [
	'$scope',
	'$rootScope',
	'srv',
	'base',
	function($scope, $rootScope, srv, base) {
		$scope.textAreaLimit = function(){
			if($scope.idea.length >200){
				$scope.idea = $scope.idea.substring(0,200);
			}
		}
	}
])

kry.controller('ctrl.notice.list',[
	'$scope',
	'ngDialog',
	'srv',
	'base',
	'$rootScope',
	'$location',
	function($scope, ngDialog, srv, base, $rootScope, $location){
		$scope.noticeList = [];
		//获取公告
		for(var i=0;i<6;i++){
			var notice = {'noticeId':i,'noticeName':'【平台广告】平台公告标题测试'+i,'noticeDate':'2016-04-08 18:53:10'}
			$scope.noticeList.push(notice);
		}
		//公告详情
		$scope.noticeDetail = function(){
			$location('/notice/text/'+$scope.noticeId);
		}
	}
]);
kry.controller('ctrl.notice.text',[
	'$scope',
	'ngDialog',
	'srv',
	'base',
	'$rootScope',
	'$location',
	'$routeParams',
	'$sanitize',
	'$sce',
	function($scope, ngDialog, srv, base, $rootScope, $location,$routeParams,$sanitize,$sce){
		$scope.noticeId = $routeParams.id;
		$scope.notice = {};
		$scope.noticeContent='';
		initilize();
		//初始化
		function initilize(){
			var params = "id="+$scope.noticeId;
			getNoticeDetail(params);
		}

		//获取公告
		function getNoticeDetail(params){
			$.ajax({
				url:'../msgNotice/queryMsgNotice.html',
				type:'POST',
				data:params,
				async:false,
				dataType:'JSON',
				success:function(result){
					if(result.code == 0){
						$scope.notice = result.data
						$scope.noticeContent = $sce.trustAsHtml($scope.notice.noticeContent);//保留style标签
					}else{
						base.alert(result.msg != undefined?result.msg : "系统异常");
					}
				},
				error:function(textStatus){
					console.log(textStatus);
				}
			})
		}
	}
])
kry.controller('ctrl.personal.center',[
	'$scope',
	'ngDialog',
	'srv',
	'base',
	'$rootScope',
	'$location',
	function($scope, ngDialog, srv, base, $rootScope, $location){
		$scope.pageUser = {
			'passWordOld':'',
			'passWordNew':'',
			'passWordNewS':'',
			'phoneNew':'',
			'authCode':''

		};
		$scope.userData ={
			'userAccount':'18888888888',
			'phone':'18888888888',
			'userName':'浙江惠融',
			'roleNames':'经办人'
		};
		srv.getUserInfo(function(result){
			if(!result.code){
				$scope.userData = result.data;
			}
		})
		//更换手机按钮
		$scope.changePhone = function(){
			$location.path('/personal/changephone/');
		}
		//修改密码按钮
		$scope.changePassWord = function(){
			$location.path('/personal/changepwd/');
		}
		//页面退出
		$scope.goBack = function(){
			$location.path("/index");
		}
		//块退出
		$scope.exitModule = function(){
			$scope.chPassWordDiv = false;
			$scope.chPhoneDiv = false;
			$scope.personalInfoDiv = true;
		}
	}
])
kry.controller('ctrl.personal.changepwd',[
	'$scope',
	'ngDialog',
	'srv',
	'base',
	'$rootScope',
	'$location',
	'$timeout',
	function($scope, ngDialog, srv, base, $rootScope, $location,$timeout){
		$scope.pageUser = {
			'passWordOld':'',
			'passWordNew':'',
			'passWordNewS':''
		};
		$scope.changePwdOk = false;

		//修改密码保存
		$scope.savePassWord = function(){

			if($scope.pageUser.passWordOld == ""){
				base.alert("请输入旧密码");
				return
			}
			if($scope.pageUser.passWordNew == ""){
				base.alert("请输入新密码");
				return
			}
			if($scope.pageUser.passWordNewS == "" || $scope.pageUser.passWordNewS != $scope.pageUser.passWordNew){
				base.alert("确认密码与新密码不一致");
				return
			}
			srv.password($scope.pageUser.passWordOld, $scope.pageUser.passWordNew, function(xhr) {
				if (!xhr.code) {
					$scope.changePwdOk = true;
					$timeout(function(){
						$location.path('/personal/center')
					},2000);
				} else {
					base.alert(xhr.msg);
				}
			})
		}
		//页面退出
		$scope.goBack = function(){
			window.history.go(-1);
		}
	}
])
kry.controller('ctrl.personal.changephone',[
	'$scope',
	'ngDialog',
	'srv',
	'base',
	'$rootScope',
	'$location',
	'$timeout',
	function($scope, ngDialog, srv, base, $rootScope, $location,$timeout){
		$scope.modelTitle = '更换手机号码';
		$scope.pageUser = {};
		$scope.booleanCheck = false;
		$scope.inputDisabled = false;
		$scope.changeSuccess = false;
		initilize();
		//保存
		$scope.savePhone = function(){
			var params = ""
			if($scope.pageUser.passWord == undefined || $scope.pageUser.passWord == ""){
				base.alert("请输入登录密码");
				return;
			}
			if($scope.pageUser.phoneNew == undefined || $scope.pageUser.phoneNew == ""){
				base.alert("请输入手机号码");
				return;
			}
			if($scope.pageUser.authCode == undefined || $scope.pageUser.authCode == ""){
				base.alert("请输入手机验证码");
				return;
			}
			$scope.checkExistPhone();
			if(!$scope.booleanCheck){
				//base.alert("请输入正确的信息");
				return;
			}
			params = "user.userPassword="+$scope.pageUser.passWord;
			params += "&user.phone1="+$scope.pageUser.phoneNew;
			params += "&user.authCode="+$scope.pageUser.authCode;

			$.ajax({
				url:'../user/changePhone.html',
				type:'POST',
				data:params,
				dataType:'JSON',
				success:function(result){
					if(undefined != result && result.code == 0){
						$scope.changeSuccess = true;
						$scope.$apply();
						$timeout(function(){
							$location.path('/personal/center')
						},2000);
					}else {
						base.alert(result.msg != undefined ? result.msg : "保存失败")
					}
				},
				error:function(textStatus){
					console.log(textStatus);
					base.alert("操作失败,请联系管理员");
				}

			})
		}
		//检查手机号是否已存在
		$scope.checkExistPhone = function(){
			$.ajax({
				url:'../user/checkPhone.html',
				data:{'user.phone1':$scope.pageUser.phoneNew},
				type:'POST',
				async:false,
				cache:false,
				dataType:'JSON',
				success:function(result){
					if(result != undefined && result.code == 0){
						$scope.booleanCheck = true;
					}else{
						alert((result == undefined?"系统异常":result.msg));
					}
				},
				error:function(textStatus){
					console.log(textStatus)
				}
			});
		}
		//获取验证码
		$scope.getAuthCode = function(){
			if($scope.pageUser.phoneNew == undefined || $scope.pageUser.phoneNew == ""){
				base.alert("请输入手机号码");
				return;
			}
			var phoneFormat = /^1[3|4|5|8|7][0-9]\d{8}$/;
			if(!phoneFormat.test($scope.pageUser.phoneNew)){
				base.alert("请输入正确的手机号码");
				return;
			}
			$scope.checkExistPhone();
			if(!$scope.booleanCheck) return false;
			$scope.inputDisabled = true;
			$.ajax({
				url:'../sms/getSMSCode.html?needLogin=none&mobile='+$scope.pageUser.phoneNew,
				type:'POST',
				dataType:'JSON',
				success:function(result){
					if(result != undefined && result.code == 0){
						base.alert("验证码已经发送到您的手机，请注意查收")
						$("#smsverify").attr("disabled","disabled");
						$rootScope.InterValObj = InterValObj = window.setInterval(SetRemainTime, 1000)
						myTimes = _times;
					}else{
						base.alert(result == undefined?"系统异常":result.msg)
						$scope.inputDisabled = false;
					}
				},
				error:function(textStatus){
					$scope.inputDisabled = false;
					console.log(textStatus);
				}
			})
		}
		function initilize(){
			myTimes = 0;
			if(undefined != $rootScope.InterValObj && null != $rootScope.InterValObj){
				window.clearInterval($rootScope.InterValObj);//停止计时器
				$scope.inputDisabled = false;
			}
			if($rootScope.bindingBtn == 1){
				$scope.modelTitle = "绑定手机号";
			}
		}
		//页面退出
		$scope.goBack = function(){
			$("#smsverify").removeAttr("disabled");
			$("#smsverify").val("获取验证码");
			myTimes = 0;
			if(undefined != InterValObj && null != InterValObj){
				window.clearInterval(InterValObj);//停止计时器
				$scope.inputDisabled = false;
			}

			window.history.go(-1);
		}

		//倒计时
		var myTimes ;
		var _times = 60
		var InterValObj; //timer变量，控制时间
		function SetRemainTime(){
			if(myTimes == 0){
				$("#smsverify").removeAttr("disabled");
				$("#smsverify").val("获取验证码");
				window.clearInterval(InterValObj);//停止计时器
				$scope.inputDisabled = false;
			}else {
				myTimes --;
				$("#smsverify").val(myTimes+"秒后重新发送")
			}
		}
	}
])
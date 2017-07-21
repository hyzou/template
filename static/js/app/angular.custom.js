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
		host: 'http://192.168.2.119:8280/',//接口路径
		// host: '../../',//接口路径
		login: './login.htm',
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

kry.directive('pageNav', function() {
	return {
		restrict: 'E',
		controller: 'ctrl.pageNavCtrl',
		template: '<div class="floatRight" id="red"></div>',
		replace: true
	}
})
// todo
kry.directive('fromDate', function() {
	return {
		restrict: 'E',
		controller: 'ctrl.fromDate',
		template: '<input type="text" class="fromdata" readonly />',
		replace: true
	}
})
kry.directive('endDate', function() {
	return {
		restrict: 'E',
		controller: 'ctrl.endDate',
		template: '<input type="text" class="enddata" readonly />',
		replace: true
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
						if (xhr.code == '0' || xhr.code == -1) {
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
			imgPath: 'http://114.55.106.217:5000/eh-web-api/file/viewfile/',
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
/** 公告*/
kry.factory('api', function() {
	var debug = {
		getResidentType: "getResidentType"
	}
	var api = {
		//接口名称
		// mainName:'eh-web-api/gateway'
		mainName:'gateway'
	}
	return api;
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
			 * 获取首页各列表数量
			 * @params {object} params
			 */
			srv.getListNumber = function(params, cb) {
				var p = {
					url: api.mainName,
					data: params,
					method: 'post'
				}
				ajax(p, cb);
			}
			/* 上传头像  */
			srv.headlogo = function(params, cb) {
				var p = {
					url: api.mainName,
					data: params,
					method: 'post'
				}
				ajax(p, cb);
			}

		return srv;
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
			title: '玺签宝',
			menuKey: 'createCustomer'
		}
		
		$scope.seen = false;
		$root.showSubmenu = false;
		/*$root.v = '1.0.2';
		*$root.openid = '1f488f7849362df64674a3c9f76dbf8e';
		*$root.secret = '67136c0f7383b71a9d62a57732a104f5';
		*$root.timestamp = getNowFormatDate();*/
		$root.phNotice = null;
		$root.InterValObj = null;
		$scope.backToIdx = false;
		$cookies.put(config.cookie.id, localStorage.getItem('cookie'));
		// localStorage.removeItem('cookie');
		$root.uid = $cookies.get(config.cookie.id);
		$root.params = {};
		$root.params['v'] = '1.0.2';
		$root.params['openid'] = '1f488f7849362df64674a3c9f76dbf8e';
		$root.params['secret'] = '67136c0f7383b71a9d62a57732a104f5';
		$root.params['token'] = $root.uid;
		$root.params['timestamp'] = getNowFormatDate();
		//$root.uid = localStorage.getItem('cookie');
		if (!$root.uid) {
			var diag = base.alert('你未登录，或凭据已过期，请先登录');
			diag.closePromise.then(function(d) {
				$window.location.href = config.login;
			})
		}else {
			$root.user = {
		        "assurerno":"hqdb",
		        "role":"客户经理",
		        "roleDisplayName":"",
		        "deptId":332,
		        "dept":"税鸽飞腾",
		        "deptType":1,
		        "userName":"税鸽飞腾",
		        "account":"hqjbr1",
		        "isSign":1
		    }
			$scope.navRoute = navs["main"];
			// getNavTip();
			$scope.globalNavs = $scope.mainNavs;
			/*srv.getUserList(data,function(xhr) {
				if (xhr.code == '0') {
					$root.user = xhr.data;
					$scope.navRoute = navs[xhr.data.role];
					getNavTip();
				} else {
					var diag = base.alert('获取用户数据失败，请尝试重新登录');
					diag.closePromise.then(function(a) {
						$cookies.remove(config.cookie.id);
					})
				}
			})*/
		}

		function getNowFormatDate() {
			var date = new Date();
			var month = date.getMonth() + 1;
			var strDate = date.getDate();
			var hour = date.getHours();
			var minute = date.getMinutes();
			var second = date.getSeconds();
			if(month >= 1 && month <= 9) {
				month = "0" + month;
			}
			if(strDate >= 0 && strDate <= 9) {
				strDate = "0" + strDate;
			}
			if(hour >= 0 && hour <= 9) {
				hour = "0" + hour;
			}
			if(minute >= 0 && minute <= 9) {
				minute = "0" + minute;
			}
			if(second >= 0 && second <= 9) {
				second = "0" + second;
			}
		
			var currentdate = date.getFullYear() + month + strDate + hour + minute + second;
			return currentdate;
		}
		
		$root.setSite = function(o) {
			$scope.site = angular.merge($scope.site, o);
		}

		$root.defaultUrl = './static/css/img/uploadbg.png';
		$root.globalImgPath = base.imgPath;

		$root.upload = function(order, flag, isocr, role, type, file, cb) {
			if (type == "1851" && !~'avi|mov|mp4|rmvb|m4v'.indexOf(file.type.substr(6))) {
				base.alert('仅支持上传avi、mov、mp4、rmvb、m4v格式视频');
				cb(false);
				return;
			}
			if (!~'jpeg|jpg|png|gif'.indexOf(file.type.substr(6))) {
				base.alert('仅支持上传jpeg、jpg、png、gif格式的图片');
				cb(false);
				return;
			}
			var fd = new FormData();
			fd.append('fileData', file);
			srv.upload(order, flag, isocr, role, type, fd, cb);
		}

		$scope.getNavRoute = function(key) {
			if ($scope.navRoute.srv[key])
				return $scope.navRoute.srv[key].route;
			else return false;
		}
		$scope.getNavIcon = function(key) {
			return $scope.navRoute.srv[key].icon;
		}

		$scope.change = function(key) {
			$scope.backToIdx = true;
			$scope.navRoute = navs["person"];
			getNavTip();
			$scope.globalNavs = $scope.personNavs;
			/*if ($scope.navRoute.srv[key])
				return $scope.navRoute.srv[key].route;
			else return false;*/
		}
		$scope.backtoIndex = function(key) {
			$scope.backToIdx = false;
			$scope.navRoute = navs["main"];
			$scope.globalNavs = $scope.mainNavs;
			getNavTip();
		}
		checkUrl();
		function checkUrl(key){
			debugger
			if($location.$$url != '/' && $location.$$url.substring(1,5) == 'pers'){
				$scope.backToIdx = true;
				$scope.navRoute = navs["person"];
				getNavTip();
				$scope.globalNavs = $scope.personNavs;
				/*if ($scope.navRoute.srv[key])
					return $scope.navRoute.srv[key].route;
				else return false;*/
			}else{
				$scope.backToIdx = false;
				$scope.navRoute = navs["main"];
				getNavTip();
				$scope.globalNavs = $scope.mainNavs;
				$scope.getNavRoute();
			};
		}
		$scope.loginOut = function() {
			$window.location.href = config.login;
			localStorage.clear();
			/*srv.loginOut(function(xhr) {
				if (xhr.code == '0') {
					$window.location.href = config.login;
				} else
					base.alert('退出失败，请刷新后重试');
			})*/
		}

		function getNavTip() {
			var navcount  = JSON.parse(JSON.stringify($root.params));
				navcount['method'] = 'com.shuige.sealsign.filesCount';
			srv.headlogo(navcount,function(xhr){
				if(xhr.code == '0'){
					debugger
					$scope.alreadyCount = xhr.data.alreadyCount;
					$scope.forMeCount = xhr.data.forMeCount;
					$scope.cgCount = xhr.data.cgCount;
					$scope.toOthersCount = xhr.data.toOthersCount;
					$scope.cloudyCount = xhr.data.cloudyCount;
					$scope.refuseCount = xhr.data.refuseCount;
					setTimeout(getNavTip(),6000);
				}else{
					base.alert(xhr.msg)
				}
			})
			$scope.mainNavs = [
		        {
		            "key":"index",
		            "name":"首页",
		            "count":0
		        },
		        {
		            "key":"signMe",
		            "name":"待我签署",
		            "count":$scope.forMeCount
		        },
		        {
		            "key":"signOther",
		            "name":"待他人签署",
		            "count":$scope.toOthersCount
		        },
		        {
		            "key":"signFinish",
		            "name":"已完成签署",
		            "count":$scope.alreadyCount
		        },
		        {
		            "key":"docBack",
		            "name":"退回的文件",
		            "count":$scope.refuseCount
		        },
		        {
		            "key":"drafts",
		            "name":"草稿箱",
		            "count":$scope.cgCount
		        },
		        {
		            "key":"cloudFile",
		            "name":"云文件",
		            "count":$scope.cloudyCount
		        }
		    ];
			$scope.personNavs = [
		        {
		            "key":"personInfo",
		            "name":"个人信息",
		            "count":0
		        },
		        {
		            "key":"personInforec",
		            "name":"信息认证",
		            "count":0
		        },
		        {
		            "key":"personSign",
		            "name":"我的签名",
		            "count":0
		        },
		        {
		            "key":"personSafe",
		            "name":"安全设置",
		            "count":0
		        },
		        {
		            "key":"personMsg",
		            "name":"消息设置",
		            "count":0
		        }
		    ];
		}
		$root.dosuccess = function(){
			var diag = dialog.open({
				templateUrl: 'templates/dialog/dialog.recSuccess.htm',
				className: 'ngdialog-notopen'
			});
			setTimeout(function(){
				diag.close();
			},1500);
		}
		$root.dofail = function(){
			var diag = dialog.open({
				templateUrl: 'templates/dialog/dialog.recFail.htm',
				className: 'ngdialog-notopen'
			});
			setTimeout(function(){
				diag.close();
			},1500);
		}
		$root.notopen = function(){
			var diag = dialog.open({
				templateUrl: 'templates/dialog/dialog.notopen.htm',
				className: 'ngdialog-notopen'
			});
			setTimeout(function(){
				diag.close();
			},1500);
		}
	}
])
kry.factory('navs', function() {
	return {
		"main": {
			srv: {
				"index": {
					//"icon": "&#xe608;",
					"route": '/'
				},
				"signMe": {
					"code": 1,
					"route": "/signMe"
				},
				"signOther": {
					"code": 2,
					"route": "/signOther"
				},
				"signFinish": {
					"code": 0,
					"route": "/signFinish"
				},
				"docBack": {
					"code": 5,
					"route": "/docBack"
				},
				"drafts": {
					"code": 8,
					"route": "/drafts"
				},
				"cloudFile": {
					"code": 8,
					"route": "/cloudFile"
				}
			}
		},
		"person": {
			srv: {
				"personInfo": {
					"code": 1,
					"route": "/personInfo"
				},
				"personInforec": {
					"code": 1,
					"route": "/personInforec"
				},
				"personMsg": {
					"code": 1,
					"route": "/personMsg"
				},
				"personSafe": {
					"code": 1,
					"route": "/personSafe"
				},
				"personSign": {
					"code": 1,
					"route": "/personSign"
				},
			}
		}
	}
})
kry.controller('ctrl.index', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '首页',
			menuKey: 'index'
		})
		$scope.titleList = [
			"本地文件签署","云文件签署","合同模板签署"
		];
		// $scope.selectd = '本地文件签署';
		$scope.titleSel = function(idx,$el){
			$scope.selectd = $el;
			if($el == '云文件签署'){
				var diag = dialog.open({
					templateUrl: 'templates/dialog/dialog.cloudfilelist.htm',
					scope: $scope,
					controller:'ctrl.dialog.cloudfilelist',
					className: 'ngdialog-theme-input'
				});
				diag.closePromise.then(function() {
					console.log(123)
				})
			} else if ($el == '合同模板签署'){
				var diag = dialog.open({
					templateUrl: 'templates/dialog/dialog.modelfilelist.htm',
					scope: $scope,
					controller:'ctrl.dialog.modelfilelist',
					className: 'ngdialog-theme-input'
				});
				diag.closePromise.then(function() {
					console.log(123)
				})
			} 
		};
		$scope.fileUpload = function(file){
			console.log(file);
			if(file){
				$location.path('/fileSign');
			}
		}
		$scope.operatePage = function(name){
			switch (name){
				case '待我签署':
					$location.path('/signMe');
					break;
				case '待他人签署':
					$location.path('/signOther');
					break;
				case '已完成签署':
					$location.path('/signFinish');
					break;
				case '退回的文件':
					$location.path('/docBack');
					break;
				case '草稿箱':
					$location.path('/drafts');
					break;
				case '云文件':
					$location.path('/cloudFile');
					break;
				default:
					return;
					break;
			}
		}
	}
])
kry.controller('ctrl.main.signMe', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '待我签署',
			menuKey: 'signMe'
		});
		$scope.fastSearch = function(){
			if(!$scope.documentTit){
				base.alert('请输入文档标题再筛选')
			}else{
				base.alert($scope.documentTit)
			}
		}
		$scope.fiterSearch = function(){
			$scope.fromDate = $(".fromdata").val();
			$scope.endDate = $(".enddata").val();
			var data = {};
			if(base.isDefined($scope.documentName)){
				data['documentName'] = $scope.documentName;
			}
			if(base.isDefined($scope.provider)){
				data['provider'] = $scope.provider;
			}
			if(base.isDefined($scope.receiver)){
				data['receiver'] = $scope.receiver;
			}
			if(base.isDefined($scope.fromDate)){
				data['fromDate'] = $scope.fromDate;
			}
			if(base.isDefined($scope.endDate)){
				data['endDate'] = $scope.endDate;
			}
			if(base.isDefined($scope.docType)){
				data['docType'] = $scope.docType;
			}
			if(!$scope.documentName && !$scope.provider && !$scope.receiver && !$scope.fromDate && !$scope.endDate && !$scope.docType){
				base.alert('请输入筛选条件后再进行筛选')
			}else{
				console.log(data);
			}
		}
		$scope.filterReset = function(){
			$scope.documentName = '';
			$scope.provider = '';
			$scope.receiver = '';
			$(".fromdata").val('');
			$(".enddata").val('');
			$scope.docType = '';
		}
		$scope.documentRank = function(){
			var diag = dialog.open({
				templateUrl: 'templates/dialog/dialog.documentRank.htm',
				scope: $scope,
				controller:'ctrl.dialog.documentRank',
				className: 'ngdialog-theme-input'
			});
		}
		$scope.cliNav = function(newPage){
			alert(newPage)
		}
	}
])
kry.controller('ctrl.main.signOther', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '待他人签署',
			menuKey: 'signOther'
		});
		$scope.fastSearch = function(){
			if(!$scope.documentTit){
				base.alert('请输入文档标题再筛选')
			}else{
				base.alert($scope.documentTit)
			}
		}
		$scope.fiterSearch = function(){
			$scope.fromDate = $(".fromdata").val();
			$scope.endDate = $(".enddata").val();
			var data = {};
			if(base.isDefined($scope.documentName)){
				data['documentName'] = $scope.documentName;
			}
			if(base.isDefined($scope.provider)){
				data['provider'] = $scope.provider;
			}
			if(base.isDefined($scope.receiver)){
				data['receiver'] = $scope.receiver;
			}
			if(base.isDefined($scope.fromDate)){
				data['fromDate'] = $scope.fromDate;
			}
			if(base.isDefined($scope.endDate)){
				data['endDate'] = $scope.endDate;
			}
			if(base.isDefined($scope.docType)){
				data['docType'] = $scope.docType;
			}
			if(!$scope.documentName && !$scope.provider && !$scope.receiver && !$scope.fromDate && !$scope.endDate && !$scope.docType){
				base.alert('请输入筛选条件后再进行筛选')
			}else{
				console.log(data);
			}
		}
		$scope.filterReset = function(){
			$scope.documentName = '';
			$scope.provider = '';
			$scope.receiver = '';
			$(".fromdata").val('');
			$(".enddata").val('');
			$scope.docType = '';
		}
		$scope.documentRank = function(){
			var diag = dialog.open({
				templateUrl: 'templates/dialog/dialog.documentRank.htm',
				scope: $scope,
				controller:'ctrl.dialog.documentRank',
				className: 'ngdialog-theme-input'
			});
		}
		$scope.cliNav = function(newPage){
			alert(newPage)
		}
	}
])
kry.controller('ctrl.main.signFinish', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '已完成签署',
			menuKey: 'signFinish'
		});
		$scope.fastSearch = function(){
			if(!$scope.documentTit){
				base.alert('请输入文档标题再筛选')
			}else{
				base.alert($scope.documentTit)
			}
		}
		$scope.fiterSearch = function(){
			$scope.fromDate = $(".fromdata").val();
			$scope.endDate = $(".enddata").val();
			var data = {};
			if(base.isDefined($scope.documentName)){
				data['documentName'] = $scope.documentName;
			}
			if(base.isDefined($scope.provider)){
				data['provider'] = $scope.provider;
			}
			if(base.isDefined($scope.receiver)){
				data['receiver'] = $scope.receiver;
			}
			if(base.isDefined($scope.fromDate)){
				data['fromDate'] = $scope.fromDate;
			}
			if(base.isDefined($scope.endDate)){
				data['endDate'] = $scope.endDate;
			}
			if(base.isDefined($scope.docType)){
				data['docType'] = $scope.docType;
			}
			if(!$scope.documentName && !$scope.provider && !$scope.receiver && !$scope.fromDate && !$scope.endDate && !$scope.docType){
				base.alert('请输入筛选条件后再进行筛选')
			}else{
				console.log(data);
			}
		}
		$scope.filterReset = function(){
			$scope.documentName = '';
			$scope.provider = '';
			$scope.receiver = '';
			$(".fromdata").val('');
			$(".enddata").val('');
			$scope.docType = '';
		}
		$scope.documentRank = function(){
			var diag = dialog.open({
				templateUrl: 'templates/dialog/dialog.documentRank.htm',
				scope: $scope,
				controller:'ctrl.dialog.documentRank',
				className: 'ngdialog-theme-input'
			});
		}
		$scope.cliNav = function(newPage){
			alert(newPage)
		}
	}
])
kry.controller('ctrl.main.docBack', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '退回的文件',
			menuKey: 'docBack'
		});
		$scope.fastSearch = function(){
			if(!$scope.documentTit){
				base.alert('请输入文档标题再筛选')
			}else{
				base.alert($scope.documentTit)
			}
		}
		$scope.fiterSearch = function(){
			$scope.fromDate = $(".fromdata").val();
			$scope.endDate = $(".enddata").val();
			var data = {};
			if(base.isDefined($scope.documentName)){
				data['documentName'] = $scope.documentName;
			}
			if(base.isDefined($scope.provider)){
				data['provider'] = $scope.provider;
			}
			if(base.isDefined($scope.receiver)){
				data['receiver'] = $scope.receiver;
			}
			if(base.isDefined($scope.fromDate)){
				data['fromDate'] = $scope.fromDate;
			}
			if(base.isDefined($scope.endDate)){
				data['endDate'] = $scope.endDate;
			}
			if(base.isDefined($scope.docType)){
				data['docType'] = $scope.docType;
			}
			if(!$scope.documentName && !$scope.provider && !$scope.receiver && !$scope.fromDate && !$scope.endDate && !$scope.docType){
				base.alert('请输入筛选条件后再进行筛选')
			}else{
				console.log(data);
			}
		}
		$scope.filterReset = function(){
			$scope.documentName = '';
			$scope.provider = '';
			$scope.receiver = '';
			$(".fromdata").val('');
			$(".enddata").val('');
			$scope.docType = '';
		}
		$scope.documentRank = function(){
//			srv.getUserList(28,function(xhr){
//				console.log(xhr);
//			})
			var diag = dialog.open({
				templateUrl: 'templates/dialog/dialog.documentRank.htm',
				scope: $scope,
				controller:'ctrl.dialog.documentRank',
				className: 'ngdialog-theme-input'
			});
		}
		$scope.cliNav = function(newPage){
			alert(newPage)
		}
	}
])
kry.controller('ctrl.main.drafts', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '草稿箱',
			menuKey: 'drafts'
		});
		$scope.fastSearch = function(){
			if(!$scope.documentTit){
				base.alert('请输入文档标题再筛选')
			}else{
				base.alert($scope.documentTit)
			}
		}
		$scope.fiterSearch = function(){
			$scope.fromDate = $(".fromdata").val();
			$scope.endDate = $(".enddata").val();
			var data = {};
			if(base.isDefined($scope.documentName)){
				data['documentName'] = $scope.documentName;
			}
			if(base.isDefined($scope.provider)){
				data['provider'] = $scope.provider;
			}
			if(base.isDefined($scope.receiver)){
				data['receiver'] = $scope.receiver;
			}
			if(base.isDefined($scope.fromDate)){
				data['fromDate'] = $scope.fromDate;
			}
			if(base.isDefined($scope.endDate)){
				data['endDate'] = $scope.endDate;
			}
			if(base.isDefined($scope.docType)){
				data['docType'] = $scope.docType;
			}
			if(!$scope.documentName && !$scope.provider && !$scope.receiver && !$scope.fromDate && !$scope.endDate && !$scope.docType){
				base.alert('请输入筛选条件后再进行筛选')
			}else{
				console.log(data);
			}
		}
		$scope.filterReset = function(){
			$scope.documentName = '';
			$scope.provider = '';
			$scope.receiver = '';
			$(".fromdata").val('');
			$(".enddata").val('');
			$scope.docType = '';
		}
		$scope.documentRank = function(){
			var diag = dialog.open({
				templateUrl: 'templates/dialog/dialog.documentRank.htm',
				scope: $scope,
				controller:'ctrl.dialog.documentRank',
				className: 'ngdialog-theme-input'
			});
		}
		$scope.cliNav = function(newPage){
			alert(newPage)
		}
	}
])
kry.controller('ctrl.main.cloudFile', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '云文件',
			menuKey: 'cloudFile'
		});
		$scope.showRank = false;
		$scope.fileTitleArr = ['员工公寓租赁合同','员工公寓租赁合同1','员工公寓租赁合同2','员工公寓租赁合同3'];
		$scope.filterArr = ['创建时间','修改时间','文件名称','文件大小'];
		$scope.fileTitle = function(idx,$el){
			$scope.selectd = idx;
			$scope.selectedTitle = $el;
			$scope.artTitle = $el;
		}
		$scope.htmlStr = '<p>为富人se<u>re日</u>晚污染<strike>范围限定房价是否建立快</strike>速交<span data-fr-verified="true" style="color: #FFFF00;">付了</span>空间</p>';
		$('#edit').editable({
			inlineMode: false,
			alwaysBlank: true,
			buttons: ["bold", "italic", "underline", "strikeThrough", "fontSize", "color", "formatBlock", "blockStyle", "align", "insertOrderedList", "insertUnorderedList", "outdent", "indent", "insertHorizontalRule", "undo", "redo"],
            language: 'zh_cn',
            placeholder: ''
		});
		edit()
		function edit(){
			if($scope.htmlStr){
				$('#edit').find(".froala-element").html($scope.htmlStr)
			}
		}
		$scope.saveEditor = function(){
			console.log($scope.artTitle);
			var content = $("#edit .froala-element").eq(0)[0].innerHTML;
			console.log(content)
		}
		
		$scope.rankCondition = function(){
			if($scope.showRank){
				$scope.showRank = false;
			}else{
				$scope.showRank = true;
			}
		}
		$scope.liSel = function(idx,$el){
			$scope.sel = idx;
			$scope.elName = $el;
		}
	}
])
kry.controller('ctrl.main.fileModel', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '合同模板',
			menuKey: 'cloudFile'
		});
		$scope.showRank = false;
		$scope.fileTitleArr = ['员工公寓租赁合同','员工公寓租赁合同1','员工公寓租赁合同2','员工公寓租赁合同3'];
		$scope.filterArr = ['创建时间','修改时间','文件名称','文件大小'];
		$scope.fileTitle = function(idx,$el){
			$scope.selectd = idx;
			$scope.selectedTitle = $el;
			$scope.artTitle = $el;
		};
		$scope.rankCondition = function(){
			if($scope.showRank){
				$scope.showRank = false;
			}else{
				$scope.showRank = true;
			}
		};
		$scope.liSel = function(idx,$el){
			$scope.sel = idx;
			$scope.elName = $el;
		};
		$('#dowebok').viewer({
			url: 'data-original',
		});
	}
])
kry.controller('ctrl.main.fileSign', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '文件签署',
			menuKey: 'fileSign'
		});
		$scope.contactList = [{
			'tel': '13812345678',
			'name': '孙红雷',
			'mail': '2659889896@qq.com',
			'recognize': '手机+邮箱+实名'
		},{
			'tel': '13812345678',
			'name': '黄渤',
			'mail': '2659889896@qq.com',
			'recognize': '手机+邮箱+实名'
		}];
		var h=0,
			scrollTimes = 0;
		$scope.scrollbar = false;
		var maxTimes = $("#dowebok .filesPicConItem").length,
			divWidth = $("#dowebok").width(),
			showLen = Math.floor(divWidth/155);
		if(maxTimes > showLen){
			$scope.scrollbar = true;
		}
		$scope.scrollLeft = function(){
			var maxTimes = $("#dowebok .filesPicConItem").length,
				divWidth = $("#dowebok").width(),
				showLen = Math.floor(divWidth/155),
				clickTimes = maxTimes-showLen + 1,
				leftScroll = $("#dowebok").scrollLeft(),
				leftScrollspace = divWidth-leftScroll;
			
			if(leftScroll <= 0){
				return;
			}else{
				h -= 154;
				scrollTimes-=1;
				$("#dowebok").scrollLeft(h);
			}
		}
		$scope.scrollRight = function(){
			var maxTimes = $("#dowebok .filesPicConItem").length,
				divWidth = $("#dowebok").width(),
				showLen = Math.floor(divWidth/155),
				clickTimes = maxTimes-showLen+1,
				leftScroll = $("#dowebok").scrollLeft(),
				leftScrollspace = divWidth-leftScroll;
			if(leftScroll <= 0){
				scrollTimes = 0;
				scrollTimes+=1;
			}else{
				scrollTimes+=1;
			}
			if(scrollTimes >= clickTimes){
				scrollTimes = clickTimes - 1;
				return;
			}else{
				h += 154;
				$("#dowebok").scrollLeft(h);
			}
		}
		$('#dowebok').viewer({
			url: 'data-original',
		});
		$scope.addReceiver = function(){
			var newObj = {
			'tel': '',
			'name': '',
			'mail': '',
			'recognize': ''
			};
			$scope.contactList.push(newObj);
		};
		$scope.removeLast = function(){
			$scope.contactList.pop();
		};
		$("#payments").msDropdown({visibleRows:4});
	}
])
kry.controller('ctrl.main.signature', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '签章',
			menuKey: 'signature'
		});
		$scope.scrollFile = function(index){
			document.getElementById("pic_"+index).scrollIntoView();
		}
		$scope.runSign = function(){
			$(".panel").remove();
			$(".sign").remove();
			var fileList = $(".signPics");
			for(var i=0;i<fileList.length;i++){
				$("#pic_"+i).zSign({ 
					img: '../template/static/js/third/zSign/images/1.gif',
					width: 120,
        			height: 120,
					offset: 0
				});
			}
		}
		$scope.runSign2 = function(){
			$(".panel").remove();
			$(".sign").remove();
			var fileList = $(".sign2");
			for(var i=0;i<fileList.length;i++){
				$("#sign_"+i).zSign({ 
					img: '../template/static/js/third/zSign/images/1.gif',
					width: 120,
        			height: 120,
					offset: 0
				});
			}
		}
		$scope.saveImg = function(){
			$(".panel").remove();
		}
	}
])
kry.controller('ctrl.person.info', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '个人信息',
			menuKey: 'personInfo'
		});
		getProvince();
		loadRec();
		function loadRec(){
			var loaddata = JSON.parse(JSON.stringify($root.params));
				loaddata['method'] = 'com.shuige.sealsign.selectUserExtVo';
				loaddata['strToken'] = $root.uid;
			srv.headlogo(loaddata,function(xhr){
				if(xhr.code == '0'){
	    			$scope.loginName = xhr.data.loginName;
	    			$scope.loginIdnum = xhr.data.idCard;
	    			$scope.province = xhr.data.provinceId;
	    			if($scope.province){
	    				getCity();
	    			}
	    			$scope.city = xhr.data.cityId;
	    			if($scope.city){
	    				getcoun();
	    			}
	    			$scope.county = xhr.data.countyId;
	    			$scope.detailAdd = xhr.data.countyId;
	    			$scope.company = xhr.data.entName;
	    			$scope.job = xhr.data.positionName;
				}else{
					base.alert(xhr.msg);
				}
			})
		}
		$("#logoFile").uploadify({
			'auto': true,
	        'swf': 'static/js/third/jqueryUplodify/uploadify.swf',
	        'uploader': 'http://192.168.2.119:8280/file/upload',//后台处理的请求
	        'queueID': 'fileQueue',//与下面的id对应
	        'fileTypeDesc': '图片格式',
	        'fileTypeExts': '*.jpg;*.jpeg;*.png', //控制可上传文件的扩展名，启用本项时需同时声明fileDesc
	        'method': 'POST',
	        'multi': true,
	        'buttonText': '上传文件',
	        'fileObjName': 'files',//服务端File对应的名称。
	        'height': 120,
            'width': 120,
	        'onUploadSuccess': function (file, data, response) {
	            var dataObj = JSON.parse(data);
	            $scope.logoimg = dataObj.data[0].path;
	            var imgUrl = $root.globalImgPath + dataObj.data[0].path;
	            $("#logoPic").attr('src', imgUrl);
				var logoPicData  = JSON.parse(JSON.stringify($root.params));
				logoPicData['method'] = 'com.shuige.user.savePic';
				logoPicData['userPic'] = $scope.logoimg;
				logoPicData['v'] = '1.0.0';
				srv.headlogo(logoPicData,function(xhr){
					if(xhr.code == '0'){
						$root.dosuccess();
					}else{
						base.alert(xhr.msg)
						$root.dofail();
					}
				})
	        },
	        'onUploadError': function (file, errorCode, errorMsg, errorString) {
	            base.alert('当前文件：' + file.name + '上传失败，失败原因：' + errorString);
	        }
        });
		/*$scope.fileUpload = function(fil){
			for(var i = 0; i < fil.length; i++) {
				reads(fil[i]);
			}
		};
		function reads(fil) {
			var reader = new FileReader();
			reader.readAsDataURL(fil);
			reader.onload = function() {
				var data  = JSON.parse(JSON.stringify($root.params));
					data['method'] = 'com.shuige.user.picUpHead';
					data['userPic'] = reader.result; //.split(',')[1];
					data['v'] = '1.0.1';
				console.log(data);	
				srv.headlogo(data,function(xhr){
					if(xhr.code == '0'){
						$("#logoPic").attr('src', reader.result);
						$scope.picUrl = xhr.data;
						$root.dosuccess();
					}else{
						$root.dofail();
					}
				})
			};
		}*/
		function getProvince(){
			var proData  = JSON.parse(JSON.stringify($root.params));
			proData['method'] = 'com.shuige.sealsign.getDicProvinceList';
			srv.headlogo(proData,function(xhr){
				if(xhr.code == '0'){
					$scope.proList = xhr.data;
				}else{
					base.alert('获取省份列表失败');
				}
			})
		}
		$scope.getCity = function(){
			$scope.city = '';
			$scope.county = '';
			$scope.detailAdd = '';
			getCity();
		}
		function getCity(){
			var cityData  = JSON.parse(JSON.stringify($root.params));
			cityData['method'] = 'com.shuige.sealsign.getDicCityList';
			cityData['provinceId'] = $scope.province;
			srv.headlogo(cityData,function(xhr){
				if(xhr.code == '0'){
					$scope.cityList = xhr.data;
				}else{
					$root.dofail();
				}
			})
		}
		$scope.getCountry = function(){
			$scope.county = '';
			$scope.detailAdd = '';
			getcoun();
		}
		function getcoun(){
			var counData  = JSON.parse(JSON.stringify($root.params));
			counData['method'] = 'com.shuige.sealsign.getDicCountyList';
			counData['provinceId'] = $scope.province;
			counData['cityId'] = $scope.city;
			srv.headlogo(counData,function(xhr){
				if(xhr.code == '0'){
					$scope.counList = xhr.data;
				}else{
					$root.dofail();
				}
			})
		}
		$scope.infoSubmit = function(){
			// var userCreditInfo = encodeURIComponent(encodeURIComponent(ct.userCreditInfo));  //+,%编码
			// 解码方法http://blog.csdn.net/li2327234939/article/details/53675211
			var data1  = JSON.parse(JSON.stringify($root.params));
				data1['method'] = 'com.shuige.sealsign.personUpdate';
			if (base.isDefined($scope.loginName)){
	    		var re = /[^\u4e00-\u9fa5]/;  
	 			if(!re.test(thisval)){
	 				base.alert('登录名不能含中文')
	 				$scope.loginName = '';
	 			}else{
	 				data1['loginName'] = $scope.loginName;
	 			}
			}
			if (!$scope.loginIdnum || !base.isIdc($scope.loginIdnum)) {
				base.alert('请正确填写您的身份证号码');
				return;
			} else {
				data1['idCard'] = $scope.loginIdnum;
			}
			if(!$scope.province){
				base.alert("请填写您所在省份")
				return;
			} else {
				data1['provinceId'] = $scope.province;
			}
			if(!$scope.city){
				base.alert("请填写您所在城市")
				return;
			} else {
				data1['cityId'] = $scope.city;
			}
			if(!$scope.county){
				base.alert("请填写您所在区/县")
				return;
			} else {
				data1['countyId'] = $scope.county;
			}
			if(!$scope.detailAdd){
				base.alert("请填写您的详细地址")
				return;
			} else {
				data1['address'] = $scope.detailAdd;
			}
			if (base.isDefined($scope.company))
				data1['entName'] = $scope.company;
			if (base.isDefined($scope.job))
				data1['positionName'] = $scope.job;
			srv.headlogo(data1,function(xhr){
				if(xhr.code == '0'){
					$root.dosuccess();
				}else{
					$root.dofail();
				}
			})
		}
	}
])
kry.controller('ctrl.person.inforec', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '信息认证',
			menuKey: 'personInforec'
		});
		$scope.mailRec = false;
		$scope.mobileRec = false;
		$scope.realNameRec = false;
		$scope.notOpen = false;
		$scope.idcardShow = false;
		$scope.inforShow = true;
		$scope.mobileyzmshow = true;
		$scope.mailYzmshow = true;
		$scope.recmo = false;
		$scope.recma = false;
		$scope.recna = false;
		loadRec();
		function loadRec(){
			var loaddata  = JSON.parse(JSON.stringify($root.params));
				loaddata['method'] = 'com.shuige.sealsign.selectUserExtVo';
				loaddata['strToken'] = $root.uid;
			srv.headlogo(loaddata,function(xhr){
				if(xhr.code == '0'){
					var authentication = xhr.data.authentication;
					if(authentication == '0'){
						$scope.recmo = false;
						$scope.recma = false;
						$scope.recna = false;
					}else if(authentication == '1'){
						$scope.recmo = true;
						$scope.recma = false;
						$scope.recna = false;
					}else if(authentication == '2'){
						$scope.recmo = false;
						$scope.recma = true;
						$scope.recna = false;
					}else if(authentication == '3'){
						$scope.recmo = true;
						$scope.recma = true;
						$scope.recna = false;
					}else if(authentication == '4'){
						$scope.recmo = false;
						$scope.recma = false;
						$scope.recna = true;
					}else if(authentication == '5'){
						$scope.recmo = true;
						$scope.recma = false;
						$scope.recna = true;
					}else if(authentication == '6'){
						$scope.recmo = false;
						$scope.recma = true;
						$scope.recna = true;
					}else{
						$scope.recmo = true;
						$scope.recma = true;
						$scope.recna = true;
					}
	    			$scope.loginIdnum = xhr.data.idCard;
	    			$scope.province = xhr.data.provinceId;
	    			if($scope.province){
	    				getCity();
	    			}
	    			$scope.city = xhr.data.cityId;
	    			if($scope.city){
	    				getcoun();
	    			}
	    			$scope.county = xhr.data.countyId;
	    			$scope.detailAdd = xhr.data.countyId;
	    			$scope.company = xhr.data.entName;
	    			$scope.job = xhr.data.positionName;
				}else{
					base.alert(xhr.msg);
				}
			})
		}
		$scope.mobileCli = function(){
			$scope.mailRec = false;
			if($scope.recmo){
				$scope.mobileRec = false;
			}else{
				$scope.mobileRec = true;
			}
			$scope.realNameRec = false;
		};
		$scope.mailCli = function(){
			if($scope.recma){
				$scope.mailRec = false;
			}else{
				$scope.mailRec = true;
			}
			$scope.mobileRec = false;
			$scope.realNameRec = false;
		};
		$scope.nameRealCli = function(){
			if($scope.recna){
				$scope.realNameRec = false;
			}else{
				$scope.realNameRec = true;
			}
			$scope.mailRec = false;
			$scope.mobileRec = false;
		};
		$scope.bankRec = function(){
			$root.notopen();
		};
		$scope.fileUpload = function(fil,elem){
			for(var i = 0; i < fil.length; i++) {
				reads(fil[i],elem);
			}
		};
		function reads(fil,ele) {
			var reader = new FileReader();
			reader.readAsDataURL(fil);
			reader.onload = function() {
				$(ele).parent().parent().siblings('.idRecGroupPic').find('img').attr('src', reader.result);
			};
		};
		$scope.inforIdcard = function(){
			$scope.idcardShow = true;
			$scope.inforShow = false;
		};
		$scope.Inforwrap = function(){
			$scope.idcardShow = false;
			$scope.inforShow = true;
		}
		//手机认证验证码
		$scope.getphoneYzm = function(){
			var yzmData  = JSON.parse(JSON.stringify($root.params));
			yzmData['mobileOrEmail'] = $scope.telphone;
			yzmData['method'] = 'com.shuige.sealsign.sendcaptcha';
			srv.headlogo(yzmData,function(xhr){
				if(xhr.code == '0'){
	    			$("#mobileyzmshow").hide();
	    			$("#mobileyzm").show();
	    			var nums = 3;
	    			$("#mobileyzm").text(nums+'秒重发');
	    			var clock = setInterval(doLoop, 1000);
	    			function doLoop(){
						nums--;
						if(nums > 0){
							$("#mobileyzm").text(nums+'秒重发');
						}else{
			    			$("#mobileyzmshow").show();
			    			$("#mobileyzm").hide();
							clearInterval(clock); //清除js定时器
							nums = 3; //重置时间
						}
					}	
				}else{
					$root.dofail();
				}
			})
		}
		//手机认证提交信息
		$scope.subMobile = function(){
			var mobData  = JSON.parse(JSON.stringify($root.params));
			mobData['method'] = 'com.shuige.sealsign.updateUserExt';
			mobData['authentication'] = '1';
			if(!$scope.telphone){
				base.alert("请填写您的手机号码")
				return;
			} else {
				mobData['mobile'] = $scope.telphone;
			}
			if(!$scope.phoneYzm){
				base.alert("请填写您的验证码")
				return;
			} else {
				mobData['captcha'] = $scope.phoneYzm;
			}
			srv.headlogo(mobData,function(xhr){
				if(xhr.code == '0'){
					$root.dosuccess();
					$scope.mobileRec = false;
				}else{
					$root.dofail();
				}
			})
		}
		//邮箱认证验证码
		$scope.getmailYzm = function(){
			var mailyzmData  = JSON.parse(JSON.stringify($root.params));
				mailyzmData['method'] = 'com.shuige.sealsign.sendcaptcha';
			if(!$scope.mailNum){
				base.alert("请填写您的邮箱")
				return;
			} else {
				mailyzmData['mobileOrEmail'] = $scope.mailNum;
			}
			srv.headlogo(mailyzmData,function(xhr){
				if(xhr.code == '0'){
	    			$scope.mailYzmshow = false;
	    			$("#mailyzmShow").hide();
	    			$("#mailyzm").show();
	    			var nums = 3;
	    			$("#mailyzm").text(nums+'秒重发');
	    			var clock = setInterval(doLoop, 1000);
	    			function doLoop(){
						nums--;
						if(nums > 0){
							$("#mailyzm").text(nums+'秒重发');
						}else{
							//$scope.mailYzmshow = true;
			    			$("#mailyzmShow").show();
			    			$("#mailyzm").hide();
							clearInterval(clock); //清除js定时器
							nums = 3; //重置时间
						}
					}	
				}else{
					$root.dofail();
				}
			})
		}
		//邮箱认证提交信息
		$scope.submail = function(){
			var mailData  = JSON.parse(JSON.stringify($root.params));
				mailData['method'] = 'com.shuige.sealsign.updateUserExt';
				mailData['authentication'] = '2';
			if(!$scope.mailNum){
				base.alert("请填写您的邮箱")
				return;
			} else {
				mailData['email'] = $scope.mailNum;
			}
			if(!$scope.mailYzm){
				base.alert("请填写您的验证码")
				return;
			} else {
				mailData['captcha'] = $scope.mailYzm;
			}
			srv.headlogo(mailData,function(xhr){
				if(xhr.code == '0'){
					$scope.mailRec = false;
					$root.dosuccess();
				}else{
					$root.dofail();
				}
			})
		}
		$("#frontId").uploadify({
			'auto': true,
	        'swf': 'static/js/third/jqueryUplodify/uploadify.swf',
	        'uploader': 'http://192.168.2.119:8280/file/upload',//后台处理的请求
	        'queueID': 'fileQueue',//与下面的id对应
	        'fileTypeDesc': '图片格式',
	        'fileTypeExts': '*.jpg;*.jpeg;*.png', //控制可上传文件的扩展名，启用本项时需同时声明fileDesc
	        'method': 'POST',
	        'multi': true,
	        'buttonText': '上传文件',
	        'fileObjName': 'files',//服务端File对应的名称。
	        'height': 22,
            'width': 48,
	        /*'onUploadStart': function (file) {
	            console.log(file)
	        },*/
	        'onUploadSuccess': function (file, data, response) {
	            var dataObj = JSON.parse(data);
	            $scope.cardFront = dataObj.data[0].path;
	            var imgUrl = $root.globalImgPath + dataObj.data[0].path;
	            $("#frontIdPic").attr('src', imgUrl)
	        },
	        'onUploadError': function (file, errorCode, errorMsg, errorString) {
	            base.alert('当前文件：' + file.name + '上传失败，失败原因：' + errorString);
	        }
        });
		$("#backId").uploadify({
			'auto': true,
	        'swf': 'static/js/third/jqueryUplodify/uploadify.swf',
	        'uploader': 'http://192.168.2.119:8280/file/upload',//后台处理的请求
	        'queueID': 'fileQueue',//与下面的id对应
	        'fileTypeDesc': '图片格式',
	        'fileTypeExts': '*.jpg;*.jpeg;*.png', //控制可上传文件的扩展名，启用本项时需同时声明fileDesc
	        'method': 'POST',
	        'multi': true,
	        'buttonText': '上传文件',
	        'fileObjName': 'files',//服务端File对应的名称。
	        'height': 22,
            'width': 48,
	        'onUploadSuccess': function (file, data, response) {
	            var dataObj = JSON.parse(data)
	            $scope.cardReverse = dataObj.data[0].path;
	            var imgUrl = $root.globalImgPath + dataObj.data[0].path;
	            $("#backIdPic").attr('src', imgUrl)
	        },
	        'onUploadError': function (file, errorCode, errorMsg, errorString) {
	            base.alert('当前文件：' + file.name + '上传失败，失败原因：' + errorString);
	        }
        });
		$("#handId").uploadify({
			'auto': true,
	        'swf': 'static/js/third/jqueryUplodify/uploadify.swf',
	        'uploader': 'http://192.168.2.119:8280/file/upload',//后台处理的请求
	        'queueID': 'fileQueue',//与下面的id对应
	        'fileTypeDesc': '图片格式',
	        'fileTypeExts': '*.jpg;*.jpeg;*.png', //控制可上传文件的扩展名，启用本项时需同时声明fileDesc
	        'method': 'POST',
	        'multi': true,
	        'buttonText': '上传文件',
	        'fileObjName': 'files',//服务端File对应的名称。
	        'height': 22,
            'width': 48,
	        'onUploadSuccess': function (file, data, response) {
	            var dataObj = JSON.parse(data)
	            $scope.cardInHand = dataObj.data[0].path;
	            var imgUrl = $root.globalImgPath + dataObj.data[0].path;
	            $("#handIdPic").attr('src', imgUrl)
	        },
	        'onUploadError': function (file, errorCode, errorMsg, errorString) {
	            base.alert('当前文件：' + file.name + '上传失败，失败原因：' + errorString);
	        }
        });
		//实名认证提交信息
		$scope.infoRecSubmit = function(){
			// var userCreditInfo = encodeURIComponent(encodeURIComponent(ct.userCreditInfo));  +,%编码
			// 解码方法http://blog.csdn.net/li2327234939/article/details/53675211
			var namedata  = JSON.parse(JSON.stringify($root.params));
				namedata['method'] = 'com.shuige.sealsign.updateUserExt';
				namedata['authentication'] = '4';
			if (!$scope.loginName) {
				base.alert('请填写您的名字');
				return;
			} else {
				namedata['userName'] = $scope.loginName;
			}
			if (!$scope.loginIdnum || !base.isIdc($scope.loginIdnum)) {
				base.alert('请正确填写您的身份证号码');
				return;
			} else {
				namedata['idCard'] = $scope.loginIdnum;
			}
			if(!$scope.province){
				base.alert("请填写您所在省份")
				return;
			} else {
				namedata['provinceId'] = $scope.province;
			}
			if(!$scope.city){
				base.alert("请填写您所在城市")
				return;
			} else {
				namedata['cityId'] = $scope.city;
			}
			if(!$scope.county){
				base.alert("请填写您所在区/县")
				return;
			} else {
				namedata['countyId'] = $scope.county;
			}
			if(!$scope.detailAdd){
				base.alert("请填写您的详细地址")
				return;
			} else {
				namedata['address'] = $scope.detailAdd;
			}
			if(!$scope.cardFront){
				base.alert("请先上传身份证信息页照片")
				return;
			} else {
				namedata['cardFront'] = $scope.cardFront;
			}
			if(!$scope.cardReverse){
				base.alert("请先上传身份证国徽页照片")
				return;
			} else {
				namedata['cardReverse'] = $scope.cardReverse;
			}
			if(!$scope.cardInHand){
				base.alert("请先上传手持身份证照片")
				return;
			} else {
				namedata['cardInHand'] = $scope.cardInHand;
			}
			if (base.isDefined($scope.company))
				namedata['entName'] = $scope.company;
			if (base.isDefined($scope.job))
				namedata['positionName'] = $scope.job;
			srv.headlogo(namedata,function(xhr){
				if(xhr.code == '0'){
					$scope.realNameRec = false;
					$root.dosuccess();
				}else{
					$root.dofail();
				}
			})
		}
		
		getProvince();
		function getProvince(){
			var proData  = JSON.parse(JSON.stringify($root.params));
			proData['method'] = 'com.shuige.sealsign.getDicProvinceList';
			srv.headlogo(proData,function(xhr){
				if(xhr.code == '0'){
					$scope.proList = xhr.data;
				}else{
					base.alert('获取省份列表失败');
				}
			})
		}
		$scope.getCity = function(){
			$scope.city = '';
			$scope.county = '';
			$scope.detailAdd = '';
			getCity();
		}
		function getCity(){
			var cityData  = JSON.parse(JSON.stringify($root.params));
			cityData['method'] = 'com.shuige.sealsign.getDicCityList';
			cityData['provinceId'] = $scope.province;
			srv.headlogo(cityData,function(xhr){
				if(xhr.code == '0'){
					$scope.cityList = xhr.data;
				}else{
					$root.dofail();
				}
			})
		}
		$scope.getCountry = function(){
			$scope.county = '';
			$scope.detailAdd = '';
			getcoun();
		}
		function getcoun(){
			var counData  = JSON.parse(JSON.stringify($root.params));
			counData['method'] = 'com.shuige.sealsign.getDicCountyList';
			counData['provinceId'] = $scope.province;
			counData['cityId'] = $scope.city;
			srv.headlogo(counData,function(xhr){
				if(xhr.code == '0'){
					$scope.counList = xhr.data;
				}else{
					$root.dofail();
				}
			})
		}
		
	}
])
kry.controller('ctrl.person.msg', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '消息设置',
			menuKey: 'personMsg'
		});
		$scope.open = false;
		$scope.openM = false;
		loadRec();
		function loadRec(){
			var loaddata  = JSON.parse(JSON.stringify($root.params));
				loaddata['method'] = 'com.shuige.sealsign.selectUserExtVo';
				loaddata['strToken'] = $root.uid;
			srv.headlogo(loaddata,function(xhr){
				if(xhr.code == '0'){
					var msgFlg = xhr.data.msgFlag;
					if(msgFlg == '0'){
						$scope.open = false;
						$scope.openM = false;
					}else if(msgFlg == '1'){
						$scope.open = true;
						$scope.openM = false;
					}else if(msgFlg == '2'){
						$scope.open = false;
						$scope.openM = true;
					}else{
						$scope.open = true;
						$scope.openM = true;
					}
				}else{
					base.alert(xhr.msg);
				}
			})
		}
		$scope.openMsg = function(){
			var msgData  = JSON.parse(JSON.stringify($root.params));
			msgData['method'] = 'com.shuige.sealsign.updateUserExtMsgFlagBytoken';
			if($scope.open){
				$scope.open = false;
				msgData['messagepass'] = '0';
			}else{
				$scope.open = true;
				msgData['messagepass'] = '1';
			}
			if(!$scope.openM){
				msgData['mailpass'] = '0';
			}else{
				msgData['mailpass'] = '1';
			}
			srv.headlogo(msgData,function(xhr){
				if(xhr.code == '0'){
					$root.dosuccess();
				}else{
					$root.dofail();
				}
			})
		}
		$scope.openMail = function(){
			var mailData  = JSON.parse(JSON.stringify($root.params));
			mailData['method'] = 'com.shuige.sealsign.updateUserExtMsgFlagBytoken';
			if($scope.openM){
				$scope.openM = false;
				mailData['mailpass'] = '0';
			}else{
				$scope.openM = true;
				mailData['mailpass'] = '1';
			}
			if(!$scope.open){
				mailData['messagepass'] = '0';
			}else{
				mailData['messagepass'] = '1';
			}
			srv.headlogo(mailData,function(xhr){
				if(xhr.code == '0'){
					$root.dosuccess();
				}else{
					$root.dofail();
				}
			})
		}
	}
])
kry.controller('ctrl.person.safe', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '安全设置',
			menuKey: 'personSafe'
		});
		$scope.seted = true;
		$scope.password = false;
		$scope.signPsw = false;
		$scope.signPswCh = false;
		loadSignsta();
		function loadSignsta(){
			var loaddata  = JSON.parse(JSON.stringify($root.params));
				loaddata['method'] = 'com.shuige.sealsign.selectUserExtVo';
				loaddata['strToken'] = $root.uid;
			srv.headlogo(loaddata,function(xhr){
				if(xhr.code == '0'){
					var signstatus = xhr.data.signstatus;
					if(signstatus == '0'){
						$scope.seted = false;
					}else{
						$scope.seted = true;
					}
				}else{
					base.alert(xhr.msg);
				}
			})
		}
		$scope.passwordCh = function(){
			$scope.password = true;
			$scope.signPsw = false;
			$scope.signPswCh = false;
		};
		$scope.signPswSet = function(){
			$scope.signPsw = true;
			$scope.password = false;
			$scope.signPswCh = false;
		};
		$scope.signPswChange = function(){
			$scope.password = false;
			$scope.signPsw = false;
			$scope.signPswCh = true;
		};
		$scope.bindUkey = function(){
			$root.notopen();
		};
		$scope.setPsw = function(){
			var pswdata  = JSON.parse(JSON.stringify($root.params));
				pswdata['method'] = 'com.shuige.user.signmodifyPass';
			if(!$scope.prePsw){
				base.alert("请填写原密码")
				return;
			} else {
				pswdata['oldPassword'] = $scope.prePsw;
			}
			if(!$scope.newPsw){
				base.alert("请填写新密码")
				return;
			} else {
				pswdata['password'] = $scope.newPsw;
			}
			if(!$scope.confirmPsw){
				base.alert("请确认新密码")
				return;
			} else {
				if($scope.confirmPsw != $scope.newPsw){
					base.alert("确认密码与新密码不一致，请重新填写")
					$scope.confirmPsw = '';
					return;
				}
			}
			srv.headlogo(pswdata,function(xhr){
				if(xhr.code == '0'){
					$root.dosuccess();
				}else{
					$root.dofail();
				}
			})
		}
		$scope.setSignPsw = function(){
			var signdata  = JSON.parse(JSON.stringify($root.params));
				signdata['method'] = 'com.shuige.sealsign.updateSignPassWord';
			if(!$scope.setsignPsw){
				base.alert("请填写签署密码")
				return;
			} else {
				signdata['signPassword'] = $scope.setsignPsw;
			}
			if(!$scope.confirmSignPsw){
				base.alert("请确认签署密码")
				return;
			} else {
				if($scope.confirmSignPsw != $scope.signPsw){
					base.alert("确认密码与签署密码不一致，请重新填写")
					$scope.confirmSignPsw = '';
					return;
				}
			}
			srv.headlogo(signdata,function(xhr){
				if(xhr.code == '0'){
					$root.dosuccess();
				}else{
					$root.dofail();
				}
			})
		}
		$scope.resetSignPsw = function(){
			var resetSigndata  = JSON.parse(JSON.stringify($root.params));
				resetSigndata['method'] = 'com.shuige.sealsign.signPass';
			if(!$scope.presignPsw){
				base.alert("请填写原密码")
				return;
			} else {
				resetSigndata['oldPassword'] = $scope.presignPsw;
			}
			if(!$scope.newsignPsw){
				base.alert("请填写新密码")
				return;
			} else {
				resetSigndata['password'] = $scope.newsignPsw;
			}
			if(!$scope.confirmnewsignPsw){
				base.alert("请确认新密码")
				return;
			} else {
				if($scope.confirmnewsignPsw != $scope.newsignPsw){
					base.alert("确认密码与新密码不一致，请重新填写")
					$scope.confirmnewsignPsw = '';
					return;
				}else{
					resetSigndata['repassword'] = $scope.confirmnewsignPsw;
				}
			}
			srv.headlogo(resetSigndata,function(xhr){
				if(xhr.code == '0'){
					$root.dosuccess();
				}else{
					$root.dofail();
				}
			})
		}
	}
])
kry.controller('ctrl.person.sign', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '我的签名',
			menuKey: 'personSign'
		});
		
		$scope.fontChose = function(){
			$scope.fontChoose = !$scope.fontChoose;
		};
		loadsign();
		function loadsign(){
			var loaddata  = JSON.parse(JSON.stringify($root.params));
				loaddata['method'] = 'com.shuige.sealsign.getSignFileList';
				loaddata['strToken'] = $root.uid;
			srv.headlogo(loaddata,function(xhr){
				if(xhr.code == '0'){
	    			$scope.signlist = xhr.data;
//	    			for(var i=0;i<$scope.signlist.length;i++){
//	    				//$scope.fontChoose+i = false;
//	    			}
				}else{
					base.alert(xhr.msg);
				}
			})
		}
		$("#signUpload").uploadify({
			'auto': true,
	        'swf': 'static/js/third/jqueryUplodify/uploadify.swf',
	        'uploader': 'http://192.168.2.119:8280/file/upload',//后台处理的请求
	        'queueID': 'fileQueue',//与下面的id对应
	        'fileTypeDesc': '图片格式',
	        'fileTypeExts': '*.jpg;*.jpeg;*.png', //控制可上传文件的扩展名，启用本项时需同时声明fileDesc
	        'method': 'POST',
	        'multi': true,
	        'buttonText': '上传文件',
	        'fileObjName': 'files',//服务端File对应的名称。
	        'height': 22,
            'width': 48,
	        'onUploadSuccess': function (file, data, response) {
	            var dataObj = JSON.parse(data);
	            $scope.signpicUrl = dataObj.data[0].path;
	            var imgUrl = $root.globalImgPath + dataObj.data[0].path;
	            $("#signpic").attr('src', imgUrl)
				var upsigndata  = JSON.parse(JSON.stringify($root.params));
					upsigndata['method'] = 'com.shuige.sealsign.upUserSignPic';
					upsigndata['filePath'] = $scope.signpicUrl;
				srv.headlogo(upsigndata,function(xhr){
					if(xhr.code == '0'){
		    			$root.dosuccess();
					}else{
						base.alert(xhr.msg);
					}
				})
	        },
	        'onUploadError': function (file, errorCode, errorMsg, errorString) {
	            base.alert('当前文件：' + file.name + '上传失败，失败原因：' + errorString);
	        }
        });
		gethandCode();
		$scope.freshCode = function(){
			gethandCode();
		}
		function gethandCode(){
			var codedata  = JSON.parse(JSON.stringify($root.params));
				codedata['method'] = 'com.shuige.sealsign.getQRCodeContent';
			srv.headlogo(codedata,function(xhr){
				if(xhr.code == '0'){
	    			$scope.qrcode = xhr.data;
	    			$("#qrcode").qrcode({
						render: "table",
						width: 120,
						height:120,
						text: $scope.qrcode
					});
				}else{
					base.alert(xhr.msg);
				}
			})
		}
	}
])
kry.controller('ctrl.dialog.cloudfilelist', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '云文件签署弹窗',
			menuKey: 'index'
		});
		
	}
])
kry.controller('ctrl.dialog.modelfilelist', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '合同模板签署弹窗',
			menuKey: 'index'
		});
		
	}
])
kry.controller('ctrl.dialog.documentRank', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$root.setSite({
			title: '首页',
			menuKey: 'index'
		});
		
	}
])
kry.controller('ctrl.pageNavCtrl', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
		$('#red').smartpaginator({ 
			totalrecords: 320, 
			recordsperpage: 4, 
			length: 10, 
			next: '>', 
			prev: '<', 
			first: '首页', 
			last: '尾页', 
			theme: 'defined', 
			controlsalways: true, 
			onchange: function (newPage) {
				$scope.cliNav(newPage);
            }	
       })
	}
])
kry.controller('ctrl.fromDate', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
    	$(".fromdata").datepicker({ //添加日期选择功能    
    		numberOfMonths: 1, //显示几个月    
    		showButtonPanel: true, //是否显示按钮面板    
    		showClearButton: true,
    		changeMonth: false,
    		defaultDate: +1,
    		//   showWeek: true,   
    		howOn: "button", //borth 既可以触发按钮 又可以触发文本框 弹出 日历  如果是button 只能触发button事件    
    		buttonImageOnly: true, //设置这按钮只显示图片效果 不要有button的样式    
    		showAnim: "toggle", //弹出日历的效果  
    		buttonText: 'Choose',
    		hideIfNoPrevNext: true,
    		dateFormat: 'yy-mm-dd', //日期格式    
    		clearText: "清除", //清除日期的按钮名称    
    		closeText: "关闭", //关闭选择框的按钮名称    
    		yearSuffix: '年', //年的后缀    
    		showMonthAfterYear: true, //是否把月放在年的后面    
    		//defaultDate: '2013-03-10', //默认日期    
    		minDate: '2014-01-01', //最小日期    
    		maxDate: '2024-12-31', //最大日期    
    		onSelect: function(selectedDate) {
    			//$scope.fromDate = selectedDate;
    			$(".enddata").datepicker("option", "minDate", new Date(selectedDate.replace(/-/g, ','))); //结束时间可选最小值为选中值  
    		}
    	});
	}
])
kry.controller('ctrl.endDate', [
	'$scope',
	'$rootScope',
	'$location',
	'$compile',
	'ngDialog',
	'srv',
	'base',
	function(
		$scope,
		$root,
		$location,
		$compile,
		dialog,
		srv,
		base
	) {
    	$(".enddata").datepicker({ //添加日期选择功能    
    		numberOfMonths: 1, //显示几个月    
    		showButtonPanel: true, //是否显示按钮面板    
    		showClearButton: true,
    		changeMonth: false,
    		defaultDate: +1,
    		// showWeek: true,   
    		howOn: "button", //borth 既可以触发按钮 又可以触发文本框 弹出 日历  如果是button 只能触发button事件    
    		buttonImageOnly: true, //设置这按钮只显示图片效果 不要有button的样式    
    		showAnim: "toggle", //弹出日历的效果  
    		buttonText: 'Choose',
    		hideIfNoPrevNext: true,
    		dateFormat: 'yy-mm-dd', //日期格式    
    		clearText: "清除", //清除日期的按钮名称    
    		closeText: "关闭", //关闭选择框的按钮名称    
    		yearSuffix: '年', //年的后缀    
    		showMonthAfterYear: true, //是否把月放在年的后面    
    		//defaultDate: '2013-03-10', //默认日期    
    		minDate: '2014-01-01', //最小日期    
    		maxDate: '2024-12-31', //最大日期    
    		onSelect: function(selectedDate) {
    			//$scope.endDate = selectedDate;
    			$(".fromdata").datepicker("option", "maxDate", new Date(selectedDate.replace(/-/g, ','))); //起始时间可选最大值为选中值  
    		}
    	});
	}
])

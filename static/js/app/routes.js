/**
 * 路由文件
 */
var routes = {
	prefix: 'templates/',
	namespace: 'ctrl.',
	map: {
		'/': 'index',
		'/index': 'index',
		'/signMe': 'main.signMe',
		'/signOther': 'main.signOther',
		'/signFinish': 'main.signFinish',
		'/docBack': 'main.docBack',
		'/drafts': 'main.drafts',
		'/personInfo': 'person.info'
	}
}

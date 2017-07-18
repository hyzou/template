/*
 * JQuery zTree core v3.5.29
 * http://treejs.cn/
 *
 * Copyright (c) 2010 Hunter.z
 *
 * Licensed same as jquery - MIT License
 * http://www.opensource.org/licenses/mit-license.php
 *
 * email: hunter.z@263.net
 * Date: 2017-06-19
 */
(function(r) {
	var I, J, K, L, M, N, v, s = {},
		w = {},
		x = {},
		O = {
			treeId: "",
			treeObj: null,
			view: {
				addDiyDom: null,
				autoCancelSelected: !0,
				dblClickExpand: !0,
				expandSpeed: "fast",
				fontCss: {},
				nameIsHTML: !1,
				selectedMulti: !0,
				showIcon: !0,
				showLine: !0,
				showTitle: !0,
				txtSelectedEnable: !1
			},
			data: {
				key: {
					children: "children",
					name: "name",
					title: "",
					url: "url",
					icon: "icon"
				},
				simpleData: {
					enable: !1,
					idKey: "id",
					pIdKey: "pId",
					rootPId: null
				},
				keep: {
					parent: !1,
					leaf: !1
				}
			},
			async: {
				enable: !1,
				contentType: "application/x-www-form-urlencoded",
				type: "post",
				dataType: "text",
				url: "",
				autoParam: [],
				otherParam: [],
				dataFilter: null
			},
			callback: {
				beforeAsync: null,
				beforeClick: null,
				beforeDblClick: null,
				beforeRightClick: null,
				beforeMouseDown: null,
				beforeMouseUp: null,
				beforeExpand: null,
				beforeCollapse: null,
				beforeRemove: null,
				onAsyncError: null,
				onAsyncSuccess: null,
				onNodeCreated: null,
				onClick: null,
				onDblClick: null,
				onRightClick: null,
				onMouseDown: null,
				onMouseUp: null,
				onExpand: null,
				onCollapse: null,
				onRemove: null
			}
		},
		y = [function(b) {
			var a = b.treeObj,
				c = f.event;
			a.bind(c.NODECREATED, function(a, c, g) {
				j.apply(b.callback.onNodeCreated, [a, c, g])
			});
			a.bind(c.CLICK, function(a, c, g, k, h) {
				j.apply(b.callback.onClick, [c, g, k, h])
			});
			a.bind(c.EXPAND, function(a, c, g) {
				j.apply(b.callback.onExpand, [a, c, g])
			});
			a.bind(c.COLLAPSE, function(a, c, g) {
				j.apply(b.callback.onCollapse, [a, c, g])
			});
			a.bind(c.ASYNC_SUCCESS, function(a, c, g, k) {
				j.apply(b.callback.onAsyncSuccess, [a, c, g, k])
			});
			a.bind(c.ASYNC_ERROR, function(a, c, g, k, h, f) {
				j.apply(b.callback.onAsyncError, [a, c, g, k, h, f])
			});
			a.bind(c.REMOVE, function(a, c, g) {
				j.apply(b.callback.onRemove, [a, c, g])
			});
			a.bind(c.SELECTED,
				function(a, c, g) {
					j.apply(b.callback.onSelected, [c, g])
				});
			a.bind(c.UNSELECTED, function(a, c, g) {
				j.apply(b.callback.onUnSelected, [c, g])
			})
		}],
		z = [function(b) {
			var a = f.event;
			b.treeObj.unbind(a.NODECREATED).unbind(a.CLICK).unbind(a.EXPAND).unbind(a.COLLAPSE).unbind(a.ASYNC_SUCCESS).unbind(a.ASYNC_ERROR).unbind(a.REMOVE).unbind(a.SELECTED).unbind(a.UNSELECTED)
		}],
		A = [function(b) {
			var a = h.getCache(b);
			a || (a = {}, h.setCache(b, a));
			a.nodes = [];
			a.doms = []
		}],
		B = [function(b, a, c, d, e, g) {
			if(c) {
				var k = h.getRoot(b),
					f = b.data.key.children;
				c.level = a;
				c.tId = b.treeId + "_" + ++k.zId;
				c.parentTId = d ? d.tId : null;
				c.open = typeof c.open == "string" ? j.eqs(c.open, "true") : !!c.open;
				c[f] && c[f].length > 0 ? (c.isParent = !0, c.zAsync = !0) : (c.isParent = typeof c.isParent == "string" ? j.eqs(c.isParent, "true") : !!c.isParent, c.open = c.isParent && !b.async.enable ? c.open : !1, c.zAsync = !c.isParent);
				c.isFirstNode = e;
				c.isLastNode = g;
				c.getParentNode = function() {
					return h.getNodeCache(b, c.parentTId)
				};
				c.getPreNode = function() {
					return h.getPreNode(b, c)
				};
				c.getNextNode = function() {
					return h.getNextNode(b,
						c)
				};
				c.getIndex = function() {
					return h.getNodeIndex(b, c)
				};
				c.getPath = function() {
					return h.getNodePath(b, c)
				};
				c.isAjaxing = !1;
				h.fixPIdKeyValue(b, c)
			}
		}],
		u = [function(b) {
			var a = b.target,
				c = h.getSetting(b.data.treeId),
				d = "",
				e = null,
				g = "",
				k = "",
				p = null,
				i = null,
				q = null;
			if(j.eqs(b.type, "mousedown")) k = "mousedown";
			else if(j.eqs(b.type, "mouseup")) k = "mouseup";
			else if(j.eqs(b.type, "contextmenu")) k = "contextmenu";
			else if(j.eqs(b.type, "click"))
				if(j.eqs(a.tagName, "span") && a.getAttribute("treeNode" + f.id.SWITCH) !== null) d = j.getNodeMainDom(a).id,
					g = "switchNode";
				else {
					if(q = j.getMDom(c, a, [{
							tagName: "a",
							attrName: "treeNode" + f.id.A
						}])) d = j.getNodeMainDom(q).id, g = "clickNode"
				}
			else if(j.eqs(b.type, "dblclick") && (k = "dblclick", q = j.getMDom(c, a, [{
					tagName: "a",
					attrName: "treeNode" + f.id.A
				}]))) d = j.getNodeMainDom(q).id, g = "switchNode";
			if(k.length > 0 && d.length == 0 && (q = j.getMDom(c, a, [{
					tagName: "a",
					attrName: "treeNode" + f.id.A
				}]))) d = j.getNodeMainDom(q).id;
			if(d.length > 0) switch(e = h.getNodeCache(c, d), g) {
				case "switchNode":
					e.isParent ? j.eqs(b.type, "click") || j.eqs(b.type, "dblclick") &&
						j.apply(c.view.dblClickExpand, [c.treeId, e], c.view.dblClickExpand) ? p = I : g = "" : g = "";
					break;
				case "clickNode":
					p = J
			}
			switch(k) {
				case "mousedown":
					i = K;
					break;
				case "mouseup":
					i = L;
					break;
				case "dblclick":
					i = M;
					break;
				case "contextmenu":
					i = N
			}
			return {
				stop: !1,
				node: e,
				nodeEventType: g,
				nodeEventCallback: p,
				treeEventType: k,
				treeEventCallback: i
			}
		}],
		C = [function(b) {
			var a = h.getRoot(b);
			a || (a = {}, h.setRoot(b, a));
			a[b.data.key.children] = [];
			a.expandTriggerFlag = !1;
			a.curSelectedList = [];
			a.noSelection = !0;
			a.createdNodes = [];
			a.zId = 0;
			a._ver = (new Date).getTime()
		}],
		D = [],
		E = [],
		F = [],
		G = [],
		H = [],
		h = {
			addNodeCache: function(b, a) {
				h.getCache(b).nodes[h.getNodeCacheId(a.tId)] = a
			},
			getNodeCacheId: function(b) {
				return b.substring(b.lastIndexOf("_") + 1)
			},
			addAfterA: function(b) {
				E.push(b)
			},
			addBeforeA: function(b) {
				D.push(b)
			},
			addInnerAfterA: function(b) {
				G.push(b)
			},
			addInnerBeforeA: function(b) {
				F.push(b)
			},
			addInitBind: function(b) {
				y.push(b)
			},
			addInitUnBind: function(b) {
				z.push(b)
			},
			addInitCache: function(b) {
				A.push(b)
			},
			addInitNode: function(b) {
				B.push(b)
			},
			addInitProxy: function(b, a) {
				a ? u.splice(0, 0,
					b) : u.push(b)
			},
			addInitRoot: function(b) {
				C.push(b)
			},
			addNodesData: function(b, a, c, d) {
				var e = b.data.key.children;
				a[e] ? c >= a[e].length && (c = -1) : (a[e] = [], c = -1);
				if(a[e].length > 0 && c === 0) a[e][0].isFirstNode = !1, i.setNodeLineIcos(b, a[e][0]);
				else if(a[e].length > 0 && c < 0) a[e][a[e].length - 1].isLastNode = !1, i.setNodeLineIcos(b, a[e][a[e].length - 1]);
				a.isParent = !0;
				c < 0 ? a[e] = a[e].concat(d) : (b = [c, 0].concat(d), a[e].splice.apply(a[e], b))
			},
			addSelectedNode: function(b, a) {
				var c = h.getRoot(b);
				h.isSelectedNode(b, a) || c.curSelectedList.push(a)
			},
			addCreatedNode: function(b, a) {
				(b.callback.onNodeCreated || b.view.addDiyDom) && h.getRoot(b).createdNodes.push(a)
			},
			addZTreeTools: function(b) {
				H.push(b)
			},
			exSetting: function(b) {
				r.extend(!0, O, b)
			},
			fixPIdKeyValue: function(b, a) {
				b.data.simpleData.enable && (a[b.data.simpleData.pIdKey] = a.parentTId ? a.getParentNode()[b.data.simpleData.idKey] : b.data.simpleData.rootPId)
			},
			getAfterA: function(b, a, c) {
				for(var d = 0, e = E.length; d < e; d++) E[d].apply(this, arguments)
			},
			getBeforeA: function(b, a, c) {
				for(var d = 0, e = D.length; d < e; d++) D[d].apply(this,
					arguments)
			},
			getInnerAfterA: function(b, a, c) {
				for(var d = 0, e = G.length; d < e; d++) G[d].apply(this, arguments)
			},
			getInnerBeforeA: function(b, a, c) {
				for(var d = 0, e = F.length; d < e; d++) F[d].apply(this, arguments)
			},
			getCache: function(b) {
				return x[b.treeId]
			},
			getNodeIndex: function(b, a) {
				if(!a) return null;
				for(var c = b.data.key.children, d = a.parentTId ? a.getParentNode() : h.getRoot(b), e = 0, g = d[c].length - 1; e <= g; e++)
					if(d[c][e] === a) return e;
				return -1
			},
			getNextNode: function(b, a) {
				if(!a) return null;
				for(var c = b.data.key.children, d = a.parentTId ?
						a.getParentNode() : h.getRoot(b), e = 0, g = d[c].length - 1; e <= g; e++)
					if(d[c][e] === a) return e == g ? null : d[c][e + 1];
				return null
			},
			getNodeByParam: function(b, a, c, d) {
				if(!a || !c) return null;
				for(var e = b.data.key.children, g = 0, k = a.length; g < k; g++) {
					if(a[g][c] == d) return a[g];
					var f = h.getNodeByParam(b, a[g][e], c, d);
					if(f) return f
				}
				return null
			},
			getNodeCache: function(b, a) {
				if(!a) return null;
				var c = x[b.treeId].nodes[h.getNodeCacheId(a)];
				return c ? c : null
			},
			getNodeName: function(b, a) {
				return "" + a[b.data.key.name]
			},
			getNodePath: function(b, a) {
				if(!a) return null;
				var c;
				(c = a.parentTId ? a.getParentNode().getPath() : []) && c.push(a);
				return c
			},
			getNodeTitle: function(b, a) {
				return "" + a[b.data.key.title === "" ? b.data.key.name : b.data.key.title]
			},
			getNodes: function(b) {
				return h.getRoot(b)[b.data.key.children]
			},
			getNodesByParam: function(b, a, c, d) {
				if(!a || !c) return [];
				for(var e = b.data.key.children, g = [], k = 0, f = a.length; k < f; k++) a[k][c] == d && g.push(a[k]), g = g.concat(h.getNodesByParam(b, a[k][e], c, d));
				return g
			},
			getNodesByParamFuzzy: function(b, a, c, d) {
				if(!a || !c) return [];
				for(var e = b.data.key.children,
						g = [], d = d.toLowerCase(), k = 0, f = a.length; k < f; k++) typeof a[k][c] == "string" && a[k][c].toLowerCase().indexOf(d) > -1 && g.push(a[k]), g = g.concat(h.getNodesByParamFuzzy(b, a[k][e], c, d));
				return g
			},
			getNodesByFilter: function(b, a, c, d, e) {
				if(!a) return d ? null : [];
				for(var g = b.data.key.children, k = d ? null : [], f = 0, i = a.length; f < i; f++) {
					if(j.apply(c, [a[f], e], !1)) {
						if(d) return a[f];
						k.push(a[f])
					}
					var q = h.getNodesByFilter(b, a[f][g], c, d, e);
					if(d && q) return q;
					k = d ? q : k.concat(q)
				}
				return k
			},
			getPreNode: function(b, a) {
				if(!a) return null;
				for(var c =
						b.data.key.children, d = a.parentTId ? a.getParentNode() : h.getRoot(b), e = 0, g = d[c].length; e < g; e++)
					if(d[c][e] === a) return e == 0 ? null : d[c][e - 1];
				return null
			},
			getRoot: function(b) {
				return b ? w[b.treeId] : null
			},
			getRoots: function() {
				return w
			},
			getSetting: function(b) {
				return s[b]
			},
			getSettings: function() {
				return s
			},
			getZTreeTools: function(b) {
				return(b = this.getRoot(this.getSetting(b))) ? b.treeTools : null
			},
			initCache: function(b) {
				for(var a = 0, c = A.length; a < c; a++) A[a].apply(this, arguments)
			},
			initNode: function(b, a, c, d, e, g) {
				for(var k =
						0, f = B.length; k < f; k++) B[k].apply(this, arguments)
			},
			initRoot: function(b) {
				for(var a = 0, c = C.length; a < c; a++) C[a].apply(this, arguments)
			},
			isSelectedNode: function(b, a) {
				for(var c = h.getRoot(b), d = 0, e = c.curSelectedList.length; d < e; d++)
					if(a === c.curSelectedList[d]) return !0;
				return !1
			},
			removeNodeCache: function(b, a) {
				var c = b.data.key.children;
				if(a[c])
					for(var d = 0, e = a[c].length; d < e; d++) h.removeNodeCache(b, a[c][d]);
				h.getCache(b).nodes[h.getNodeCacheId(a.tId)] = null
			},
			removeSelectedNode: function(b, a) {
				for(var c = h.getRoot(b),
						d = 0, e = c.curSelectedList.length; d < e; d++)
					if(a === c.curSelectedList[d] || !h.getNodeCache(b, c.curSelectedList[d].tId)) c.curSelectedList.splice(d, 1), b.treeObj.trigger(f.event.UNSELECTED, [b.treeId, a]), d--, e--
			},
			setCache: function(b, a) {
				x[b.treeId] = a
			},
			setRoot: function(b, a) {
				w[b.treeId] = a
			},
			setZTreeTools: function(b, a) {
				for(var c = 0, d = H.length; c < d; c++) H[c].apply(this, arguments)
			},
			transformToArrayFormat: function(b, a) {
				if(!a) return [];
				var c = b.data.key.children,
					d = [];
				if(j.isArray(a))
					for(var e = 0, g = a.length; e < g; e++) d.push(a[e]),
						a[e][c] && (d = d.concat(h.transformToArrayFormat(b, a[e][c])));
				else d.push(a), a[c] && (d = d.concat(h.transformToArrayFormat(b, a[c])));
				return d
			},
			transformTozTreeFormat: function(b, a) {
				var c, d, e = b.data.simpleData.idKey,
					g = b.data.simpleData.pIdKey,
					k = b.data.key.children;
				if(!e || e == "" || !a) return [];
				if(j.isArray(a)) {
					var f = [],
						h = {};
					for(c = 0, d = a.length; c < d; c++) h[a[c][e]] = a[c];
					for(c = 0, d = a.length; c < d; c++) h[a[c][g]] && a[c][e] != a[c][g] ? (h[a[c][g]][k] || (h[a[c][g]][k] = []), h[a[c][g]][k].push(a[c])) : f.push(a[c]);
					return f
				} else return [a]
			}
		},
		m = {
			bindEvent: function(b) {
				for(var a = 0, c = y.length; a < c; a++) y[a].apply(this, arguments)
			},
			unbindEvent: function(b) {
				for(var a = 0, c = z.length; a < c; a++) z[a].apply(this, arguments)
			},
			bindTree: function(b) {
				var a = {
						treeId: b.treeId
					},
					c = b.treeObj;
				b.view.txtSelectedEnable || c.bind("selectstart", v).css({
					"-moz-user-select": "-moz-none"
				});
				c.bind("click", a, m.proxy);
				c.bind("dblclick", a, m.proxy);
				c.bind("mouseover", a, m.proxy);
				c.bind("mouseout", a, m.proxy);
				c.bind("mousedown", a, m.proxy);
				c.bind("mouseup", a, m.proxy);
				c.bind("contextmenu",
					a, m.proxy)
			},
			unbindTree: function(b) {
				b.treeObj.unbind("selectstart", v).unbind("click", m.proxy).unbind("dblclick", m.proxy).unbind("mouseover", m.proxy).unbind("mouseout", m.proxy).unbind("mousedown", m.proxy).unbind("mouseup", m.proxy).unbind("contextmenu", m.proxy)
			},
			doProxy: function(b) {
				for(var a = [], c = 0, d = u.length; c < d; c++) {
					var e = u[c].apply(this, arguments);
					a.push(e);
					if(e.stop) break
				}
				return a
			},
			proxy: function(b) {
				var a = h.getSetting(b.data.treeId);
				if(!j.uCanDo(a, b)) return !0;
				for(var a = m.doProxy(b), c = !0, d = 0, e = a.length; d <
					e; d++) {
					var g = a[d];
					g.nodeEventCallback && (c = g.nodeEventCallback.apply(g, [b, g.node]) && c);
					g.treeEventCallback && (c = g.treeEventCallback.apply(g, [b, g.node]) && c)
				}
				return c
			}
		};
	I = function(b, a) {
		var c = h.getSetting(b.data.treeId);
		if(a.open) {
			if(j.apply(c.callback.beforeCollapse, [c.treeId, a], !0) == !1) return !0
		} else if(j.apply(c.callback.beforeExpand, [c.treeId, a], !0) == !1) return !0;
		h.getRoot(c).expandTriggerFlag = !0;
		i.switchNode(c, a);
		return !0
	};
	J = function(b, a) {
		var c = h.getSetting(b.data.treeId),
			d = c.view.autoCancelSelected &&
			(b.ctrlKey || b.metaKey) && h.isSelectedNode(c, a) ? 0 : c.view.autoCancelSelected && (b.ctrlKey || b.metaKey) && c.view.selectedMulti ? 2 : 1;
		if(j.apply(c.callback.beforeClick, [c.treeId, a, d], !0) == !1) return !0;
		d === 0 ? i.cancelPreSelectedNode(c, a) : i.selectNode(c, a, d === 2);
		c.treeObj.trigger(f.event.CLICK, [b, c.treeId, a, d]);
		return !0
	};
	K = function(b, a) {
		var c = h.getSetting(b.data.treeId);
		j.apply(c.callback.beforeMouseDown, [c.treeId, a], !0) && j.apply(c.callback.onMouseDown, [b, c.treeId, a]);
		return !0
	};
	L = function(b, a) {
		var c = h.getSetting(b.data.treeId);
		j.apply(c.callback.beforeMouseUp, [c.treeId, a], !0) && j.apply(c.callback.onMouseUp, [b, c.treeId, a]);
		return !0
	};
	M = function(b, a) {
		var c = h.getSetting(b.data.treeId);
		j.apply(c.callback.beforeDblClick, [c.treeId, a], !0) && j.apply(c.callback.onDblClick, [b, c.treeId, a]);
		return !0
	};
	N = function(b, a) {
		var c = h.getSetting(b.data.treeId);
		j.apply(c.callback.beforeRightClick, [c.treeId, a], !0) && j.apply(c.callback.onRightClick, [b, c.treeId, a]);
		return typeof c.callback.onRightClick != "function"
	};
	v = function(b) {
		b = b.originalEvent.srcElement.nodeName.toLowerCase();
		return b === "input" || b === "textarea"
	};
	var j = {
			apply: function(b, a, c) {
				return typeof b == "function" ? b.apply(P, a ? a : []) : c
			},
			canAsync: function(b, a) {
				var c = b.data.key.children;
				return b.async.enable && a && a.isParent && !(a.zAsync || a[c] && a[c].length > 0)
			},
			clone: function(b) {
				if(b === null) return null;
				var a = j.isArray(b) ? [] : {},
					c;
				for(c in b) a[c] = b[c] instanceof Date ? new Date(b[c].getTime()) : typeof b[c] === "object" ? j.clone(b[c]) : b[c];
				return a
			},
			eqs: function(b, a) {
				return b.toLowerCase() === a.toLowerCase()
			},
			isArray: function(b) {
				return Object.prototype.toString.apply(b) ===
					"[object Array]"
			},
			isElement: function(b) {
				return typeof HTMLElement === "object" ? b instanceof HTMLElement : b && typeof b === "object" && b !== null && b.nodeType === 1 && typeof b.nodeName === "string"
			},
			$: function(b, a, c) {
				a && typeof a != "string" && (c = a, a = "");
				return typeof b == "string" ? r(b, c ? c.treeObj.get(0).ownerDocument : null) : r("#" + b.tId + a, c ? c.treeObj : null)
			},
			getMDom: function(b, a, c) {
				if(!a) return null;
				for(; a && a.id !== b.treeId;) {
					for(var d = 0, e = c.length; a.tagName && d < e; d++)
						if(j.eqs(a.tagName, c[d].tagName) && a.getAttribute(c[d].attrName) !==
							null) return a;
					a = a.parentNode
				}
				return null
			},
			getNodeMainDom: function(b) {
				return r(b).parent("li").get(0) || r(b).parentsUntil("li").parent().get(0)
			},
			isChildOrSelf: function(b, a) {
				return r(b).closest("#" + a).length > 0
			},
			uCanDo: function() {
				return !0
			}
		},
		i = {
			addNodes: function(b, a, c, d, e) {
				if(!b.data.keep.leaf || !a || a.isParent)
					if(j.isArray(d) || (d = [d]), b.data.simpleData.enable && (d = h.transformTozTreeFormat(b, d)), a) {
						var g = l(a, f.id.SWITCH, b),
							k = l(a, f.id.ICON, b),
							p = l(a, f.id.UL, b);
						if(!a.open) i.replaceSwitchClass(a, g, f.folder.CLOSE),
							i.replaceIcoClass(a, k, f.folder.CLOSE), a.open = !1, p.css({
								display: "none"
							});
						h.addNodesData(b, a, c, d);
						i.createNodes(b, a.level + 1, d, a, c);
						e || i.expandCollapseParentNode(b, a, !0)
					} else h.addNodesData(b, h.getRoot(b), c, d), i.createNodes(b, 0, d, null, c)
			},
			appendNodes: function(b, a, c, d, e, g, k) {
				if(!c) return [];
				var f = [],
					j = b.data.key.children,
					q = (d ? d : h.getRoot(b))[j],
					l, Q;
				if(!q || e >= q.length - c.length) e = -1;
				for(var t = 0, m = c.length; t < m; t++) {
					var o = c[t];
					g && (l = (e === 0 || q.length == c.length) && t == 0, Q = e < 0 && t == c.length - 1, h.initNode(b, a, o, d,
						l, Q, k), h.addNodeCache(b, o));
					l = [];
					o[j] && o[j].length > 0 && (l = i.appendNodes(b, a + 1, o[j], o, -1, g, k && o.open));
					k && (i.makeDOMNodeMainBefore(f, b, o), i.makeDOMNodeLine(f, b, o), h.getBeforeA(b, o, f), i.makeDOMNodeNameBefore(f, b, o), h.getInnerBeforeA(b, o, f), i.makeDOMNodeIcon(f, b, o), h.getInnerAfterA(b, o, f), i.makeDOMNodeNameAfter(f, b, o), h.getAfterA(b, o, f), o.isParent && o.open && i.makeUlHtml(b, o, f, l.join("")), i.makeDOMNodeMainAfter(f, b, o), h.addCreatedNode(b, o))
				}
				return f
			},
			appendParentULDom: function(b, a) {
				var c = [],
					d = l(a, b);
				!d.get(0) &&
					a.parentTId && (i.appendParentULDom(b, a.getParentNode()), d = l(a, b));
				var e = l(a, f.id.UL, b);
				e.get(0) && e.remove();
				e = i.appendNodes(b, a.level + 1, a[b.data.key.children], a, -1, !1, !0);
				i.makeUlHtml(b, a, c, e.join(""));
				d.append(c.join(""))
			},
			asyncNode: function(b, a, c, d) {
				var e, g;
				if(a && !a.isParent) return j.apply(d), !1;
				else if(a && a.isAjaxing) return !1;
				else if(j.apply(b.callback.beforeAsync, [b.treeId, a], !0) == !1) return j.apply(d), !1;
				if(a) a.isAjaxing = !0, l(a, f.id.ICON, b).attr({
					style: "",
					"class": f.className.BUTTON + " " + f.className.ICO_LOADING
				});
				var k = {};
				for(e = 0, g = b.async.autoParam.length; a && e < g; e++) {
					var p = b.async.autoParam[e].split("="),
						n = p;
					p.length > 1 && (n = p[1], p = p[0]);
					k[n] = a[p]
				}
				if(j.isArray(b.async.otherParam))
					for(e = 0, g = b.async.otherParam.length; e < g; e += 2) k[b.async.otherParam[e]] = b.async.otherParam[e + 1];
				else
					for(var q in b.async.otherParam) k[q] = b.async.otherParam[q];
				var m = h.getRoot(b)._ver;
				r.ajax({
					contentType: b.async.contentType,
					cache: !1,
					type: b.async.type,
					url: j.apply(b.async.url, [b.treeId, a], b.async.url),
					data: b.async.contentType.indexOf("application/json") >
						-1 ? JSON.stringify(k) : k,
					dataType: b.async.dataType,
					success: function(g) {
						if(m == h.getRoot(b)._ver) {
							var e = [];
							try {
								e = !g || g.length == 0 ? [] : typeof g == "string" ? eval("(" + g + ")") : g
							} catch(k) {
								e = g
							}
							if(a) a.isAjaxing = null, a.zAsync = !0;
							i.setNodeLineIcos(b, a);
							e && e !== "" ? (e = j.apply(b.async.dataFilter, [b.treeId, a, e], e), i.addNodes(b, a, -1, e ? j.clone(e) : [], !!c)) : i.addNodes(b, a, -1, [], !!c);
							b.treeObj.trigger(f.event.ASYNC_SUCCESS, [b.treeId, a, g]);
							j.apply(d)
						}
					},
					error: function(c, d, g) {
						if(m == h.getRoot(b)._ver) {
							if(a) a.isAjaxing = null;
							i.setNodeLineIcos(b,
								a);
							b.treeObj.trigger(f.event.ASYNC_ERROR, [b.treeId, a, c, d, g])
						}
					}
				});
				return !0
			},
			cancelPreSelectedNode: function(b, a, c) {
				var d = h.getRoot(b).curSelectedList,
					e, g;
				for(e = d.length - 1; e >= 0; e--)
					if(g = d[e], a === g || !a && (!c || c !== g))
						if(l(g, f.id.A, b).removeClass(f.node.CURSELECTED), a) {
							h.removeSelectedNode(b, a);
							break
						} else d.splice(e, 1), b.treeObj.trigger(f.event.UNSELECTED, [b.treeId, g])
			},
			createNodeCallback: function(b) {
				if(b.callback.onNodeCreated || b.view.addDiyDom)
					for(var a = h.getRoot(b); a.createdNodes.length > 0;) {
						var c = a.createdNodes.shift();
						j.apply(b.view.addDiyDom, [b.treeId, c]);
						b.callback.onNodeCreated && b.treeObj.trigger(f.event.NODECREATED, [b.treeId, c])
					}
			},
			createNodes: function(b, a, c, d, e) {
				if(c && c.length != 0) {
					var g = h.getRoot(b),
						k = b.data.key.children,
						k = !d || d.open || !!l(d[k][0], b).get(0);
					g.createdNodes = [];
					var a = i.appendNodes(b, a, c, d, e, !0, k),
						j, n;
					d ? (d = l(d, f.id.UL, b), d.get(0) && (j = d)) : j = b.treeObj;
					j && (e >= 0 && (n = j.children()[e]), e >= 0 && n ? r(n).before(a.join("")) : j.append(a.join("")));
					i.createNodeCallback(b)
				}
			},
			destroy: function(b) {
				b && (h.initCache(b),
					h.initRoot(b), m.unbindTree(b), m.unbindEvent(b), b.treeObj.empty(), delete s[b.treeId])
			},
			expandCollapseNode: function(b, a, c, d, e) {
				var g = h.getRoot(b),
					k = b.data.key.children,
					p;
				if(a) {
					if(g.expandTriggerFlag) p = e, e = function() {
						p && p();
						a.open ? b.treeObj.trigger(f.event.EXPAND, [b.treeId, a]) : b.treeObj.trigger(f.event.COLLAPSE, [b.treeId, a])
					}, g.expandTriggerFlag = !1;
					if(!a.open && a.isParent && (!l(a, f.id.UL, b).get(0) || a[k] && a[k].length > 0 && !l(a[k][0], b).get(0))) i.appendParentULDom(b, a), i.createNodeCallback(b);
					if(a.open == c) j.apply(e, []);
					else {
						var c = l(a, f.id.UL, b),
							g = l(a, f.id.SWITCH, b),
							n = l(a, f.id.ICON, b);
						a.isParent ? (a.open = !a.open, a.iconOpen && a.iconClose && n.attr("style", i.makeNodeIcoStyle(b, a)), a.open ? (i.replaceSwitchClass(a, g, f.folder.OPEN), i.replaceIcoClass(a, n, f.folder.OPEN), d == !1 || b.view.expandSpeed == "" ? (c.show(), j.apply(e, [])) : a[k] && a[k].length > 0 ? c.slideDown(b.view.expandSpeed, e) : (c.show(), j.apply(e, []))) : (i.replaceSwitchClass(a, g, f.folder.CLOSE), i.replaceIcoClass(a, n, f.folder.CLOSE), d == !1 || b.view.expandSpeed == "" || !(a[k] &&
							a[k].length > 0) ? (c.hide(), j.apply(e, [])) : c.slideUp(b.view.expandSpeed, e))) : j.apply(e, [])
					}
				} else j.apply(e, [])
			},
			expandCollapseParentNode: function(b, a, c, d, e) {
				a && (a.parentTId ? (i.expandCollapseNode(b, a, c, d), a.parentTId && i.expandCollapseParentNode(b, a.getParentNode(), c, d, e)) : i.expandCollapseNode(b, a, c, d, e))
			},
			expandCollapseSonNode: function(b, a, c, d, e) {
				var g = h.getRoot(b),
					f = b.data.key.children,
					g = a ? a[f] : g[f],
					f = a ? !1 : d,
					j = h.getRoot(b).expandTriggerFlag;
				h.getRoot(b).expandTriggerFlag = !1;
				if(g)
					for(var n = 0, l = g.length; n <
						l; n++) g[n] && i.expandCollapseSonNode(b, g[n], c, f);
				h.getRoot(b).expandTriggerFlag = j;
				i.expandCollapseNode(b, a, c, d, e)
			},
			isSelectedNode: function(b, a) {
				if(!a) return !1;
				var c = h.getRoot(b).curSelectedList,
					d;
				for(d = c.length - 1; d >= 0; d--)
					if(a === c[d]) return !0;
				return !1
			},
			makeDOMNodeIcon: function(b, a, c) {
				var d = h.getNodeName(a, c),
					d = a.view.nameIsHTML ? d : d.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
				b.push("<span id='", c.tId, f.id.ICON, "' title='' treeNode", f.id.ICON, " class='", i.makeNodeIcoClass(a, c), "' style='",
					i.makeNodeIcoStyle(a, c), "'></span><span id='", c.tId, f.id.SPAN, "' class='", f.className.NAME, "'>", d, "</span>")
			},
			makeDOMNodeLine: function(b, a, c) {
				b.push("<span id='", c.tId, f.id.SWITCH, "' title='' class='", i.makeNodeLineClass(a, c), "' treeNode", f.id.SWITCH, "></span>")
			},
			makeDOMNodeMainAfter: function(b) {
				b.push("</li>")
			},
			makeDOMNodeMainBefore: function(b, a, c) {
				b.push("<li id='", c.tId, "' class='", f.className.LEVEL, c.level, "' tabindex='0' hidefocus='true' treenode>")
			},
			makeDOMNodeNameAfter: function(b) {
				b.push("</a>")
			},
			makeDOMNodeNameBefore: function(b, a, c) {
				var d = h.getNodeTitle(a, c),
					e = i.makeNodeUrl(a, c),
					g = i.makeNodeFontCss(a, c),
					k = [],
					p;
				for(p in g) k.push(p, ":", g[p], ";");
				b.push("<a id='", c.tId, f.id.A, "' class='", f.className.LEVEL, c.level, "' treeNode", f.id.A, ' onclick="', c.click || "", '" ', e != null && e.length > 0 ? "href='" + e + "'" : "", " target='", i.makeNodeTarget(c), "' style='", k.join(""), "'");
				j.apply(a.view.showTitle, [a.treeId, c], a.view.showTitle) && d && b.push("title='", d.replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g,
					"&gt;"), "'");
				b.push(">")
			},
			makeNodeFontCss: function(b, a) {
				var c = j.apply(b.view.fontCss, [b.treeId, a], b.view.fontCss);
				return c && typeof c != "function" ? c : {}
			},
			makeNodeIcoClass: function(b, a) {
				var c = ["ico"];
				a.isAjaxing || (c[0] = (a.iconSkin ? a.iconSkin + "_" : "") + c[0], a.isParent ? c.push(a.open ? f.folder.OPEN : f.folder.CLOSE) : c.push(f.folder.DOCU));
				return f.className.BUTTON + " " + c.join("_")
			},
			makeNodeIcoStyle: function(b, a) {
				var c = [];
				if(!a.isAjaxing) {
					var d = a.isParent && a.iconOpen && a.iconClose ? a.open ? a.iconOpen : a.iconClose :
						a[b.data.key.icon];
					d && c.push("background:url(", d, ") 0 0 no-repeat;");
					(b.view.showIcon == !1 || !j.apply(b.view.showIcon, [b.treeId, a], !0)) && c.push("width:0px;height:0px;")
				}
				return c.join("")
			},
			makeNodeLineClass: function(b, a) {
				var c = [];
				b.view.showLine ? a.level == 0 && a.isFirstNode && a.isLastNode ? c.push(f.line.ROOT) : a.level == 0 && a.isFirstNode ? c.push(f.line.ROOTS) : a.isLastNode ? c.push(f.line.BOTTOM) : c.push(f.line.CENTER) : c.push(f.line.NOLINE);
				a.isParent ? c.push(a.open ? f.folder.OPEN : f.folder.CLOSE) : c.push(f.folder.DOCU);
				return i.makeNodeLineClassEx(a) + c.join("_")
			},
			makeNodeLineClassEx: function(b) {
				return f.className.BUTTON + " " + f.className.LEVEL + b.level + " " + f.className.SWITCH + " "
			},
			makeNodeTarget: function(b) {
				return b.target || "_blank"
			},
			makeNodeUrl: function(b, a) {
				var c = b.data.key.url;
				return a[c] ? a[c] : null
			},
			makeUlHtml: function(b, a, c, d) {
				c.push("<ul id='", a.tId, f.id.UL, "' class='", f.className.LEVEL, a.level, " ", i.makeUlLineClass(b, a), "' style='display:", a.open ? "block" : "none", "'>");
				c.push(d);
				c.push("</ul>")
			},
			makeUlLineClass: function(b,
				a) {
				return b.view.showLine && !a.isLastNode ? f.line.LINE : ""
			},
			removeChildNodes: function(b, a) {
				if(a) {
					var c = b.data.key.children,
						d = a[c];
					if(d) {
						for(var e = 0, g = d.length; e < g; e++) h.removeNodeCache(b, d[e]);
						h.removeSelectedNode(b);
						delete a[c];
						b.data.keep.parent ? l(a, f.id.UL, b).empty() : (a.isParent = !1, a.open = !1, c = l(a, f.id.SWITCH, b), d = l(a, f.id.ICON, b), i.replaceSwitchClass(a, c, f.folder.DOCU), i.replaceIcoClass(a, d, f.folder.DOCU), l(a, f.id.UL, b).remove())
					}
				}
			},
			scrollIntoView: function(b) {
				if(b) {
					if(!Element.prototype.scrollIntoViewIfNeeded) Element.prototype.scrollIntoViewIfNeeded =
						function(a) {
							function b(a, d, e, f) {
								return {
									left: a,
									top: d,
									width: e,
									height: f,
									right: a + e,
									bottom: d + f,
									translate: function(g, k) {
										return b(g + a, k + d, e, f)
									},
									relativeFromTo: function(k, h) {
										var i = a,
											j = d,
											k = k.offsetParent,
											h = h.offsetParent;
										if(k === h) return g;
										for(; k; k = k.offsetParent) i += k.offsetLeft + k.clientLeft, j += k.offsetTop + k.clientTop;
										for(; h; h = h.offsetParent) i -= h.offsetLeft + h.clientLeft, j -= h.offsetTop + h.clientTop;
										return b(i, j, e, f)
									}
								}
							}
							for(var d, e = this, g = b(this.offsetLeft, this.offsetTop, this.offsetWidth, this.offsetHeight); j.isElement(d =
									e.parentNode);) {
								var f = d.offsetLeft + d.clientLeft,
									h = d.offsetTop + d.clientTop,
									g = g.relativeFromTo(e, d).translate(-f, -h);
								d.scrollLeft = !1 === a || g.left <= d.scrollLeft + d.clientWidth && d.scrollLeft <= g.right - d.clientWidth + d.clientWidth ? Math.min(g.left, Math.max(g.right - d.clientWidth, d.scrollLeft)) : (g.right - d.clientWidth + g.left) / 2;
								d.scrollTop = !1 === a || g.top <= d.scrollTop + d.clientHeight && d.scrollTop <= g.bottom - d.clientHeight + d.clientHeight ? Math.min(g.top, Math.max(g.bottom - d.clientHeight, d.scrollTop)) : (g.bottom - d.clientHeight +
									g.top) / 2;
								g = g.translate(f - d.scrollLeft, h - d.scrollTop);
								e = d
							}
						};
					b.scrollIntoViewIfNeeded()
				}
			},
			setFirstNode: function(b, a) {
				var c = b.data.key.children;
				if(a[c].length > 0) a[c][0].isFirstNode = !0
			},
			setLastNode: function(b, a) {
				var c = b.data.key.children,
					d = a[c].length;
				if(d > 0) a[c][d - 1].isLastNode = !0
			},
			removeNode: function(b, a) {
				var c = h.getRoot(b),
					d = b.data.key.children,
					e = a.parentTId ? a.getParentNode() : c;
				a.isFirstNode = !1;
				a.isLastNode = !1;
				a.getPreNode = function() {
					return null
				};
				a.getNextNode = function() {
					return null
				};
				if(h.getNodeCache(b,
						a.tId)) {
					l(a, b).remove();
					h.removeNodeCache(b, a);
					h.removeSelectedNode(b, a);
					for(var g = 0, k = e[d].length; g < k; g++)
						if(e[d][g].tId == a.tId) {
							e[d].splice(g, 1);
							break
						}
					i.setFirstNode(b, e);
					i.setLastNode(b, e);
					var j, g = e[d].length;
					if(!b.data.keep.parent && g == 0) e.isParent = !1, e.open = !1, g = l(e, f.id.UL, b), k = l(e, f.id.SWITCH, b), j = l(e, f.id.ICON, b), i.replaceSwitchClass(e, k, f.folder.DOCU), i.replaceIcoClass(e, j, f.folder.DOCU), g.css("display", "none");
					else if(b.view.showLine && g > 0) {
						var n = e[d][g - 1],
							g = l(n, f.id.UL, b),
							k = l(n, f.id.SWITCH,
								b);
						j = l(n, f.id.ICON, b);
						e == c ? e[d].length == 1 ? i.replaceSwitchClass(n, k, f.line.ROOT) : (c = l(e[d][0], f.id.SWITCH, b), i.replaceSwitchClass(e[d][0], c, f.line.ROOTS), i.replaceSwitchClass(n, k, f.line.BOTTOM)) : i.replaceSwitchClass(n, k, f.line.BOTTOM);
						g.removeClass(f.line.LINE)
					}
				}
			},
			replaceIcoClass: function(b, a, c) {
				if(a && !b.isAjaxing && (b = a.attr("class"), b != void 0)) {
					b = b.split("_");
					switch(c) {
						case f.folder.OPEN:
						case f.folder.CLOSE:
						case f.folder.DOCU:
							b[b.length - 1] = c
					}
					a.attr("class", b.join("_"))
				}
			},
			replaceSwitchClass: function(b,
				a, c) {
				if(a) {
					var d = a.attr("class");
					if(d != void 0) {
						d = d.split("_");
						switch(c) {
							case f.line.ROOT:
							case f.line.ROOTS:
							case f.line.CENTER:
							case f.line.BOTTOM:
							case f.line.NOLINE:
								d[0] = i.makeNodeLineClassEx(b) + c;
								break;
							case f.folder.OPEN:
							case f.folder.CLOSE:
							case f.folder.DOCU:
								d[1] = c
						}
						a.attr("class", d.join("_"));
						c !== f.folder.DOCU ? a.removeAttr("disabled") : a.attr("disabled", "disabled")
					}
				}
			},
			selectNode: function(b, a, c) {
				c || i.cancelPreSelectedNode(b, null, a);
				l(a, f.id.A, b).addClass(f.node.CURSELECTED);
				h.addSelectedNode(b, a);
				b.treeObj.trigger(f.event.SELECTED, [b.treeId, a])
			},
			setNodeFontCss: function(b, a) {
				var c = l(a, f.id.A, b),
					d = i.makeNodeFontCss(b, a);
				d && c.css(d)
			},
			setNodeLineIcos: function(b, a) {
				if(a) {
					var c = l(a, f.id.SWITCH, b),
						d = l(a, f.id.UL, b),
						e = l(a, f.id.ICON, b),
						g = i.makeUlLineClass(b, a);
					g.length == 0 ? d.removeClass(f.line.LINE) : d.addClass(g);
					c.attr("class", i.makeNodeLineClass(b, a));
					a.isParent ? c.removeAttr("disabled") : c.attr("disabled", "disabled");
					e.removeAttr("style");
					e.attr("style", i.makeNodeIcoStyle(b, a));
					e.attr("class", i.makeNodeIcoClass(b,
						a))
				}
			},
			setNodeName: function(b, a) {
				var c = h.getNodeTitle(b, a),
					d = l(a, f.id.SPAN, b);
				d.empty();
				b.view.nameIsHTML ? d.html(h.getNodeName(b, a)) : d.text(h.getNodeName(b, a));
				j.apply(b.view.showTitle, [b.treeId, a], b.view.showTitle) && l(a, f.id.A, b).attr("title", !c ? "" : c)
			},
			setNodeTarget: function(b, a) {
				l(a, f.id.A, b).attr("target", i.makeNodeTarget(a))
			},
			setNodeUrl: function(b, a) {
				var c = l(a, f.id.A, b),
					d = i.makeNodeUrl(b, a);
				d == null || d.length == 0 ? c.removeAttr("href") : c.attr("href", d)
			},
			switchNode: function(b, a) {
				a.open || !j.canAsync(b,
					a) ? i.expandCollapseNode(b, a, !a.open) : b.async.enable ? i.asyncNode(b, a) || i.expandCollapseNode(b, a, !a.open) : a && i.expandCollapseNode(b, a, !a.open)
			}
		};
	r.fn.zTree = {
		consts: {
			className: {
				BUTTON: "button",
				LEVEL: "level",
				ICO_LOADING: "ico_loading",
				SWITCH: "switch",
				NAME: "node_name"
			},
			event: {
				NODECREATED: "ztree_nodeCreated",
				CLICK: "ztree_click",
				EXPAND: "ztree_expand",
				COLLAPSE: "ztree_collapse",
				ASYNC_SUCCESS: "ztree_async_success",
				ASYNC_ERROR: "ztree_async_error",
				REMOVE: "ztree_remove",
				SELECTED: "ztree_selected",
				UNSELECTED: "ztree_unselected"
			},
			id: {
				A: "_a",
				ICON: "_ico",
				SPAN: "_span",
				SWITCH: "_switch",
				UL: "_ul"
			},
			line: {
				ROOT: "root",
				ROOTS: "roots",
				CENTER: "center",
				BOTTOM: "bottom",
				NOLINE: "noline",
				LINE: "line"
			},
			folder: {
				OPEN: "open",
				CLOSE: "close",
				DOCU: "docu"
			},
			node: {
				CURSELECTED: "curSelectedNode"
			}
		},
		_z: {
			tools: j,
			view: i,
			event: m,
			data: h
		},
		getZTreeObj: function(b) {
			return(b = h.getZTreeTools(b)) ? b : null
		},
		destroy: function(b) {
			if(b && b.length > 0) i.destroy(h.getSetting(b));
			else
				for(var a in s) i.destroy(s[a])
		},
		init: function(b, a, c) {
			var d = j.clone(O);
			r.extend(!0, d, a);
			d.treeId =
				b.attr("id");
			d.treeObj = b;
			d.treeObj.empty();
			s[d.treeId] = d;
			if(typeof document.body.style.maxHeight === "undefined") d.view.expandSpeed = "";
			h.initRoot(d);
			b = h.getRoot(d);
			a = d.data.key.children;
			c = c ? j.clone(j.isArray(c) ? c : [c]) : [];
			b[a] = d.data.simpleData.enable ? h.transformTozTreeFormat(d, c) : c;
			h.initCache(d);
			m.unbindTree(d);
			m.bindTree(d);
			m.unbindEvent(d);
			m.bindEvent(d);
			var e = {
				setting: d,
				addNodes: function(a, b, c, e) {
					function f() {
						i.addNodes(d, a, b, l, e == !0)
					}
					a || (a = null);
					if(a && !a.isParent && d.data.keep.leaf) return null;
					var h = parseInt(b, 10);
					isNaN(h) ? (e = !!c, c = b, b = -1) : b = h;
					if(!c) return null;
					var l = j.clone(j.isArray(c) ? c : [c]);
					j.canAsync(d, a) ? i.asyncNode(d, a, e, f) : f();
					return l
				},
				cancelSelectedNode: function(a) {
					i.cancelPreSelectedNode(d, a)
				},
				destroy: function() {
					i.destroy(d)
				},
				expandAll: function(a) {
					a = !!a;
					i.expandCollapseSonNode(d, null, a, !0);
					return a
				},
				expandNode: function(a, b, c, e, f) {
					function m() {
						var b = l(a, d).get(0);
						b && e !== !1 && i.scrollIntoView(b)
					}
					if(!a || !a.isParent) return null;
					b !== !0 && b !== !1 && (b = !a.open);
					if((f = !!f) && b && j.apply(d.callback.beforeExpand, [d.treeId, a], !0) == !1) return null;
					else if(f && !b && j.apply(d.callback.beforeCollapse, [d.treeId, a], !0) == !1) return null;
					b && a.parentTId && i.expandCollapseParentNode(d, a.getParentNode(), b, !1);
					if(b === a.open && !c) return null;
					h.getRoot(d).expandTriggerFlag = f;
					!j.canAsync(d, a) && c ? i.expandCollapseSonNode(d, a, b, !0, m) : (a.open = !b, i.switchNode(this.setting, a), m());
					return b
				},
				getNodes: function() {
					return h.getNodes(d)
				},
				getNodeByParam: function(a, b, c) {
					return !a ? null : h.getNodeByParam(d, c ? c[d.data.key.children] : h.getNodes(d),
						a, b)
				},
				getNodeByTId: function(a) {
					return h.getNodeCache(d, a)
				},
				getNodesByParam: function(a, b, c) {
					return !a ? null : h.getNodesByParam(d, c ? c[d.data.key.children] : h.getNodes(d), a, b)
				},
				getNodesByParamFuzzy: function(a, b, c) {
					return !a ? null : h.getNodesByParamFuzzy(d, c ? c[d.data.key.children] : h.getNodes(d), a, b)
				},
				getNodesByFilter: function(a, b, c, e) {
					b = !!b;
					return !a || typeof a != "function" ? b ? null : [] : h.getNodesByFilter(d, c ? c[d.data.key.children] : h.getNodes(d), a, b, e)
				},
				getNodeIndex: function(a) {
					if(!a) return null;
					for(var b = d.data.key.children,
							c = a.parentTId ? a.getParentNode() : h.getRoot(d), e = 0, f = c[b].length; e < f; e++)
						if(c[b][e] == a) return e;
					return -1
				},
				getSelectedNodes: function() {
					for(var a = [], b = h.getRoot(d).curSelectedList, c = 0, e = b.length; c < e; c++) a.push(b[c]);
					return a
				},
				isSelectedNode: function(a) {
					return h.isSelectedNode(d, a)
				},
				reAsyncChildNodesPromise: function(a, b, c) {
					return new Promise(function(d, f) {
						try {
							e.reAsyncChildNodes(a, b, c, function() {
								d(a)
							})
						} catch(h) {
							f(h)
						}
					})
				},
				reAsyncChildNodes: function(a, b, c, e) {
					if(this.setting.async.enable) {
						var j = !a;
						j && (a = h.getRoot(d));
						if(b == "refresh") {
							for(var b = this.setting.data.key.children, m = 0, r = a[b] ? a[b].length : 0; m < r; m++) h.removeNodeCache(d, a[b][m]);
							h.removeSelectedNode(d);
							a[b] = [];
							j ? this.setting.treeObj.empty() : l(a, f.id.UL, d).empty()
						}
						i.asyncNode(this.setting, j ? null : a, !!c, e)
					}
				},
				refresh: function() {
					this.setting.treeObj.empty();
					var a = h.getRoot(d),
						b = a[d.data.key.children];
					h.initRoot(d);
					a[d.data.key.children] = b;
					h.initCache(d);
					i.createNodes(d, 0, a[d.data.key.children], null, -1)
				},
				removeChildNodes: function(a) {
					if(!a) return null;
					var b = a[d.data.key.children];
					i.removeChildNodes(d, a);
					return b ? b : null
				},
				removeNode: function(a, b) {
					a && (b = !!b, b && j.apply(d.callback.beforeRemove, [d.treeId, a], !0) == !1 || (i.removeNode(d, a), b && this.setting.treeObj.trigger(f.event.REMOVE, [d.treeId, a])))
				},
				selectNode: function(a, b, c) {
					function e() {
						if(!c) {
							var b = l(a, d).get(0);
							i.scrollIntoView(b)
						}
					}
					if(a && j.uCanDo(d)) {
						b = d.view.selectedMulti && b;
						if(a.parentTId) i.expandCollapseParentNode(d, a.getParentNode(), !0, !1, e);
						else if(!c) try {
							l(a, d).focus().blur()
						} catch(f) {}
						i.selectNode(d, a, b)
					}
				},
				transformTozTreeNodes: function(a) {
					return h.transformTozTreeFormat(d,
						a)
				},
				transformToArray: function(a) {
					return h.transformToArrayFormat(d, a)
				},
				updateNode: function(a) {
					a && l(a, d).get(0) && j.uCanDo(d) && (i.setNodeName(d, a), i.setNodeTarget(d, a), i.setNodeUrl(d, a), i.setNodeLineIcos(d, a), i.setNodeFontCss(d, a))
				}
			};
			b.treeTools = e;
			h.setZTreeTools(d, e);
			b[a] && b[a].length > 0 ? i.createNodes(d, 0, b[a], null, -1) : d.async.enable && d.async.url && d.async.url !== "" && i.asyncNode(d);
			return e
		}
	};
	var P = r.fn.zTree,
		l = j.$,
		f = P.consts
})(jQuery);
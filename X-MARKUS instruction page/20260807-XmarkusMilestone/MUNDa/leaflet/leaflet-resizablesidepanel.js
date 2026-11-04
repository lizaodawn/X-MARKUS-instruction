/**
 * @name Leaflet.SidePanel
 * @link https://github.com/maxwell-ilai/Leaflet.SidePanel
 */

L.Control.SidePanel = L.Control.extend({
	includes: L.Evented.prototype,

	options: {
		panelPosition: 'left',
		hasTabs: true,
		tabsPosition: 'top',
		darkMode: false,
		pushControls: false,
		startTab: 1,
		resizable: true, // 新增可調整大小的選項
		minWidth: 200,  // 最小寬度
		maxWidth: 800   // 最大寬度
	},

	initialize: function (id, options) {
		// Get panel HTMLElement
		this._panel = L.DomUtil.get(id);

		// Merge options
		L.setOptions(this, options);
		
		// 儲存面板狀態和寬度的變數
		this._isOpened = true;
		this._currentWidth = 0;
	},

	addTo: function (map) {
		// 保存地圖參考，以便在各個方法中使用
		this._map = map;
		
		// Attach panel direction class
		L.DomUtil.addClass(this._panel, 'sidepanel-' + this.options.panelPosition);

		// Enable dark mode
		if (this.options.darkMode) {
			L.DomUtil.addClass(this._panel, 'sidepanel-dark');
		}

		// Adds stopPropagation to the element's 'wheel' events (plus browser variants).
		L.DomEvent.disableScrollPropagation(this._panel);
		// Adds stopPropagation to the element's 'click', 'dblclick', 'contextmenu', 'mousedown' and 'touchstart' events (plus browser variants).
		L.DomEvent.disableClickPropagation(this._panel);

		// If there are tabs, start them.
		if (this.options.hasTabs) {
			this.initTabs(map, this.options.tabsPosition);
		}

		// 如果啟用了調整大小功能，則初始化
		if (this.options.resizable) {
			this._initResizable(map);
		}
		
		// 初始化開關按鈕
		this._toggleButton(map);
		
		// 儲存初始寬度
		this._currentWidth = parseInt(getComputedStyle(this._panel).width, 10);
		
		return this;
	},

	initTabs: function (map, tabsPosition) {
		if (typeof tabsPosition === 'string') {
			L.DomUtil.addClass(this._panel, 'tabs-' + tabsPosition);
		}

		let tabsLinks = this._panel.querySelectorAll('a.sidebar-tab-link');
		let tabsContents = this._panel.querySelectorAll('.sidepanel-tab-content');

		tabsLinks.forEach(function (tabLink, tabIndex) {
			// Shows the first active tab
			let startTab, startContent;

			if (typeof this.options.startTab === 'number' && (this.options.startTab - 1) === tabIndex) {
				startTab = tabLink;
				startContent = tabsContents[tabIndex];
			}

			if (typeof this.options.startTab === 'string' && this.options.startTab === tabLink.dataset.tabLink) {
				startTab = tabLink;
				startContent = this._panel.querySelector(`.sidepanel-tab-content[data-tab-content="${this.options.startTab}"]`);
			}

			if (startTab !== undefined && !L.DomUtil.hasClass(startTab, 'active')) {
				L.DomUtil.addClass(startTab, 'active');
				L.DomUtil.addClass(startContent, 'active');
			}

			L.DomEvent.on(tabLink, 'click', function (e) {
				L.DomEvent.preventDefault(e);

				if (!L.DomUtil.hasClass(tabLink, 'active')) {
					// Remove active links
					for (let i = 0; i < tabsLinks.length; i++) {
						let linkActive = tabsLinks[i];

						if (L.DomUtil.hasClass(linkActive, 'active')) {
							L.DomUtil.removeClass(linkActive, 'active');
						}
					}

					// Add current active link
					L.DomUtil.addClass(tabLink, 'active');

					// Shows current active content
					tabsContents.forEach(function (element) {
						if (tabLink.dataset.tabLink === element.dataset.tabContent) {
							L.DomUtil.addClass(element, 'active');
						} else {
							L.DomUtil.removeClass(element, 'active');
						}
					});
				}
			}, tabLink);
		}.bind(this));
	},

	// 更新所有控制項位置的通用方法
	_updateControlsPosition: function(width, isOpened) {
		if (!this.options.pushControls || !this._map) return;
		
		const map = this._map;
		let controlsContainer = map.getContainer().querySelector('.leaflet-control-container');
		
		// 確保添加動畫控制容器類
		L.DomUtil.addClass(controlsContainer, 'leaflet-anim-control-container');
		
		// 根據側邊欄狀態更新類
		if (isOpened) {
			L.DomUtil.removeClass(controlsContainer, this.options.panelPosition + '-closed');
			L.DomUtil.addClass(controlsContainer, this.options.panelPosition + '-opened');
		} else {
			L.DomUtil.removeClass(controlsContainer, this.options.panelPosition + '-opened');
			L.DomUtil.addClass(controlsContainer, this.options.panelPosition + '-closed');
			
			// 如果關閉，重置所有控制項位置
			this._resetControlsPosition();
			return;
		}
		
		// 如果開啟，設置新位置
		if (this.options.panelPosition === 'left') {
			// 更新左側所有控制項
			let leftControls = controlsContainer.querySelectorAll('.leaflet-left');
			leftControls.forEach(function(control) {
				control.style.left = width + 'px';
			});
			
			// 特別處理 layers 和 scale 控制項
			let layersControl = map.getContainer().querySelector('.leaflet-control-layers');
			let scaleControl = map.getContainer().querySelector('.leaflet-control-scale');
			
			if (layersControl && !layersControl.classList.contains('leaflet-right')) {
				layersControl.style.left = width + 'px';
			}
			
			if (scaleControl && !scaleControl.classList.contains('leaflet-right')) {
				scaleControl.style.left = width + 'px';
			}
		} else if (this.options.panelPosition === 'right') {
			// 更新右側所有控制項
			let rightControls = controlsContainer.querySelectorAll('.leaflet-right');
			rightControls.forEach(function(control) {
				control.style.right = width + 'px';
			});
			
			// 特別處理 layers 和 scale 控制項
			let layersControl = map.getContainer().querySelector('.leaflet-control-layers');
			let scaleControl = map.getContainer().querySelector('.leaflet-control-scale');
			
			if (layersControl && layersControl.classList.contains('leaflet-right')) {
				layersControl.style.right = width + 'px';
			}
			
			if (scaleControl && scaleControl.classList.contains('leaflet-right')) {
				scaleControl.style.right = width + 'px';
			}
		}
	},
	
	// 重置所有控制項位置的方法
	_resetControlsPosition: function() {
		if (!this._map) return;
		
		const map = this._map;
		
		if (this.options.panelPosition === 'left') {
			// 重置左側所有控制項
			let leftControls = map.getContainer().querySelectorAll('.leaflet-left');
			leftControls.forEach(function(control) {
				control.style.left = '';
			});
			
			// 特別處理 layers 和 scale 控制項
			let layersControl = map.getContainer().querySelector('.leaflet-control-layers');
			let scaleControl = map.getContainer().querySelector('.leaflet-control-scale');
			
			if (layersControl && !layersControl.classList.contains('leaflet-right')) {
				layersControl.style.left = '';
			}
			
			if (scaleControl && !scaleControl.classList.contains('leaflet-right')) {
				scaleControl.style.left = '';
			}
		} else if (this.options.panelPosition === 'right') {
			// 重置右側所有控制項
			let rightControls = map.getContainer().querySelectorAll('.leaflet-right');
			rightControls.forEach(function(control) {
				control.style.right = '';
			});
			
			// 特別處理 layers 和 scale 控制項
			let layersControl = map.getContainer().querySelector('.leaflet-control-layers');
			let scaleControl = map.getContainer().querySelector('.leaflet-control-scale');
			
			if (layersControl && layersControl.classList.contains('leaflet-right')) {
				layersControl.style.right = '';
			}
			
			if (scaleControl && scaleControl.classList.contains('leaflet-right')) {
				scaleControl.style.right = '';
			}
		}
	},

	_toggleButton: function (map) {
		const container = this._panel.querySelector('.sidepanel-toggle-container');
		const button = container.querySelector('.sidepanel-toggle-button');

		L.DomEvent.on(button, 'click', function (e) {
			let IS_OPENED = true;
			let opened = L.DomUtil.hasClass(this._panel, 'opened');
			let closed = L.DomUtil.hasClass(this._panel, 'closed');

			if (!opened && !closed) {
				L.DomUtil.addClass(this._panel, 'opened');
			} else if (!opened && closed) {
				IS_OPENED = true;
				L.DomUtil.addClass(this._panel, 'opened');
				L.DomUtil.removeClass(this._panel, 'closed');
			} else if (opened && !closed) {
				IS_OPENED = false;
				L.DomUtil.removeClass(this._panel, 'opened');
				L.DomUtil.addClass(this._panel, 'closed');
			} else {
				L.DomUtil.addClass(this._panel, 'opened');
			}
			
			// 更新面板狀態
			this._isOpened = IS_OPENED;
			
			// 獲取當前寬度
			if (IS_OPENED) {
				this._currentWidth = parseInt(getComputedStyle(this._panel).width, 10);
			}
			
			// 使用通用方法更新控制項位置
			this._updateControlsPosition(this._currentWidth, IS_OPENED);
			
		}.bind(this), container);
	},

	// 新增調整大小的功能
	_initResizable: function(map) {
		// 創建調整大小的處理元素
		const resizer = L.DomUtil.create('div', 'sidepanel-resizer', this._panel);
		
		// 將面板的原始寬度設為變數
		this._originalWidth = parseInt(getComputedStyle(this._panel).width, 10);
		this._currentWidth = this._originalWidth;
		
		// 設置拖動事件處理
		let isResizing = false;
		let startX, startWidth;
		
		// 滑鼠按下時開始調整大小
		L.DomEvent.on(resizer, 'mousedown', function(e) {
			// 防止地圖拖動
			L.DomEvent.preventDefault(e);
			L.DomEvent.stopPropagation(e);
			
			// 檢查面板是否開啟
			let opened = L.DomUtil.hasClass(this._panel, 'opened');
			let closed = L.DomUtil.hasClass(this._panel, 'closed');
			this._isOpened = opened || (!opened && !closed);
			
			if (!this._isOpened) return; // 如果面板關閉，不允許調整大小
			
			isResizing = true;
			startX = e.clientX;
			startWidth = parseInt(getComputedStyle(this._panel).width, 10);
			
			// 添加滑鼠移動和滑鼠放開的事件監聽
			L.DomEvent.on(document, 'mousemove', onMouseMove);
			L.DomEvent.on(document, 'mouseup', onMouseUp);
		}.bind(this));
		
		// 滑鼠移動時調整大小
		const onMouseMove = function(e) {
			if (!isResizing) return;
			
			let delta = e.clientX - startX;
			let newWidth;
			
			// 根據面板位置決定寬度如何變化
			if (this.options.panelPosition === 'left') {
				newWidth = startWidth + delta;
			} else if (this.options.panelPosition === 'right') {
				newWidth = startWidth - delta;
			}
			
			// 限制寬度範圍
			newWidth = Math.min(Math.max(newWidth, this.options.minWidth), this.options.maxWidth);
			
			// 設置新寬度
			this._panel.style.width = newWidth + 'px';
			
			// 更新當前寬度
			this._currentWidth = newWidth;
			
			// 使用通用方法更新控制項位置
			this._updateControlsPosition(newWidth, this._isOpened);
			
			// 觸發resize事件
			this.fire('resize', {
				width: newWidth
			});
		}.bind(this);
		
		// 滑鼠放開時停止調整大小
		const onMouseUp = function() {
			if (!isResizing) return;
			
			isResizing = false;
			
			// 移除事件監聽
			L.DomEvent.off(document, 'mousemove', onMouseMove);
			L.DomEvent.off(document, 'mouseup', onMouseUp);
		};
	}
});

L.control.sidepanel = function (id, options) {
	return new L.Control.SidePanel(id, options);
};
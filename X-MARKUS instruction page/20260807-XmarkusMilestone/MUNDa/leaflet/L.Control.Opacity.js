        // --- 插件 JS 開始 (重構狀態與事件生命週期) ---
        L.Control.Opacity = L.Control.extend({
            options: {
                collapsed: false,
                position: 'topright',
                label: null,
                language: 'zh-TW',
                layerControl: null
            },
            
            i18n: {
                'zh-TW': { label: '圖層樣式與濾鏡', opacity: '透明度', contrast: '對比度', brightness: '亮度', saturate: '飽和度', filter: '濾鏡', remove: '移除', removeConfirmShort: '確定?' },
                'zh-CN': { label: '图层样式与滤镜', opacity: '透明度', contrast: '对比度', brightness: '亮度', saturate: '饱和度', filter: '滤镜', remove: '移除', removeConfirmShort: '确定?' },
                'en': { label: 'Layer Styles', opacity: 'Opacity', contrast: 'Contrast', brightness: 'Bright', saturate: 'Saturate', filter: 'Filter', remove: 'Remove', removeConfirmShort: 'Sure?' },
                'ja': { label: 'レイヤースタイル', opacity: '不透明', contrast: '対比', brightness: '輝度', saturate: '彩度', filter: '設定', remove: '削除', removeConfirmShort: '確認' },
                'ko': { label: '레이어 스타일', opacity: '투명도', contrast: '대비', brightness: '밝기', saturate: '채도', filter: '필터', remove: '제거', removeConfirmShort: '확인' }
            },

            initialize: function (overlays, options) {
                L.Util.setOptions(this, options);
                this._layers = [];
                
                const normalizeLang = (l) => {
                    l = (l || 'zh-TW').toLowerCase().replace('_', '-');
                    if (l.startsWith('zh')) return l.includes('cn') ? 'zh-CN' : 'zh-TW';
                    if (l.startsWith('en')) return 'en';
                    if (l.startsWith('ja')) return 'ja';
                    if (l.startsWith('ko')) return 'ko';
                    return 'zh-TW';
                };

                const langKey = normalizeLang(this.options.language);
                this.lang = this.i18n[langKey] || this.i18n['zh-TW'];

                if (this.options.label === null || this.options.label === undefined) {
                    this.options.label = this.lang.label;
                }

                for (const i in overlays) {
                    this._addLayer(overlays[i], i);
                }
            },
            
            addOverlay: function (layer, name) {
                this._addLayer(layer, name);
                return (this._map) ? this._update() : this;
            },

            removeLayer: function (layer) {
                // 解除我們綁定的唯一事件，避免殘留
                if (layer._hasOpacityControl) {
                    layer.off('add', layer._onLayerAdd);
                    layer.off('load', layer._onLayerLoad);
                    layer._hasOpacityControl = false;
                }
                const id = L.Util.stamp(layer);
                this._layers = this._layers.filter(item => L.Util.stamp(item.layer) !== id);
                if (this._map) {
                    this._update();
                }
                return this;
            },

            onAdd: function (map) {
                this._initLayout();
                this._update();
                // 監聽地圖圖層的開關（勾選框觸發的 addLayer/removeLayer），保持面板與真實狀態同步
                map.on('layeradd layerremove', this._onMapLayerChange, this);
                return this._container;
            },

            onRemove: function (map) {
                map.off('layeradd layerremove', this._onMapLayerChange, this);
            },

            _onMapLayerChange: function (e) {
                // 只有當變動的圖層是我們追蹤的圖層時才重繪，避免底圖等無關圖層觸發
                if (this._layers.some(item => item.layer === e.layer)) {
                    this._update();
                }
            },
            expand: function () { L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded'); return this; },
            collapse: function () { L.DomUtil.removeClass(this._container, 'leaflet-control-layers-expanded'); return this; },
            
            _initLayout: function () {
                const className = 'leaflet-control-layers',
                    container = (this._container = L.DomUtil.create('div', className)),
                    collapsed = this.options.collapsed;
                container.setAttribute('aria-haspopup', true);
                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.disableScrollPropagation(container);

                if (this.options.label) {
                    const labelP = L.DomUtil.create('div', className + '-label');
                    labelP.innerHTML = this.options.label;
                    container.appendChild(labelP);
                }

                const form = (this._form = L.DomUtil.create('form', className + '-list'));
                if (collapsed && !L.Browser.android) {
                    L.DomEvent.on(container, { mouseenter: this.expand, mouseleave: this.collapse }, this);
                }
                
                const link = (this._layersLink = L.DomUtil.create('a', className + '-toggle', container));
                link.href = '#'; link.title = 'Styles';
                
                if (L.Browser.touch) {
                    L.DomEvent.on(link, 'click', L.DomEvent.stop);
                    L.DomEvent.on(link, 'click', this.expand, this);
                } else {
                    L.DomEvent.on(link, 'focus', this.expand, this);
                }
                if (!collapsed) this.expand();

                this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);
                container.appendChild(form);
            },
            
            // 【核心修正點 1】狀態與事件獨立於 UI 渲染之外綁定
            _addLayer: function (layer, name) {
                // 確保只綁定一次，不會因為 UI 重繪而無限疊加 Event Listener
                if (!layer._hasOpacityControl) {
                    layer._hasOpacityControl = true;
                    
                    // 初始化圖層選項，保證狀態不遺失
                    if (layer.options.opacity === undefined) layer.options.opacity = 1;
                    if (layer.options.contrast === undefined) layer.options.contrast = 100;
                    if (layer.options.brightness === undefined) layer.options.brightness = 100;
                    if (layer.options.saturate === undefined) layer.options.saturate = 100;

                    // 建立層級的專屬濾鏡更新函數
                    layer._applyOpacityFilters = function() {
                        // 慢載入時，被移除圖層殘留的 requestAnimationFrame 仍可能觸發；
                        // 若圖層已不在地圖上就直接跳過，避免操作到已銷毀／錯誤的容器
                        if (!this._map || !this._map.hasLayer(this)) return;
                        let el = this.getContainer ? this.getContainer() : (this.getElement ? this.getElement() : null);
                        if (el) {
                            const filterVal = `contrast(${this.options.contrast}%) brightness(${this.options.brightness}%) saturate(${this.options.saturate}%)`;
                            el.style.filter = filterVal;
                            el.style.webkitFilter = filterVal;
                        }
                    };

                    // 使用 requestAnimationFrame 確保在 DOM 完全生成後再套用，防止失效
                    layer._onLayerAdd = function() {
                        requestAnimationFrame(() => this._applyOpacityFilters());
                    };
                    layer._onLayerLoad = function() {
                        requestAnimationFrame(() => this._applyOpacityFilters());
                    };

                    layer.on('add', layer._onLayerAdd);
                    layer.on('load', layer._onLayerLoad);
                }

                this._layers.push({ layer: layer, name: name });
            },
            
            _update: function () {
                if (!this._container) return this;
                L.DomUtil.empty(this._overlaysList);
                for (let i = 0; i < this._layers.length; i++) {
                    this._addItem(this._layers[i]);
                }
            },
            
            _addItem: function (obj) {
                const isActive = this._map && this._map.hasLayer(obj.layer);
                const container = document.createElement('div');
                container.className = 'layer-control-group' + (isActive ? '' : ' layer-inactive');

                const header = document.createElement('div');
                header.className = 'layer-header';

                const titleLabel = document.createElement('label');
                titleLabel.className = 'layer-control-title';
                titleLabel.innerHTML = obj.name;
                titleLabel.title = obj.name; 
                
                const actionGroup = document.createElement('div');
                actionGroup.className = 'layer-header-actions';

                const toggleBtn = document.createElement('div');
                toggleBtn.className = 'advanced-toggle-btn';
                toggleBtn.innerHTML = `${this.lang.filter} <span class="toggle-icon">▼</span>`;
                
                const removeBtn = document.createElement('div');
                removeBtn.className = 'remove-layer-btn';
                removeBtn.title = this.lang.remove;
                removeBtn.innerHTML = '✖';

                let confirmTimeout;
                L.DomEvent.on(removeBtn, 'click', (e) => {
                    L.DomEvent.stop(e); 
                    
                    if (removeBtn.classList.contains('confirming')) {
                        clearTimeout(confirmTimeout);
                        if (this._map.hasLayer(obj.layer)) {
                            this._map.removeLayer(obj.layer);
                        }
                        if (this.options.layerControl) {
                            this.options.layerControl.removeLayer(obj.layer);
                        }
                        this.removeLayer(obj.layer);
                    } else {
                        removeBtn.classList.add('confirming');
                        removeBtn.innerHTML = this.lang.removeConfirmShort; 
                        
                        confirmTimeout = setTimeout(() => {
                            removeBtn.classList.remove('confirming');
                            removeBtn.innerHTML = '✖';
                        }, 3000);
                    }
                });

                actionGroup.appendChild(toggleBtn);
                actionGroup.appendChild(removeBtn);

                header.appendChild(titleLabel);
                header.appendChild(actionGroup);
                container.appendChild(header);

                // 【核心修正點 2】操作滑桿時，同步寫回 obj.layer.options 持久化保存
                this._createSlider(container, this.lang.opacity, 0, 100, obj.layer.options.opacity * 100, (val) => {
                    obj.layer.options.opacity = val / 100; // 寫入 Leaflet 原生設定中保存
                    obj.layer.setOpacity(val / 100);
                }, '%');

                const advancedControls = document.createElement('div');
                advancedControls.className = 'advanced-controls';

                this._createSlider(advancedControls, this.lang.contrast, 0, 500, obj.layer.options.contrast, (val) => {
                    obj.layer.options.contrast = val; 
                    obj.layer._applyOpacityFilters(); // 呼叫綁定在 layer 上的專屬函數
                }, '%');
                this._createSlider(advancedControls, this.lang.brightness, 0, 300, obj.layer.options.brightness, (val) => {
                    obj.layer.options.brightness = val; 
                    obj.layer._applyOpacityFilters();
                }, '%');
                this._createSlider(advancedControls, this.lang.saturate, 0, 300, obj.layer.options.saturate, (val) => {
                    obj.layer.options.saturate = val; 
                    obj.layer._applyOpacityFilters();
                }, '%');

                container.appendChild(advancedControls);

                L.DomEvent.on(toggleBtn, 'click', (e) => {
                    L.DomEvent.stop(e);
                    const isVisible = advancedControls.classList.contains('show');
                    if (isVisible) {
                        advancedControls.classList.remove('show');
                        toggleBtn.classList.remove('active');
                    } else {
                        advancedControls.classList.add('show');
                        toggleBtn.classList.add('active');
                    }
                });
                
                this._overlaysList.appendChild(container);
                
                // 初始化渲染如果有加在地圖上就立刻套用一次
                if (this._map && this._map.hasLayer(obj.layer)) {
                    obj.layer._applyOpacityFilters();
                }
            },

            _createSlider: function(parent, labelText, min, max, initialVal, callback, unit) {
                const row = document.createElement('div');
                row.className = 'slider-row';

                const label = document.createElement('span');
                label.className = 'slider-label';
                label.innerText = labelText;
                row.appendChild(label);

                const wrapper = document.createElement('div');
                wrapper.className = 'slider-input-wrapper';
                
                const input = document.createElement('input');
                input.type = 'range';
                input.min = min;
                input.max = max;
                input.value = initialVal;
                
                const valueDisplay = document.createElement('span');
                valueDisplay.className = 'slider-value';
                valueDisplay.innerText = initialVal + unit;

                L.DomEvent.disableClickPropagation(input);
                L.DomEvent.on(input, 'mousedown', L.DomEvent.stopPropagation);

                input.addEventListener('input', (e) => {
                    const val = e.target.value;
                    valueDisplay.innerText = val + unit;
                    callback(val);
                });

                wrapper.appendChild(input);
                row.appendChild(wrapper);
                row.appendChild(valueDisplay);
                parent.appendChild(row);
            }
        });

        L.control.opacity = function (overlays, options) {
            return new L.Control.Opacity(overlays, options);
        };
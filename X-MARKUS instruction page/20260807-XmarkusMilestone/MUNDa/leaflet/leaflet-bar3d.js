/**
 * Leaflet 3D Bar Plugin v1.0
 * 在地圖上顯示 3D 柱狀圖標記
 * 
 * 使用方式:
 * 
 * 1. 引入此檔案和 Google Material Symbols (用於 toggle 按鈕圖示):
 *    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
 *    <script src="leaflet-bar3d.js"></script>
 * 
 * 2. 建立 3D 柱狀圖:
 *    var marker = L.bar3D([lat, lng], {
 *        value: 100,           // 數值 (決定高度)
 *        width: 7,             // 柱子寬度 (px)
 *        heightScale: 1,       // 高度比例 (高度 = value * heightScale)
 *        color: '#ec897e',     // 底部顏色
 *        colorEnd: '#f8c9c4',  // 頂部顏色 (漸變)
 *        rotateX: -14,         // X 軸傾斜
 *        rotateY: -32,         // Y 軸旋轉
 *        rotateZ: 0,           // Z 軸旋轉
 *        shadowOpacity: 0.4,   // 陰影透明度
 *        shadowOffset: 8,      // 陰影偏移
 *        scaleWithZoom: true,  // 是否隨縮放調整大小
 *        baseZoom: 13,         // 基準縮放等級
 *        tooltipText: null     // 自訂 tooltip 文字
 *    }).addTo(map);
 * 
 * 3. 建立 Toggle Control (可選):
 *    var control = L.control.bar3DToggle({
 *        position: 'topright',     // 位置: 'topleft', 'topright', 'bottomleft', 'bottomright'
 *        defaultVisible: false     // 預設是否顯示
 *    }).addTo(map);
 *    control.setMarkers(markers);  // 設定要控制的 markers 陣列
 */

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(require('leaflet'));
    } else {
        factory(L);
    }
}(function (L) {
    'use strict';

    // ========== 注入 CSS 樣式 ==========
    var styleId = 'leaflet-bar3d-styles';
    if (!document.getElementById(styleId)) {
        var style = document.createElement('style');
        style.id = styleId;
        style.textContent = 
            '.leaflet-div-icon.bar3d-container {' +
                'background: transparent !important;' +
                'border: none !important;' +
                'z-index: 1000 !important;' +
            '}' +
            '.bar3d-container {' +
                'position: relative;' +
                'transform-style: preserve-3d;' +
                'background: transparent;' +
                'border: none;' +
                'z-index: 1000;' +
            '}' +
            '.bar-3d {' +
                'position: absolute;' +
                'bottom: 0;' +
                'left: 50%;' +
                'transform-style: preserve-3d;' +
                'cursor: pointer;' +
            '}' +
            '.bar-3d-tooltip {' +
                'position: absolute;' +
                'top: -30px;' +
                'left: 50%;' +
                'transform: translateX(-50%);' +
                'background: rgba(0,0,0,0.85);' +
                'color: white;' +
                'padding: 4px 12px;' +
                'border-radius: 4px;' +
                'font-size: 12px;' +
                'font-weight: bold;' +
                'white-space: pre-line;' +
                'text-align: center;' +
                'opacity: 0;' +
                'pointer-events: none;' +
                'transition: opacity 0.2s;' +
                'z-index: 1000;' +
            '}' +
            '.bar-3d:hover .bar-3d-tooltip {' +
                'opacity: 1;' +
            '}' +
            '.bar-face {' +
                'position: absolute;' +
                'backface-visibility: hidden;' +
            '}' +
            '.bar-shadow {' +
                'position: absolute;' +
                'left: 50%;' +
                'pointer-events: none;' +
            '}' +
            '.leaflet-bar3d-toggle {' +
                'width: 28px;' +
                'height: 28px;' +
                'background: white;' +
                'border-radius: 4px;' +
                'box-shadow: 0 1px 5px rgba(0,0,0,0.3);' +
                'cursor: pointer;' +
                'display: flex;' +
                'align-items: center;' +
                'justify-content: center;' +
                'transition: background 0.2s;' +
            '}' +
            '.leaflet-bar3d-toggle:hover {' +
                'background: #f4f4f4;' +
            '}' +
            '.leaflet-bar3d-toggle .material-symbols-outlined {' +
                'font-size: 18px;' +
                'color: #666;' +
            '}' +
            '.leaflet-bar3d-toggle.active {' +
                'background: #32A736;' +
            '}' +
            '.leaflet-bar3d-toggle.active .material-symbols-outlined {' +
                'color: white;' +
            '}';
        document.head.appendChild(style);
    }

    // ========== L.Bar3D Marker ==========
    L.Bar3D = L.Marker.extend({
        options: {
            value: 100,
            width: 7,
            heightScale: 1,
            color: '#ec897e',
            colorEnd: '#f8c9c4',
            rotateX: -14,
            rotateY: -32,
            rotateZ: 0,
            shadowOpacity: 0.4,
            shadowOffset: 8,
            scaleWithZoom: false,
            baseZoom: 13,
            interactive: true,
            tooltipText: null,
            zIndexOffset: 1000
        },

        initialize: function (latlng, options) {
            L.setOptions(this, options);
            this._latlng = L.latLng(latlng);
            // 預先建立 icon
            this._createIcon();
        },

        onAdd: function (map) {
            this._map = map;
            // 確保 icon 已建立（會根據 zoom 更新）
            this._createIcon();
            // 設定 icon 到 marker
            this.setIcon(this.options.icon);
            // 設定 z-index 確保在最上層
            if (this.options.zIndexOffset) {
                this.setZIndexOffset(this.options.zIndexOffset);
            }
            L.Marker.prototype.onAdd.call(this, map);

            if (this.options.scaleWithZoom) {
                this._bindZoomEvent();
            }
        },

        onRemove: function (map) {
            this._unbindZoomEvent();
            L.Marker.prototype.onRemove.call(this, map);
        },

        _bindZoomEvent: function () {
            if (!this._zoomHandler) {
                this._zoomHandler = this._onZoomChange.bind(this);
                this._map.on('zoomend', this._zoomHandler);
            }
        },

        _unbindZoomEvent: function () {
            if (this._zoomHandler && this._map) {
                this._map.off('zoomend', this._zoomHandler);
                this._zoomHandler = null;
            }
        },

        _onZoomChange: function () {
            this._updateIcon();
        },

        _getZoomScale: function () {
            if (!this.options.scaleWithZoom || !this._map) {
                return 1;
            }
            var currentZoom = this._map.getZoom();
            var baseZoom = this.options.baseZoom;
            return Math.pow(1.5, currentZoom - baseZoom);
        },

        _createIcon: function () {
            var o = this.options;
            var scale = this._getZoomScale();
            var scaledWidth = Math.max(1, o.width * scale);
            var height = o.value * o.heightScale * scale;
            var colorEnd = o.colorEnd || o.color;

            var containerWidth = scaledWidth * 5;
            var containerHeight = height + (o.shadowOffset * scale) + scaledWidth * 2;

            var html = this._createBarHTML(o, scaledWidth, height, colorEnd, scale);

            this.options.icon = L.divIcon({
                className: 'bar3d-container',
                html: html,
                iconSize: [containerWidth, containerHeight],
                iconAnchor: [containerWidth / 2, containerHeight]
            });
        },

        _updateIcon: function () {
            this._createIcon();
            if (this._map) {
                this.setIcon(this.options.icon);
            }
        },

        _createBarHTML: function (o, width, height, colorEnd, scale) {
            var transform = 'translateX(-50%) rotateX(' + o.rotateX + 'deg) rotateY(' + o.rotateY + 'deg) rotateZ(' + o.rotateZ + 'deg)';

            var shadowStyle =
                'width: ' + (width * 3) + 'px;' +
                'height: ' + (width * 2) + 'px;' +
                'bottom: ' + (-o.shadowOffset * scale) + 'px;' +
                'transform: translateX(-50%) rotateX(90deg);' +
                'background: radial-gradient(ellipse at center, rgba(0,0,0,' + o.shadowOpacity + ') 0%, rgba(0,0,0,' + (o.shadowOpacity * 0.4) + ') 40%, transparent 70%);' +
                'filter: blur(' + Math.max(3, 5 * scale) + 'px);';

            var barStyle =
                'width: ' + width + 'px;' +
                'height: ' + height + 'px;' +
                'transform: ' + transform + ';';

            var facesHTML = this._createSquareFaces(o.color, colorEnd, width, height);
            var tooltipContent = o.tooltipText !== null ? o.tooltipText : o.value;

            return '<div class="bar-3d" style="' + barStyle + '">' +
                '<div class="bar-3d-tooltip">' + tooltipContent + '</div>' +
                facesHTML +
                '<div class="bar-shadow" style="' + shadowStyle + '"></div>' +
                '</div>';
        },

        _createSquareFaces: function (color, colorEnd, w, h) {
            var d = w / 2;
            var faces = '';

            // 前
            faces += '<div class="bar-face" style="' +
                'width: ' + w + 'px; height: ' + h + 'px;' +
                'transform: translateZ(' + d + 'px);' +
                'background: linear-gradient(to top, ' + color + ', ' + colorEnd + ');' +
                '"></div>';

            // 後
            faces += '<div class="bar-face" style="' +
                'width: ' + w + 'px; height: ' + h + 'px;' +
                'transform: translateZ(' + (-d) + 'px) rotateY(180deg);' +
                'background: linear-gradient(to top, ' + this._darken(color, 50) + ', ' + this._darken(colorEnd, 50) + ');' +
                '"></div>';

            // 左
            faces += '<div class="bar-face" style="' +
                'width: ' + w + 'px; height: ' + h + 'px;' +
                'transform: translateX(' + (-d) + 'px) rotateY(-90deg);' +
                'background: linear-gradient(to top, ' + this._darken(color, 30) + ', ' + this._darken(colorEnd, 30) + ');' +
                '"></div>';

            // 右
            faces += '<div class="bar-face" style="' +
                'width: ' + w + 'px; height: ' + h + 'px;' +
                'transform: translateX(' + d + 'px) rotateY(90deg);' +
                'background: linear-gradient(to top, ' + this._lighten(color, 15) + ', ' + this._lighten(colorEnd, 15) + ');' +
                '"></div>';

            // 頂
            faces += '<div class="bar-face" style="' +
                'width: ' + w + 'px; height: ' + w + 'px;' +
                'transform: translateY(' + (-d) + 'px) rotateX(90deg);' +
                'background: linear-gradient(135deg, ' + this._lighten(colorEnd, 25) + ', ' + colorEnd + ');' +
                '"></div>';

            return faces;
        },

        _darken: function (hex, amount) {
            return this._adjustColor(hex, -amount);
        },

        _lighten: function (hex, amount) {
            return this._adjustColor(hex, amount);
        },

        _adjustColor: function (hex, amount) {
            hex = hex.replace('#', '');
            var num = parseInt(hex, 16);
            var r = Math.min(255, Math.max(0, (num >> 16) + amount));
            var g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
            var b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
            return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },

        setBarOptions: function (newOptions) {
            var wasScaling = this.options.scaleWithZoom;
            L.setOptions(this, newOptions);

            if (wasScaling && !this.options.scaleWithZoom) {
                this._unbindZoomEvent();
            } else if (!wasScaling && this.options.scaleWithZoom) {
                this._bindZoomEvent();
            }

            this._updateIcon();
            return this;
        },

        setValue: function (value) {
            this.options.value = value;
            this._updateIcon();
            return this;
        },

        getValue: function () {
            return this.options.value;
        }
    });

    // 工廠函數
    L.bar3D = function (latlng, options) {
        return new L.Bar3D(latlng, options);
    };

    // ========== L.Control.Bar3DToggle ==========
    L.Control.Bar3DToggle = L.Control.extend({
        options: {
            position: 'topright',
            markers: [],
            defaultVisible: false,
            onClick: null  // 自訂 click 事件: function(isVisible, control)
        },

        initialize: function (options) {
            L.setOptions(this, options);
            this._visible = this.options.defaultVisible;
        },

        onAdd: function (map) {
            this._map = map;

            var container = L.DomUtil.create('div', 'leaflet-bar3d-toggle leaflet-bar');
			container.title="3D bar";
            this._icon = L.DomUtil.create('span', 'material-symbols-outlined', container);
            this._updateIcon();

            if (!this._visible) {
                this._hideMarkers();
            }

            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.on(container, 'click', this._onClick, this);

            return container;
        },

        onRemove: function (map) {
            L.DomEvent.off(this._container, 'click', this._onClick, this);
        },

        _onClick: function () {
            // 如果有自訂 onClick，執行它
            if (typeof this.options.onClick === 'function') {
                this.options.onClick(this._visible, this);
            } else {
                // 預設行為：切換顯示/隱藏
                this._toggle();
            }
        },

        _toggle: function () {
            this._visible = !this._visible;
            this._updateIcon();

            if (this._visible) {
                this._showMarkers();
            } else {
                this._hideMarkers();
            }
        },

        _updateIcon: function () {
            this._icon.textContent = 'bar_chart_4_bars';
            if (this._visible) {
                L.DomUtil.addClass(this._container || this._icon.parentNode, 'active');
            } else {
                L.DomUtil.removeClass(this._container || this._icon.parentNode, 'active');
            }
        },

        _showMarkers: function () {
            var self = this;
            var targetMap = this._map;
            
            if (!targetMap) {
                return;
            }
            
            this.options.markers.forEach(function (marker) {
                if (!targetMap.hasLayer(marker)) {
                    marker.addTo(targetMap);
                }
            });
        },

        _hideMarkers: function () {
            var self = this;
            this.options.markers.forEach(function (marker) {
                if (self._map && self._map.hasLayer(marker)) {
                    self._map.removeLayer(marker);
                }
            });
        },

        setMarkers: function (markers, autoShow) {
            // 先隱藏並清除舊的 markers
            this._hideMarkers();
            
            // 設定新的 markers
            this.options.markers = markers || [];
            
            // 如果設定空陣列，自動隱藏
            if (!markers || markers.length === 0) {
                this._visible = false;
                this._updateIcon();
                return this;
            }
            
            // 如果 autoShow 為 true，強制顯示
            if (autoShow === true) {
                this._visible = true;
                this._updateIcon();
                this._showMarkers();
            } else if (this._visible) {
                // 如果目前已是顯示狀態，也顯示新的 markers
                this._showMarkers();
            }
            
            return this;
        },

        addMarker: function (marker) {
            this.options.markers.push(marker);
            if (this._visible && this._map && !this._map.hasLayer(marker)) {
                marker.addTo(this._map);
            } else if (!this._visible && this._map && this._map.hasLayer(marker)) {
                this._map.removeLayer(marker);
            }
            return this;
        },

        clearMarkers: function () {
            this._hideMarkers();
            this.options.markers = [];
            return this;
        },

        toggle: function () {
            this._toggle();
            return this;
        },

        show: function () {
            this._visible = true;
            this._updateIcon();
            this._showMarkers();
            return this;
        },

        hide: function () {
            this._visible = false;
            this._updateIcon();
            this._hideMarkers();
            return this;
        },

        isVisible: function () {
            return this._visible;
        },

        setOnClick: function (fn) {
            this.options.onClick = fn;
            return this;
        }
    });

    // 工廠函數
    L.control.bar3DToggle = function (options) {
        return new L.Control.Bar3DToggle(options);
    };

    return L;
}));

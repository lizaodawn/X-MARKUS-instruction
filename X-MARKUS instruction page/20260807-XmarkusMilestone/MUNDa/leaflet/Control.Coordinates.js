"use strict";

/**
 * author Michal Zimmermann <zimmicz@gmail.com>
 * Displays coordinates of mouseclick.
 * @param object options:
 *        position: bottomleft, bottomright etc. (just as you are used to it with Leaflet)
 *        latitudeText: description of latitude value (defaults to lat.)
 *        longitudeText: description of latitude value (defaults to lon.)
 *        promptText: text displayed when user clicks the control
 *        precision: number of decimals to be displayed
 */
L.Control.Coordinates = L.Control.extend({
	options: {
		position: 'bottomleft',
		latitudeText: ' lat',
		longitudeText: 'lng',
		promptText: 'Press Ctrl+C to copy coordinates',
		precision: 8
	},

	initialize: function(options)
	{
		L.Control.prototype.initialize.call(this, options);
	},

	onAdd: function(map)
	{
		var className = 'leaflet-control-coordinates',
			that = this,
			container = this._container = L.DomUtil.create('div', className);
			this.visible = false;

			L.DomUtil.addClass(container, 'hidden');


		L.DomEvent.disableClickPropagation(container);

		this._addText(container, map);

		L.DomEvent.addListener(container, 'click', function() {
			var lat = L.DomUtil.get(that._lat),
				lng = L.DomUtil.get(that._lng),
				latTextLen = this.options.latitudeText.length + 1,
				lngTextLen = this.options.longitudeText.length + 1,
				latTextIndex = lat.textContent.indexOf(this.options.latitudeText) + latTextLen,
				lngTextIndex = lng.textContent.indexOf(this.options.longitudeText) + lngTextLen,
				latCoordinate = lat.textContent.substr(latTextIndex),
				lngCoordinate = lng.textContent.substr(lngTextIndex);

				$("#msgBox").attr("title","坐標資訊");

				const url=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latCoordinate}&lon=${lngCoordinate}&extratags=1&namedetails=1&accept-language=${AcceptLanguage}`;
				$.getJSON( url, function( data ) {
					const maxHeight=$(window).height()-200;
					const str=JSONTree.create(data);
					let htmlStr=`坐標緯度 經度(點擊複製坐標值)：<span id="pointCoord" style="cursor:pointer;color:blue" onclick="CopyToClipboard('pointCoord')">${latCoordinate + '\t' + lngCoordinate}</span>`;
					htmlStr=htmlStr+`<br/>資訊：<div id="pointInfo" style="max-height:${maxHeight-100}px;" >${str}</div>`;
					$("#msgBox").html(htmlStr);
					$("#msgBox").dialog({
						resizable: false,
						height: "auto",
						width: 600,
						modal: false
					  });
					
				});




			//window.prompt(this.options.promptText + `<button>s</button>`, latCoordinate + '\t' + lngCoordinate);
    	}, this);

		return container;
	},

	_addText: function(container, context)
	{
		this._btn = L.DomUtil.create('span', 'ui-icon ui-icon-search' , container),
		this._lng = L.DomUtil.create('span', 'leaflet-control-coordinates-lng' , container),
		this._lat = L.DomUtil.create('span', 'leaflet-control-coordinates-lat' , container);

		return container;
	},

	/**
	 * This method should be called when user clicks the map.
	 * @param event object
	 */
	setCoordinates: function(obj)
	{
		if (!this.visible) {
			L.DomUtil.removeClass(this._container, 'hidden');
		}

		if (obj.latlng) {
			L.DomUtil.get(this._lat).innerHTML = '<strong>' + this.options.latitudeText + ':</strong> ' + obj.latlng.lat.toFixed(this.options.precision).toString();
			L.DomUtil.get(this._lng).innerHTML = '<strong>' + this.options.longitudeText + ':</strong> ' + obj.latlng.lng.toFixed(this.options.precision).toString();
			//L.DomUtil.get(this._btn).innerHTML = `<button onclick="reverseGeocode(${obj.latlng.lat.toFixed(this.options.precision)},${obj.latlng.lng.toFixed(this.options.precision).toString()})">` + this.options.longitudeText + '</button> ' + obj.latlng.lng.toFixed(this.options.precision).toString();
		}
	}
});
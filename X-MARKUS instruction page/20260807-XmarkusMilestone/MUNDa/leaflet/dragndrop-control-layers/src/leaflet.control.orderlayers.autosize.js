/*
 * L.Control.OrderLayers is a control to allow users to switch between different layers on the map.
 * --- CUSTOMIZED VERSION (v3) ---
 * - Added a delete button for overlay layers (sends integer ID and string name).
 * - Added automatic width adjustment based on layer name length (REVISED and FIXED).
 * - Works with flexbox CSS for row styling.
 */

L.Control.OrderLayers = L.Control.Layers.extend({
  options: {
    position : 'bottomright',
    dragging: false,
    autoWidth: true, // Option to enable/disable auto width
    minWidth: 150,   // Option for minimum width of the control
    maxWidth: 0      // Option for maximum width, 0 for no limit
  },

  _addDragAndDrop: function () {
    var self = this;
    if (typeof Sortable === 'undefined') {
      console.error('SortableJS library not found. Drag and drop functionality is disabled.');
      return;
    }
    Sortable.create(this._overlaysList, {
      animation: 150,
      onMove: (evt, originalEvent) => {
        var objDragged = self._getLayer(evt.dragged.layerId);
        var objRelated = self._getLayer(evt.related.layerId);
        if (!objDragged || !objRelated) return;
        var zIndexDragged = self._getZIndex(objDragged);
        var zIndexRelated = self._getZIndex(objRelated);
        objDragged.layer.setZIndex(zIndexRelated);
        objRelated.layer.setZIndex(zIndexDragged);
      },
      onEnd: (evt) => {
        self._map.fire("changelayers");
        self._update();
      },
    });
  },

  onAdd: function (map) {
    this._initLayout();
    this._update();
    this._map = map;
    map.on("zoomend", this._checkDisabledLayers, this);
    for (var i = 0; i < this._layers.length; i++) {
      this._layers[i].layer.on("add remove", this._onLayerChange, this);
    }
    if (this.options.dragging) {
      this._addDragAndDrop();
    }
    return this._container;
  },

  _update: function () {
    if (!this._container) {
      return;
    }
    L.DomUtil.empty(this._baseLayersList);
    L.DomUtil.empty(this._overlaysList);
    this._layerControlInputs = [];
    var baseLayersPresent,
      overlaysPresent,
      i,
      obj,
      baseLayersCount = 0;
    var overlaysLayers = [];
    for (i = 0; i < this._layers.length; i++) {
      obj = this._layers[i];
      if (!obj.overlay) {
        this._addItem(obj);
      } else {
        var zIndex = this._getZIndex(obj);
        while(overlaysLayers[zIndex]) {
            zIndex++;
        }
        overlaysLayers[zIndex] = obj;
      }
      overlaysPresent = overlaysPresent || obj.overlay;
      baseLayersPresent = baseLayersPresent || !obj.overlay;
      baseLayersCount += !obj.overlay ? 1 : 0;
    }
    for (i = overlaysLayers.length - 1; i >= 0; i--) {
      if (overlaysLayers[i]) {
        this._addItem(overlaysLayers[i]);
      }
    }
    if (this.options.hideSingleBase) {
      baseLayersPresent = baseLayersPresent && baseLayersCount > 1;
      this._baseLayersList.style.display = baseLayersPresent ? "" : "none";
    }
    this._separator.style.display = overlaysPresent && baseLayersPresent ? "" : "none";
    if (this.options.autoWidth) {
        this._adjustWidth();
    }
    return this;
  },
  
  // --- REVISED: Corrected auto-width calculation ---
  _adjustWidth: function() {
    // Use setTimeout to run this after the browser has rendered the new items
    setTimeout(() => {
        if (!this._container) { return; }

        // Reset width to auto to measure correctly
        this._container.style.width = 'auto';

        let maxWidth = this.options.minWidth || 0;
        const rows = this._container.querySelectorAll('.leaflet-row');

        rows.forEach(row => {
            // scrollWidth gives the true width of the content, even if it's not currently visible
            const currentWidth = row.scrollWidth;
            if (currentWidth > maxWidth) {
                maxWidth = currentWidth;
            }
        });

        // Apply max width limit if specified
        if (this.options.maxWidth && this.options.maxWidth > 0 && maxWidth > this.options.maxWidth) {
          maxWidth = this.options.maxWidth;
        }

        // Set the container width, adding a small buffer for padding/borders/scrollbars
        if (maxWidth > 0) {
           this._container.style.width = (maxWidth + 25) + 'px';
        }
    }, 0);
  },

  _addItem: function (obj) {
    var leafletRow = L.DomUtil.create("div", "leaflet-row");
    var label = document.createElement("label"),
      checked = this._map.hasLayer(obj.layer),
      input;
    if (obj.overlay) {
      input = document.createElement("input");
      input.type = "checkbox";
      input.className = "leaflet-control-layers-selector";
      input.defaultChecked = checked;
    } else {
      input = this._createRadioElement("leaflet-base-layers_" + L.Util.stamp(this), checked);
    }
    this._layerControlInputs.push(input);
    input.layerId = L.Util.stamp(obj.layer);
    var leaflet_id = input.layerId;
    if (this.options.dragging) {
      leafletRow.layerId = input.layerId;
    }
    L.DomEvent.on(input, "click", this._onInputClick, this);
    var name = document.createElement("span");
    name.innerHTML = " " + obj.name;
    var leafletInput = L.DomUtil.create("div", "leaflet-input");
    leafletInput.appendChild(input);
    var icon = L.DomUtil.create("label", "leaflet-icon");
    if (!input.id) {
        input.id = 'leaflet-control-layers-id-' + leaflet_id;
    }
    icon.htmlFor = input.id;
    leafletInput.appendChild(icon);
    leafletRow.appendChild(leafletInput);
    var leafletName = L.DomUtil.create("div", "leaflet-name");
    label.htmlFor = input.id;
    if (obj.overlay) {
        var delButton = document.createElement('span');
        var layerName = obj.name.replace(/'/g, "\\'");
        delButton.innerHTML = `<span onclick="delGeoJSONLayer(${leaflet_id}, '${layerName}')" style="cursor: pointer;" class="ui-icon ui-icon-minus"></span>`;
        leafletName.appendChild(delButton);
    }
    leafletName.appendChild(label);
    label.appendChild(name);
    leafletRow.appendChild(leafletName);
    var container;
    if (obj.overlay) {
      if (!this.options.dragging) {
        var leafletUp = L.DomUtil.create("div", "leaflet-up");
        L.DomEvent.on(leafletUp, "click", this._onUpClick, this);
        leafletUp.layerId = input.layerId;
        leafletRow.appendChild(leafletUp);
        var leafletDown = L.DomUtil.create("div", "leaflet-down");
        leafletDown.layerId = input.layerId;
        L.DomEvent.on(leafletDown, "click", this._onDownClick, this);
        leafletRow.appendChild(leafletDown);
      }
      container = this._overlaysList;
    } else {
      container = this._baseLayersList;
    }
    container.appendChild(leafletRow);
    this._checkDisabledLayers();
    return label;
  },

  _onDownClick: function (e) {
    var layerId = e.currentTarget.layerId;
    var obj = this._getLayer(layerId);
    if (!obj || !obj.overlay) { return; }
    var inputs = this._layerControlInputs;
    var replaceLayer = null;
    var idx = this._getZIndex(obj);
    for (var i = 0; i < inputs.length; i++) {
      var auxLayer = this._getLayer(inputs[i].layerId);
      if (!auxLayer) continue;
      var auxIdx = this._getZIndex(auxLayer);
      if (auxLayer.overlay && idx - 1 === auxIdx) {
        replaceLayer = auxLayer;
        break;
      }
    }
    if (replaceLayer) {
      var newZIndex = idx - 1;
      obj.layer.setZIndex(newZIndex);
      replaceLayer.layer.setZIndex(newZIndex + 1);
      this._update();
      this._map.fire("changelayers");
    }
  },

  _onUpClick: function (e) {
    var layerId = e.currentTarget.layerId;
    var obj = this._getLayer(layerId);
    if (!obj || !obj.overlay) { return; }
    var inputs = this._layerControlInputs;
    var replaceLayer = null;
    var idx = this._getZIndex(obj);
    for (var i = 0; i < inputs.length; i++) {
      var auxLayer = this._getLayer(inputs[i].layerId);
      if (!auxLayer) continue;
      var auxIdx = this._getZIndex(auxLayer);
      if (auxLayer.overlay && idx + 1 === auxIdx) {
        replaceLayer = auxLayer;
        break;
      }
    }
    if (replaceLayer) {
      var newZIndex = idx + 1;
      obj.layer.setZIndex(newZIndex);
      replaceLayer.layer.setZIndex(newZIndex - 1);
      this._update();
      this._map.fire("changelayers");
    }
  },

  _addLayer: function (layer, name, overlay) {
    if (this._map) {
      layer.on("add remove", this._onLayerChange, this);
    }
    this._layers.push({
      layer: layer,
      name: name,
      overlay: overlay,
    });
    if (this.options.sortLayers) {
      this._layers.sort(
        L.Util.bind(function (a, b) {
          return this.options.sortFunction(a.layer, b.layer, a.name, b.name);
        }, this)
      );
    }
    if (this.options.autoZIndex && layer.setZIndex) {
      this._lastZIndex = (this._lastZIndex || 0) + 1;
      layer.setZIndex(this._lastZIndex);
    }
    this._expandIfNotCollapsed();
  },

  _getZIndex: function (obj) {
    if (!obj || !obj.layer) { return 0; }
    var zIndex = 0;
    if (obj.layer.options && typeof obj.layer.options.zIndex !== 'undefined') {
      zIndex = obj.layer.options.zIndex;
    } else if (obj.layer.getLayers && obj.layer.eachLayer) {
      var minZ = Infinity;
      obj.layer.eachLayer((layer) => {
        if (layer.options && typeof layer.options.zIndex !== 'undefined') {
          minZ = Math.min(layer.options.zIndex, minZ);
        }
      });
      if (minZ !== Infinity) { zIndex = minZ; }
    } else if (this.options.autoZIndex && obj.overlay) {
        zIndex = obj.layer._leaflet_id;
    }
    return zIndex;
  },
});

L.control.orderlayers = function (baseLayers, overlays, options) {
  return new L.Control.OrderLayers(baseLayers, overlays, options);
};
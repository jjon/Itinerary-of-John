/*==================================================
 *  King John's Reign Ether Painter
 *==================================================
 */
 
Timeline.KingJohnsReignEtherPainter = function(params) {
    this._params = params;
    this._theme = params.theme;
};

Timeline.KingJohnsReignEtherPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._backgroundLayer = band.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background"); // for debugging
    this._backgroundLayer.style.background = this._theme.ether.backgroundColors[band.getIndex()];
    
    this._markerLayer = null;
    this._lineLayer = null;
    
    var align = ("align" in this._params) ? this._params.align : 
        this._theme.ether.interval.marker[timeline.isHorizontal() ? "hAlign" : "vAlign"];
    var showLine = ("showLine" in this._params) ? this._params.showLine : 
        this._theme.ether.interval.line.show;
        
    this._intervalMarkerLayout = new Timeline.EtherIntervalMarkerLayout(
        this._timeline, this._band, this._theme, align, showLine);
        
    this._highlight = new Timeline.EtherHighlight(
        this._timeline, this._band, this._theme, this._backgroundLayer);
}

Timeline.KingJohnsReignEtherPainter.prototype.setHighlight = function(startDate, endDate) {
    this._highlight.position(startDate, endDate);
}

Timeline.KingJohnsReignEtherPainter.prototype.paint = function() {
    if (this._markerLayer) {
        this._band.removeLayerDiv(this._markerLayer);
    }
    this._markerLayer = this._band.createLayerDiv(100);
    this._markerLayer.setAttribute("name", "ether-markers"); // for debugging
    this._markerLayer.style.display = "none";
    
    if (this._lineLayer) {
        this._band.removeLayerDiv(this._lineLayer);
    }
    this._lineLayer = this._band.createLayerDiv(1);
    this._lineLayer.setAttribute("name", "ether-lines"); // for debugging
    this._lineLayer.style.display = "none";
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    var yearIndex = Timeline.KingJohnsReignEtherPainter._regnalYears.find(function(year) {
            return year.startDate.getTime() - minDate.getTime();
        }
    );
    
    var l = Timeline.KingJohnsReignEtherPainter._regnalYears.length();
    for (var i = yearIndex; i < l; i++) {
        var year = Timeline.KingJohnsReignEtherPainter._regnalYears.elementAt(i);
        if (year.startDate.getTime() > maxDate.getTime()) {
            break;
        }
        
        var d = year.startDate;
        var labeller = {
            labelInterval: function(date, intervalUnit) {
                return {
                    text: (i + 1)+" John",
                    emphasized: true
                };
            }
        };
        
        this._intervalMarkerLayout.createIntervalMarker(
            d, labeller, Timeline.DateTime.YEAR, this._markerLayer, this._lineLayer);
    }
    this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};

Timeline.KingJohnsReignEtherPainter.prototype.softPaint = function() {
};

/*==================================================
 *  Span Highlight Decorator
 *==================================================
 */

Timeline.KingJohnsReignDecorator = function(params) {
    this._color = params.color;
};

Timeline.KingJohnsReignDecorator.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._layerDiv = null;
};

Timeline.KingJohnsReignDecorator.prototype.paint = function() {
    if (this._layerDiv != null) {
        this._band.removeLayerDiv(this._layerDiv);
    }
    this._layerDiv = this._band.createLayerDiv(10);
    this._layerDiv.setAttribute("name", "king-johns-reign-decorator"); // for debugging
    this._layerDiv.style.display = "none";
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    var yearIndex = Timeline.KingJohnsReignEtherPainter._regnalYears.find(function(year) {
            return year.startDate.getTime() - minDate.getTime();
        }
    );
    
    var doc = this._timeline.getDocument();
        
    var l = Timeline.KingJohnsReignEtherPainter._regnalYears.length();
    for (var i = yearIndex; i < l; i++) {
        var year = Timeline.KingJohnsReignEtherPainter._regnalYears.elementAt(i);
        var d = year.startDate;
        if (d.getTime() > maxDate.getTime()) {
            break;
        }
        
        var pixel = this._band.dateToPixelOffset(d);
       
        var table = doc.createElement("table");
        
        table.style.position = "absolute";
        table.style.overflow = "hidden";
        table.style.left = pixel + "px";
        table.style.width = "8em";
        table.style.top = "0px";
        table.style.height = "100%";
        table.style.fontFamily = "Garamond";
        table.style.fontSize = "300%";
        table.style.fontWeight = "bold";
        table.style.color = this._color;
        
        table.insertRow(0).insertCell(0).appendChild(doc.createTextNode((i + 1)+" John"));

        this._layerDiv.appendChild(table);
    }
    this._layerDiv.style.display = "block";
};

Timeline.KingJohnsReignDecorator.prototype.softPaint = function() {
};

/*==================================================
 *  Data Initialization
 *==================================================
 */
(function() {
    var johnsRegnalYearRawDates = [
        { startDate: "1199-05-27", endDate: "1200-05-17" },
        { startDate: "1200-05-18", endDate: "1201-05-02" },
        { startDate: "1201-05-03", endDate: "1202-05-22" },
        { startDate: "1202-05-23", endDate: "1203-05-14" },
        { startDate: "1203-05-15", endDate: "1204-06-02" },
        { startDate: "1204-06-03", endDate: "1205-05-18" },
        { startDate: "1205-05-19", endDate: "1206-05-10" },
        { startDate: "1206-05-11", endDate: "1207-05-30" },
        { startDate: "1207-05-31", endDate: "1208-05-14" },
        { startDate: "1208-05-15", endDate: "1209-05-06" },
        { startDate: "1209-05-07", endDate: "1210-05-26" },
        { startDate: "1210-05-27", endDate: "1211-05-11" },
        { startDate: "1211-05-12", endDate: "1212-05-02" },
        { startDate: "1212-05-03", endDate: "1213-05-22" },
        { startDate: "1213-05-23", endDate: "1214-05-07" },
        { startDate: "1214-05-08", endDate: "1215-05-27" },
        { startDate: "1215-05-28", endDate: "1216-05-18" },
        { startDate: "1216-05-19", endDate: "1216-10-19" }
    ];
    var johnsRegnalYearDates = [];
    for (var i = 0; i < johnsRegnalYearRawDates.length; i++) {
        var o = johnsRegnalYearRawDates[i];
        
        johnsRegnalYearDates.push({
            startDate:  Timeline.DateTime.parseIso8601DateTime(o.startDate),
            endDate:    Timeline.DateTime.parseIso8601DateTime(o.endDate)
        });
    }
    
    Timeline.KingJohnsReignEtherPainter._regnalYears = new SimileAjax.SortedArray(
        function(e1, e2) {
            return e1.startDate.getTime() - e2.startDate.getTime();
        },
        johnsRegnalYearDates
    );
})();
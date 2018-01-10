


/*==========================================================
 * Initialize Timeline and Map and data Gazetteer objects.
 *==========================================================
 */
//globals tl, map, eventVar, places_json, hardyDict, places_json_keys
//create a namespace for the data objects?


/*==========================================================================
 *  I don't know if this is any better than using a script tag to load a js
 *  file containing the places_json object definition, but it seems to be more
 *  idiomatic. And in the same breath we can generate the hardyDict (in case we
 *  should need it
 *==========================================================================
 */
places_json = {};
hardyDict = {};
places_json_keys = []; //to use for the autocomplete which is in the onLoad function

jQuery.getJSON("./data/Gazetteer.json", function(data){
    places_json = data;
    places_json_keys = Object.keys(places_json);
    var plist = Object.values(data)
    for (var x=0; x<plist.length; x++){
        var d = plist[x]
        if (!hardyDict[d['Hardy Name']]){
            hardyDict[d['Hardy Name']] = [d];
        } else {
            hardyDict[d['Hardy Name']].push(d);
        };
    };

    //an array of hardyDict keys that have multiple members
    hardyDict.multiples = Object.keys(hardyDict).filter(function(x){if (hardyDict[x].length > 1){return x;}})
});




function onLoad() {
    // This onLoad function is now called in the google maps callback in the jsconfig.js script
    
	// Initialize google map
	map = new google.maps.Map(document.getElementById('map'), {
        zoom: 6,
        center: new google.maps.LatLng(50.2, -.5),
        mapTypeId: google.maps.MapTypeId.TERRAIN
    });

    iwindow = new google.maps.InfoWindow({
        maxWidth: 400
    });
    
    var lat, lng, nts, notes, icon, marker, iwcontent, x;
    var place, county, hardy, modernName, comments, references, notesQueries;

//gaz entry example: 
/*"Placename": "Melksham", 
        "County/Dept": "Wiltshire", 
        "Comments": [
            "Saxon origins at fording point over the River Avon", 
            "Royal demesne with extensive forests at this time"
        ], 
        "Hardy Name": "Melksham, Wiltshire", 
        "LatLong": [
            51.373553, 
            -2.137898
        ], 
        "References": [
            "Melbourne - Mells', A Topographical Dictionary of England (1848), pp. 283-287. URL: http://www.british-history.ac.uk/report.aspx?compid=51142&strquery=melksham Date accessed: 21 June 2014", 
            "https://en.wikipedia.org/wiki/Melksham ;  accessed 16 Aug 2015", 
            "http://www.melkshamtown.co.uk/about-melksham/about-melksham ;  accessed 16 Aug 2015"
        ], 
        "notes&queries": [], 
        "Modern Name": "No name change"
 
 */


    for (var x in places_json) {
        var record = places_json[x];
        lat = record.LatLong[0] ? record.LatLong[0] : 0;
        lng = record.LatLong[1] ? record.LatLong[1] : 0;
        /* 
        These ternary operators work to set lat/lng to 0. This is an ugly hack to fix and even uglier bug that may, or may not, result from having latlng undefined (that would be 2 places in places_json). The bug throws "Uncaught RangeError: Maximum call stack size exceeded" and somebody on stackoverflow thinks its because of undefined latlng. <https://stackoverflow.com/questions/15671480/uncaught-rangeerror-maximum-call-stack-size-exceeded-google-maps-when-i-try-to> This would seem to be the case because on rapid scrolling past "1200-07-16" "Bois, Saintonge" or "1213-04-08" "Inter Porchester Et Farnham" seems to force the RangeError. latlng 0,0 isn't optimal (because it's a real place) but it'll do because we leave hidden the markers found in the null_coords list in updateMap(), see below.
        */
        place = record.Placename? record.Placename : '';
        county = record['County/Dept']? record['County/Dept'] : '';
        hardy = record['Hardy Name']? record['Hardy Name'] : '';
        modernName = record['Modern Name']? record['Modern Name'] : '';
        
        visits = document.createElement('select');
        vcount = record.visits.length;
        for (var v = 0; v < vcount; v++){
            var opt = document.createElement('option');
            opt.innerHTML = record.visits[v];
            opt.value = record.visits[v];
            visits.appendChild(opt);
        };

        comments = record.Comments ? jQuery.map(record.Comments, function (x){return "<li>" + x + "</li>"}).join('') : undefined;        
        references = record.References? jQuery.map(record.References, function (x){return "<li>" + x + "</li>"}).join('') : undefined;        
        notesQueries = record['notes&queries']? jQuery.map(record['notes&queries'], function (x){return "<li>" + x + "</li>"}).join('') : undefined;
        
        //nts = record.notes; TODO: transfer Kanter's notes
        //TODO: provide properties for all the dlist item fields
        
        //a sort of jQuery listcomp to get notes elements if we've got 'em and generate paragraphs, one per list element.
        notes = nts ? jQuery.map(nts, function (x){return '<p>' + x + '</p>'}).join('') : undefined;

        icon = 'Images/red.png';
        
        iwcontent = '<div class="iwcontent"><table>\
            <tr><td class="rubric">Location</td><td class="tvalue">' + place + ', ' + county + '</td></tr>\
            <tr><td class="rubric">Hardy\'s Placename </td><td class="tvalue">' + hardy + '</td></tr>\
            <tr><td class="rubric">Hardy records ' + vcount +' visits here</td><td id="Visits" class="tvalue">\
                <select onchange="centerTimeline(this.value)">\
                <option>select a date to move timeline</option>' + visits.innerHTML + '</select></td></tr>\
            <tr><td class="rubric">LatLong </td><td class="tvalue">' + lat + ', ' + lng +'</td></tr>\
            <tr><td class="rubric">Modern Name </td><td class="tvalue">' + modernName + '</td></tr>\
            <tr><td class="rubric">Comments </td><td class="tvalue"><ul>' + comments + '</ul></td></tr>\
            <tr><td class="rubric">References </td><td class="tvalue"><ul>' + references + '</ul></td></tr>\
            <tr><td class="rubric">notes&queries </td><td class="tvalue">' + notesQueries + '</td></tr>\
            </table>'
        
        
        iwcontent = notes ? iwcontent + notes + '</div>': iwcontent + '</div>';
           
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat,lng),
            icon: icon,
            map: map,
            iwindow_content: iwcontent
        });
        
        marker.setVisible(false);
        record.placemark = marker;
        record.iwindow = iwindow;

        google.maps.event.addListener(marker, 'click', (function(marker, x) {
		    
            return function() {
                Shadowbox.open({
                    options: {
                        animate: false,
                        onOpen: function(){
                            $('#shadowbox_title_inner').css({
                                'font-size': '36px',
                                'padding': '24px 0'
                            });
                        },
                        onClose: function(){
                            $('#shadowbox_title_inner').css({
                                'font-size': '12px',
                                'padding': '5px 0'
                            });
                        }
                    },
                    content: marker.iwindow_content,
                    player: "html",
                    title: x,
                    height: 600,
                    width: 800
                });
            }
        })(marker, x));
        

/* 
        google.maps.event.addListener(marker, 'click', (function(marker, x) {
            return function() {
                iwindow.setContent(marker.iwindow_content);
                iwindow.open(map, marker)
            }
        })(marker, x));
 */

        
    }
    
	// Initialize Timeline
	var eventSource = new Timeline.DefaultEventSource();
	var eventSourceNarrative = new Timeline.DefaultEventSource();
	
	var johnTheme = Timeline.ClassicTheme.create();
		johnTheme.ether.backgroundColors[1] = "#88AA99";
		johnTheme.event.duration.color = "#FFEECC";
		johnTheme.event.instant.icon = "Images/oxblood-square.png";
		johnTheme.event.bubble.width = 400;
	
	var theme = Timeline.ClassicTheme.create();
		theme.event.instant.icon = "Images/blue-diamond.png";
		theme.event.highlightColors =  ["#FFFF00", "#FFC000", "#FF0000"];
		theme.event.duration.color = "#449";
/* 
// note that we can not only set the properties that are created, but also
// hijack other elements of the theme module like this titleStyler function. All
// it does is set a class name for the title element (why does it need a
// function for that? because it happens when it's called by either painters.js
// or sources.js) but we can redefine it here to do other stuff as well
		theme.event.bubble.titleStyler = function(elmt) {
            elmt.className = "timeline-event-bubble-title";
        
            var showme = document.createElement("button");
            showme.className = "showme-button";
            showme.innerHTML = 'showmesomething';
            showme.addEventListener ("click", function() {
                console.log(places_json);
                SimileAjax.WindowManager.cancelPopups();
            });
            elmt.appendChild(showme);
        };
 */
	
	var bandInfos = [
		Timeline.createBandInfo({
			eventSource: eventSourceNarrative,
			date: "May 10 1199 00:00:00 GMT",
			width: "40%",  
			align: "Bottom",
			intervalUnit: Timeline.DateTime.MONTH,
			intervalPixels: 52,
			theme: johnTheme
		}),
		Timeline.createBandInfo({
			overview: true,
			eventSource: eventSource,
			date: "May 10 1199 00:00:00 GMT",
			width: "10%",
			intervalUnit: Timeline.DateTime.MONTH, 
			intervalPixels: 52,
			theme: johnTheme
		}),
		Timeline.createBandInfo({
			eventSource: eventSource,
			date: "May 10 1199 00:00:00 GMT",
			width: "50%",
			intervalUnit: Timeline.DateTime.DAY, 
			intervalPixels: 80,
			theme: theme
		})
	];
	
	bandInfos[0].syncWith = 2;
	bandInfos[0].highlight = true;

	bandInfos[1].etherPainter = new Timeline.KingJohnsReignEtherPainter({ theme: johnTheme }); // dfhuynh
	bandInfos[1].highlight = true;
	bandInfos[1].syncWith = 2;
	
	// note that I'm not using a loop to set these decorators because I want them to be different (ie. no label in band[1]
	bandInfos[0].decorators = [
		new Timeline.SpanHighlightDecorator({
			startDate:  "Mar 24 1208",
			endDate:    "1214",
			color:      "#FFC000",
			opacity:    20,
			fontFamily: "Times",
			startLabel: "Interdict&rArr;",
			endLabel:   "&lArr;Interdict",
			theme:      theme
		}),
		new Timeline.PointHighlightDecorator({
			date:       "May 27 1199 00:00:00 GMT",
			color:      "#FF9500",
			opacity:    70,
			theme:      theme
		})
	];

	bandInfos[1].decorators = [
		new Timeline.SpanHighlightDecorator({
			startDate:  "Mar 24 1208",
			endDate:    "1214",
			color:      "#FFC000",
			opacity:    20,
			startLabel: "",
			endLabel:   "",
			theme:      theme
		}),
		new Timeline.PointHighlightDecorator({
			date:       "May 27 1199 00:00:00 GMT",
			color:      "#FF9500",
			opacity:    70,
			theme:      theme
		})
	];

	bandInfos[2].decorators = [
		new Timeline.SpanHighlightDecorator({
			startDate:  "Mar 24 1208",
			endDate:    "1214",
			color:      "#FFC000",
			opacity:    20,
			startLabel: "Interdict&rArr;",
			endLabel:   "&lArr;Interdict",
			theme:      theme
		}),
		new Timeline.PointHighlightDecorator({
			date:       "May 27 1199 00:00:00 GMT",
			color:      "#FF9500",
			opacity:    70,
			theme:      theme
		})
	];

	 bandInfos[2].decorators.push(new Timeline.KingJohnsReignDecorator({
		color:      "#FF9500",
		theme:      theme
	}));

	tl = Timeline.create(document.getElementById("JohnItinerary"), bandInfos);
		
	tl.loadJSON("data/Itinerary.js", function(json, url) {
	    eventVar = json; //jsust so I can see it in the console.
	    eventSource.loadJSON(json, url);  
	});

	tl.loadXML("data/narrative.xml", function(xml, url) { eventSourceNarrative.loadXML(xml, url); updateMap()}); 
	
	setupFilterHighlightControls(document.getElementById("controls"), tl, [0,1,2], theme);
	
	tl.getBand(2).scrollToCenter(Timeline.DateTime.parseGregorianDateTime("May 27 1199 00:00:00 GMT"));
	

// Hide/Show map markers in response to onScroll events
	var b2 = tl.getBand(2);
	b2.addOnScrollListener(function(){
	    iwindow.close();
	    updateMap();
	});			
	


// Duh! had to put this in the onLoad callback where it works just fine.
    jQuery("#searchplaces").autocomplete({
        source: places_json_keys,
        appendTo: $("#Places"),
        select: function( event, ui ) {showGeodataSB(ui.item.value);}
    });





}// end of onLoad
	

	
var resizeTimerID = null;
function onResize() {
	if (resizeTimerID == null) {
		resizeTimerID = window.setTimeout(function() {
			resizeTimerID = null;
			tl.layout();
		}, 500);
	}
}


/*=====================================================
 *  Extend Date with addDays and subtractDays methods
 *  without arguments, defaults to one day.
 *=====================================================
 */

Date.prototype.addDays = function(days){
    var days = days ? days : 1;
    return this.setDate(this.getDate() + days);}
    
Date.prototype.subtractDays = function(days){
    var days = days ? days : 1;
    return this.setDate(this.getDate() - days);}


/*==================================================
 *  Update Map: Hide/Show map markers. pan Map.
 *==================================================
 */

function updateMap() {
	var b2 = tl.getBand(2);
	var dmax = b2.getMaxVisibleDate();
	// to get a smaller span of days: dmax = dmax.setDate(dmax.getDate() - 3);
	var dmin = b2.getMinVisibleDate();
	// to get a smaller span of days: dmin = dmin.setDate(dmin.getDate() + 3);
	var visiblePlaces = {};
	var iterator = b2.getEventSource().getEventIterator(dmin,dmax);
	var null_coords = ["Bois (1)", "Inter Porchester Et Farnham"];
	while (iterator.hasNext()) {
		visiblePlaces[iterator.next().getProperty('mapKey')] = true;
		//visiblePlaces[iterator.next().getText()] = true; //TODO use: iterator.next().getProperty('mapKey')
	}
	for (var x in places_json) {
		var placemark = places_json[x].placemark;
		if(x in visiblePlaces && null_coords.indexOf(x) == -1) {
			placemark.setVisible(true);
			
			if (!map.getBounds().contains(placemark.position)){
			    map.panTo(placemark.position);
			}
		} else {
			placemark.setVisible(false);
		}
	}
}


/*==================================================
 *  utility code for Map. filter events and plot on map
 *==================================================
 */
// Show all the markers for placenames matching a regex: 
// for (x in places_json)
// 	if (x.match(/normandie/i))
// 	places_json[x].placemark.show()

//// Get unique placenames (evt. title text) for all events in eventSource::
// This is the one that works, see lst2 for a method that doesn't!

// var b2 = tl.getBand(2);
// var iterator = b2.getEventSource().getAllEventIterator();
// var l = [];
// 
// while (iterator.hasNext()) {
//     var evtxt = iterator.next().getText();
//     if (l.indexOf(evtxt) < 0) {
// 		l.push(evtxt); //regex match here to push just the province, or place name
//     }
// }
// 
// gets:
// lst1 = 641

function showGeodataSB(location){
    location = location.split(',')[0];
    var mapmarker = places_json[location].placemark
    Shadowbox.open({
        options: {
            animate: false,
            onOpen: function(){
                $('#shadowbox_title_inner').css({
                    'font-size': '36px',
                    'padding': '24px 0'
                });
            },
            onClose: function(){
                $('#shadowbox_title_inner').css({
                    'font-size': '12px',
                    'padding': '5px 0'
                });
            }
        },
        content: mapmarker.iwindow_content,
        player: "html",
        title: location,
        height: 600,
        width: 800
    });

}

/*==================================================
 *  centerTimeline navigation links
 *==================================================
 */
function centerTimeline(date) {
    Shadowbox.close();
    tl.getBand(0).setCenterVisibleDate(Timeline.DateTime.parseGregorianDateTime(date));
    updateMap();
}

// use select element in the controls tab to center timeline on a particular year
function pickDate() {
	var jdate = $('#johnyears');
	jdate.blur();
	tl.getBand(0).setCenterVisibleDate(Timeline.DateTime.parseGregorianDateTime(jdate.val()));
	jdate.find('option:first').attr('selected', 'selected');
}

// called by onLoad to jumpstart map markers.
function scrollCenterTimeline(date) {
    tl.getBand(0).scrollToCenter(Timeline.DateTime.parseGregorianDateTime(date));
}

/*==================================================
 *  Hijack some more Timeline API stuff
 *==================================================
 */


// This fixes FF3 which wraps event labels to some small number.
// I don't know the source of the problem, but this remedies the symptom.
SimileAjax.Graphics._FontRenderingContext.prototype.computeSize = function(text) {
    this._elmt.innerHTML = text;
    return {
        width:  this._elmt.offsetWidth + 5,
        height: this._elmt.offsetHeight
    };
};
// is this still needed if I'm hosting 2.2?


/*---------------------- HACKING THE TL EVENT OBJECT ----------------------*/
//Timeline.OriginalEventPainter.prototype._showBubble calls evt.fillInfoBubble
//which calls this.fillDescription(divBody) (fillDescription takes a div element); so we can overload fillDescription
//here to get data out of the json event object and construct the elements shown
//in the event bubble. Another option might be to hack the
//Event.prototype.fillInfoBubble to add a separate <div> for the contents of the
//eventData Object.

Timeline.DefaultEventSource.Event.prototype.fillDescription = function(elmt) {
    // 'this' is the Event object;
    // TODO: generate a table from janet's data and provide a hide/show button
    // in the bubble
    // this method of the event object has only one line:
        elmt.innerHTML = this._description;
    
    // remainder below is my code
        isEvDat = !!this.getProperty('eventData');
        var evDat = this.getProperty('eventData');
        
        // TODO: consider just adding properties directly to the Event object,
        // rather than using this eventData object
        // TODO: Use a switch here to test for elements of the event data object?
        if (evDat != undefined && 'pageToLoad' in evDat){
            var pg = evDat.pageToLoad;
            var pgBut = document.createElement('button');
            pgBut.appendChild(document.createTextNode("Load Page: " + pg));
            pgBut.addEventListener("click", function(){
                SimileAjax.WindowManager.cancelPopups();
                loadPage(pg);
            });
            elmt.appendChild(pgBut);
        }
    }

Timeline.OriginalEventPainter.prototype._showBubble = function(x, y, evt) {
    var div = document.createElement("div");
    
/* ============================= my code follows =============================
/   we're going to use the OriginalEventPainter showBubble method to act on the
/   map markers: when a TL bubble is opened, the corresponding map marker is
/   bounced to identify it. Also we can here attach a button to the TL bubble
/   here where it has access to both place and mapmarker
/  ===========================================================================*/    
    var place = evt.getProperty("mapKey");
    var mapmarker = undefined;
    
    /* ==== on open tl bubble, bounce map marker ====*/
    if (place in places_json){
        mapmarker = places_json[place].placemark;
        mapmarker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                 mapmarker.setAnimation(null)
            }, 1600);
    }
    
    /* ==== add button to timeline bubble ====*/
    if (!!place){
        var geoButton = document.createElement("button");
        geoButton.className = "geobutton";
        geoButton.innerHTML = 'show data';
        geoButton.addEventListener ("click", function() {
            showGeodataSB(place);
            SimileAjax.WindowManager.cancelPopups();
        });
        div.appendChild(geoButton);
    }
    /* ============================ end my code  ============================ */
    
    var themeBubble = this._params.theme.event.bubble;
    evt.fillInfoBubble(div, this._params.theme, this._band.getLabeller());

    SimileAjax.WindowManager.cancelPopups();
    SimileAjax.Graphics.createBubbleForContentAndPoint(div, x, y,
        themeBubble.width, null, themeBubble.maxHeight);

};

/*  when we open a timeline bubble we can execute something on the corresponding map marker.
    Access the marker thus: marker = places_json["Nottingham, Nottinghamshire"].placemark
    and then do this:
    marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
             marker.setAnimation(null)
        }, 6000);
 */


// Timeline.OriginalEventPainter.prototype._showBubble=function(x,y,evt){
// 	console.log(evt);} // this returns id to console correctly
// 	id = evt.getID();
// 	text = evt.getText();
// 	start = evt.getStart();
// 	trackno = evt.getTrackNum();
// 	alert("id = " + id + " text = " + text + " start date = " + start + " track number = " + trackno);
// 	console.log(evt);
// 	
// 	//console.log(tl.getBand(0).getEventSource().getEvent(evt._id));
// 	//console.log(Timeline.EventUtils.decodeEventElID(ID)); 
// 
// }; 


// 
/*==================================================
 *  JohnSpanHighlightDecorator (courtesy of David Huynh)
 *  This code is now superceded by Timeline.SpanHighlightDecorator();
 *  However, it does have the spanText parameter if we need to insert
 *  some text into the span highlight. Boxes of scrolling text pinned to
 *  a period on a band reserved for such a purpose, might be a useful feature.
 *==================================================
 */ 
// 
// Timeline.JohnSpanHighlightDecorator = function(params) {
//     this._startDate = Timeline.DateTime.parseGregorianDateTime(params.startDate);
//     this._endDate = Timeline.DateTime.parseGregorianDateTime(params.endDate);
//     this._startLabel = params.startLabel;
//     this._endLabel = params.endLabel;
//     this._spanText = params.spanText;
//     this._color = params.color;
//     this._opacity = ("opacity" in params) ? params.opacity : 100;
// };
// 
// Timeline.JohnSpanHighlightDecorator.prototype.initialize = function(band, timeline) {
//     this._band = band;
//     this._timeline = timeline;
//     
//     this._layerDiv = null;
// };
// 
// Timeline.JohnSpanHighlightDecorator.prototype.paint = function() {
//     if (this._layerDiv != null) {
//         this._band.removeLayerDiv(this._layerDiv);
//     }
//     this._layerDiv = this._band.createLayerDiv(133); //in front of everything
//     this._layerDiv.setAttribute("name", "span-highlight-decorator"); // for debugging
//     this._layerDiv.style.display = "none";
//     
//     var minDate = this._band.getMinDate();
//     var maxDate = this._band.getMaxDate();
//     
//     if (this._startDate.getTime() < maxDate.getTime() && 
//         this._endDate.getTime() > minDate.getTime()) {
//         
//         minDate = new Date(Math.max(minDate.getTime(), this._startDate.getTime()));
//         maxDate = new Date(Math.min(maxDate.getTime(), this._endDate.getTime()));
//         
//         var minPixel = this._band.dateToPixelOffset(minDate);
//         var maxPixel = this._band.dateToPixelOffset(maxDate);
//         
//         var doc = this._timeline.getDocument();
//         
//         var createTable = function() {
//             var table = doc.createElement("table");
//             table.insertRow(0).insertCell(0);
//             return table;
//         };
//     
//         var div = doc.createElement("div");
//         div.style.position = "absolute";
//         div.style.overflow = "scroll"; // zIndex has to be over everything else
// /*         div.style.textAlign = "center"; */
//         div.style.color = "#000";/*  */
// /*         div.style.fontWeight = "bold"; */
// /*         div.style.fontSize = "160%"; */
//         div.innerHTML = this._spanText; // can be as much innerHTML as you like
//         div.style.background = this._color;
//         if (this._opacity < 100) {
//             Timeline.Graphics.setOpacity(div, this._opacity);
//         }
//         this._layerDiv.appendChild(div);
//             
//         var tableStartLabel = createTable();
//         tableStartLabel.style.position = "absolute";
//         tableStartLabel.style.overflow = "hidden";
//         tableStartLabel.style.fontSize = "300%";
//         tableStartLabel.style.fontWeight = "bold";
//         tableStartLabel.style.color = this._color;
//         tableStartLabel.rows[0].cells[0].innerHTML = this._startLabel;
//         this._layerDiv.appendChild(tableStartLabel);
//         
//         var tableEndLabel = createTable();
//         tableEndLabel.style.position = "absolute";
//         tableEndLabel.style.overflow = "hidden";
//         tableEndLabel.style.fontSize = "300%";
//         tableEndLabel.style.fontWeight = "bold";
//         tableEndLabel.style.color = this._color;
//         tableEndLabel.rows[0].cells[0].innerHTML = this._endLabel;
//         this._layerDiv.appendChild(tableEndLabel);
//         
//         if (this._timeline.isHorizontal()) {
//             div.style.left = minPixel + "px";
//             div.style.width = (maxPixel - minPixel) + "px";
//             div.style.top = "0px";
//             div.style.height = "100%";
//             
//             tableStartLabel.style.right = (this._band.getTotalViewLength() - minPixel) + "px";
//             tableStartLabel.style.width = (this._startLabel.length) + "em";
//             tableStartLabel.style.top = "0px";
//             tableStartLabel.style.height = "100%";
//             tableStartLabel.style.textAlign = "right";
//             
//             tableEndLabel.style.left = maxPixel + "px";
//             tableEndLabel.style.width = (this._endLabel.length) + "em";
//             tableEndLabel.style.top = "0px";
//             tableEndLabel.style.height = "100%";
//         } else {
//             div.style.top = minPixel + "px";
//             div.style.height = (maxPixel - minPixel) + "px";
//             div.style.left = "0px";
//             div.style.width = "100%";
//             
//             tableStartLabel.style.bottom = minPixel + "px";
//             tableStartLabel.style.height = "1.5px";
//             tableStartLabel.style.left = "0px";
//             tableStartLabel.style.width = "100%";
//             
//             tableEndLabel.style.top = maxPixel + "px";
//             tableEndLabel.style.height = "1.5px";
//             tableEndLabel.style.left = "0px";
//             tableEndLabel.style.width = "100%";
//         }
//     }
//     this._layerDiv.style.display = "block";
// }
// 
// Timeline.JohnSpanHighlightDecorator.prototype.softPaint = function() {
// };


/*==================================================
 *  Fix the soft keyboard bug. Touch on event in tl brought up
 *  the keyboard along with the bubble. Commenting out
 *  this._keyboardInput.focus(); fixed it.
 *==================================================
 */

Timeline._Band.prototype._onMouseUp = function(innerFrame, evt, target) {
/*  We can't just comment out _keyboardInput.focus(), 'cause that
    breaks the keyboard scrolling behavior for desktop. But, we can
    test for the mediaQuery, yay!
    (fix somethin' break somethin' else; fix that.) */
        
    this._dragging = false;
    if (window.matchMedia('(pointer: coarse)').matches){
        this._keyboardInput.blur()
    } else {
        this._keyboardInput.focus()
    }
};

/*==================================================
 *  setupFilterHighlightControls
 *  This has been altered to generate a table of one column instead of four
 *==================================================
 */

function setupFilterHighlightControls(div, timeline, bandIndices, theme) {
    var table = document.createElement("table");
    var tr = table.insertRow(0);
    
    var td = tr.insertCell(0);
    td.innerHTML = "Filter:";
    
    var handler = function(elmt, evt, target) {
        onKeyPress(timeline, bandIndices, table);
    };
    
    tr = table.insertRow(1);
    tr.style.verticalAlign = "top";
    
    td = tr.insertCell(0);
    
    var input = document.createElement("input");
    input.type = "text";
    SimileAjax.DOM.registerEvent(input, "keypress", handler);
    td.appendChild(input);
    
    
    tr = table.insertRow(2)
    td = tr.insertCell(0);
    td.innerHTML = "Highlight:";
    
    for (var i = 0; i < theme.event.highlightColors.length; i++) {
    	tr = table.insertRow(i + 3);
        td = tr.insertCell(0);
        
        input = document.createElement("input");
        input.type = "text";
        SimileAjax.DOM.registerEvent(input, "keypress", handler);
        td.appendChild(input);
        
        var divColor = document.createElement("div");
        divColor.style.height = "0.5em";
        divColor.style.background = theme.event.highlightColors[i];
        td.appendChild(divColor);
    }
    
    tr = table.insertRow(6);
    td = tr.insertCell(0);
    var button = document.createElement("button");
    button.innerHTML = "Clear All";
    SimileAjax.DOM.registerEvent(button, "click", function() {
        clearAll(timeline, bandIndices, table);
    });
    td.appendChild(button);
    
    div.appendChild(table);
}

var timerID = null;
function onKeyPress(timeline, bandIndices, table) {
    if (timerID != null) {
        window.clearTimeout(timerID);
    }
    timerID = window.setTimeout(function() {
        performFiltering(timeline, bandIndices, table);
    }, 300);
}
function cleanString(s) {
    return s.replace(/^\s+/, '').replace(/\s+$/, '');
}
function performFiltering(timeline, bandIndices, table) {
    timerID = null;
    
    var tr = table.rows[1];
    var text = cleanString(tr.cells[0].firstChild.value);
    
    var filterMatcher = null;
    if (text.length > 0) {
        var regex = new RegExp(text, "i");
        filterMatcher = function(evt) {
            return regex.test(evt.getText()) || regex.test(evt.getDescription());
        };
    }

    var regexes = [];
    var hasHighlights = false;
    for (var x = 3; x < 6; x++) {
        var input = table.rows[x].cells[0].firstChild;
        var text2 = cleanString(input.value);
        if (text2.length > 0) {
            hasHighlights = true;
            regexes.push(new RegExp(text2, "i"));
        } else {
            regexes.push(null);
        }
    }
    var highlightMatcher = hasHighlights ? function(evt) {
        var text = evt.getText();
        var description = evt.getDescription();
        for (var x = 0; x < regexes.length; x++) {
            var regex = regexes[x];
            if (regex != null && (regex.test(text) || regex.test(description))) {
                return x;
            }
        }
        return -1;
    } : null;
    
    for (var i = 0; i < bandIndices.length; i++) {
        var bandIndex = bandIndices[i];
        timeline.getBand(bandIndex).getEventPainter().setFilterMatcher(filterMatcher);
        timeline.getBand(bandIndex).getEventPainter().setHighlightMatcher(highlightMatcher);
    }
    timeline.paint();
}

function clearAll(timeline, bandIndices, table) {
    var inputs = [1,3,4,5]
    for (var x = 0; x < inputs.length; x++) {
        table.rows[inputs[x]].cells[0].firstChild.value = "";
    }
    
    for (var i = 0; i < bandIndices.length; i++) {
        var bandIndex = bandIndices[i];
        timeline.getBand(bandIndex).getEventPainter().setFilterMatcher(null);
        timeline.getBand(bandIndex).getEventPainter().setHighlightMatcher(null);
    }
    timeline.paint();
}


/*==================================================
* js utility functions
* ===================================================
*/

// Array.unique( strict ) - Remove duplicate values
Array.prototype.unique = function() {
	var a = [], i, l = this.length;
	for( i=0; i<l; i++ ) {
		if( a.indexOf( this[i], 0) < 0 ) {
			a.push( this[i] );
		}
 	}
	return a;
};


/*==================================================
* Toggle Div
* ===================================================
*/

function toggleDiv( whichLayer ){
		var elem, vis;
		if( document.getElementById ) // this is the way the standards work
			elem = document.getElementById( whichLayer );
		else if( document.all ) // this is the way old msie versions work
			elem = document.all[whichLayer];
		else if( document.layers ) // this is the way nn4 works
			elem = document.layers[whichLayer];
		vis = elem.style;
		// if the style.display value is blank we try to figure it out here
		if(vis.display==''&&elem.offsetWidth!=undefined&&elem.offsetHeight!=undefined)
		vis.display = (elem.offsetWidth!=0&&elem.offsetHeight!=0)?'block':'none';
		vis.display = (vis.display==''||vis.display=='block')?'none':'block';
}

/*==================================================
 * Tab Navigation
 * Tab navigation scripts and css from Author : Ali Roman, Published : June 05, 2006, at
 * http://www.aliroman.com/article/how-to-create-web-tabs-with-javascript-show-hide-layers-34-1.html
 *==================================================
 */

var last_tab = 'tab1';

function show(layerName) { 
	document.getElementById(layerName).style.display = '';
} 

function hide(layerName) { 
	document.getElementById(layerName).style.display = 'none';
}

function show_next(tab_name) {
	document.getElementById(last_tab).className = 'tab';
	var curr = document.getElementById(tab_name);
	curr.className='tab_showing';
	hide(last_tab+'_content');
	show(tab_name+'_content');
	last_tab=tab_name;
}

/*==================================================
 *  Pager
 *==================================================
 */ 
// Summary:
// loadPage([optional pg. no. param]) calls shadowbox.open() and once #page_images
// has loaded in the shadowbox the onFinish callback is called: pager(pgno)
// pager evaluates the incoming parameters if any and calls loadScan() to set the img src.

// Call shadowbox for page images and page image navigation.
// Note to self: loadPage was inside the $(document).ready function
// so invisible stuff like event info bubbles couldn't find it since they are created
// AFTER document.ready, right? So the call from the event info bubble looks like this:
// onclick=\"SimileAjax.WindowManager.cancelPopups(); loadPage('009');\"

// Is there any way to reach into such elements
// (which, I suppose are being created on the fly by simile ajax yes?)
// using jQuery selectors? 


function PadDigits(n, totalDigits){  // from: http://classicasp.aspfaq.com/general/how-do-i-pad-digits-with-leading-zeros.html
	n = n.toString(); 
	var pd = ''; 
	if (totalDigits > n.length){ 
		for (var i=0; i < (totalDigits-n.length); i++){ 
			pd += '0'; 
		} 
	} 
	return pd + n.toString(); 
};
	
function deromanize( roman ) {
	var input = roman.toUpperCase().split('');
	var lookup = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
	var num = 0;
	var val = 0;
	while (input.length) {
	val = lookup[input.shift()];
	num += val * (val < lookup[input[0]] ? -1:1);
	}
	return num;
};

function loadScan(pgToLoad){
	$('#shadowbox_title_inner').find('.loadgif').show();
	$('#shadowbox_content').find('#scan').attr('src', 'pageImages\/' + pgToLoad + '.jpg').load(function(){$('#shadowbox_title_inner').find('.loadgif').hide()});
	
}

function pager(pgreq){
    // would a `switch` be better somehow?
	var fld = $('#shadowbox_title_inner').find('#pagefield');
	var imageElement = $('#shadowbox_content').find('#scan');
	var pgNoRegex = new RegExp(/(^.*pageImages\/)(.*)(\.jpg)$/);
	var pgstr = pgNoRegex.exec(imageElement.attr('src'))[2];
	var pgNo = parseInt(pgstr, 10);
	
	if (/\d{3}/.test(pgreq)){
		loadScan(PadDigits(parseInt(parseInt(pgreq, 10))+77, 3));
	}
	else if (pgreq == "next"){
		if (pgNo < 351){
			loadScan(PadDigits(pgNo + 1, 3));
		} else {
			alert("no more pages");
		}
	}
	else if (pgreq == "prev"){
		if (pgNo - 1){
			loadScan(PadDigits(pgNo - 1, 3));
		} else {
		alert("no more pages");
		}
	}
	else if (pgreq == "indexTable"){
		var lst = $('#shadowbox_title_inner').find('#indexTable');
		lst.blur();
		loadScan(lst.val());
		$('#shadowbox_title_inner').find('#indexTable option:first').attr('selected', 'selected');
	}
	else if (pgreq == "indexNom"){
		var lst = $('#shadowbox_title_inner').find('#indexNom');
		lst.blur();
		loadScan(lst.val());
		$('#shadowbox_title_inner').find('#indexNom option:first').attr('selected', 'selected');
	}
	else if (pgreq == "indexLoc"){
		var lst = $('#shadowbox_title_inner').find('#indexLoc');
		lst.blur();
		loadScan(lst.val());
		$('#shadowbox_title_inner').find('#indexLoc option:first').attr('selected', 'selected');
	}	
	else if (pgreq == "pagefield"){
		if (fld.val().replace(/\s/g, "") >= 1 && fld.val().replace(/\s/g, "") <= 200){
			loadScan(PadDigits(parseInt(fld.val().replace(/\s/g, ""))+77, 3));
		} else if (fld.val().match(/[ivxlIVXL]/) && deromanize(fld.val().replace(/\s/g, "")) < 49){
			loadScan(PadDigits(deromanize(fld.val().replace(/\s/g, ""))+2, 3)); // this works!!!
			
		}  else {alert("Invalid page request");}	
	}
	
	fld.attr("value","");
}


function loadPage(pgno){
	Shadowbox.open({
		options: {
			onFinish: function(){pager(pgno);},
			enableKeys: false,
			overlayColor: "#110",
			onClose: function(){$('#shadowbox_title_inner select').hide();}
		},
		player: 'html',
		title: '<table width="100%" style="text-align: center; font-weight: bold"><tr><td><img src="Images/arrow-prev.png" alt="Previous page" style="cursor: pointer; vertical-align: middle;" onclick="pager(\'prev\');" />back</td><td>Itinerary Tables & Index:<br /><select id="indexTable" onchange="pager(\'indexTable\');"><option value="">Select a page</option><option value="052">May / A &mdash; Ash</option><option value="053">May / Ash &mdash; Bee</option><option value="054">June / Bee &mdash; Bra</option><option value="055">June / Bra &mdash; Cae</option><option value="056">July / Cae &mdash; Che</option><option value="057">July / Che &mdash; Cog</option><option value="058">August / Coi &mdash; Dev</option><option value="059">August / Dit &mdash; Egb</option><option value="060">September/ Egt &mdash; Fre</option><option value="061">September/ Fre &mdash; Gra</option><option value="062">October / Gra &mdash; Her</option><option value="063">October / Her &mdash; Kir</option><option value="064">November / Kir &mdash; Lin</option><option value="065">November / Lin &mdash; Lud</option><option value="066">December / Lud &mdash; Mau</option><option value="067">December / Mau &mdash; New</option><option value="068">January / New &mdash; Oar</option><option value="069">January / Odi &mdash; Poi</option><option value="070">February / Pon &mdash; Rhe</option><option value="071">February / Ric &mdash; Sai</option><option value="072">March / Sai &mdash; She</option><option value="073">March / She &mdash; Str</option><option value="074">April / Stu &mdash; Tro</option><option value="075">April / Tro &mdash; Wes</option><option value="076">Addenda / Wes &mdash; Yor</option></select></td><td width="50px"><img src="Images/loading2.gif" class="loadgif" style="display: none" /></td><td>Index Nominum:&nbsp;<select id="indexNom" onChange="pager(\'indexNom\');"><option value="">Select a page</option> <option value="278">A &mdash; Alb</option> <option value="279">Alb &mdash; And</option> <option value="280">And &mdash; Ath</option> <option value="281">Ath &mdash; Bap</option> <option value="282">Bar &mdash; Bel</option> <option value="283">Bel &mdash; Boc</option> <option value="284">Boc &mdash; Bre</option> <option value="285">Bre &mdash; Buk</option> <option value="286">Buk &mdash; Cam</option> <option value="287">Cam &mdash; Cap</option> <option value="288">Cap &mdash; Cha</option> <option value="289">Cha &mdash; Cle</option> <option value="290">Cle &mdash; Cle</option> <option value="291">Cle &mdash; Cor</option> <option value="292">Cor &mdash; Cuy</option> <option value="293">D &mdash; Dre</option> <option value="294">Dri &mdash; Egr</option> <option value="295">Ehi &mdash; Exo</option> <option value="296">Exo &mdash; Fil. C</option> <option value="297">Fil. C &mdash; Fil. P</option> <option value="298">Fil. P &mdash; Fil. W</option> <option value="299">Fil. W &mdash; Fun</option> <option value="300">Fun &mdash; Ger</option> <option value="301">Gra &mdash; Har</option> <option value="302">Har &mdash; Hib</option> <option value="303">Hib &mdash; Ins</option> <option value="304">Ins &mdash; Jud</option> <option value="305">Jud &mdash; Lan</option> <option value="306">Lan &mdash; Lex</option> <option value="307">Lex &mdash; Lon</option> <option value="308">Lon &mdash; Mal</option> <option value="309">Mal &mdash; Mar</option> <option value="310">Mar &mdash; Mon</option> <option value="311">Mon &mdash; Naz</option> <option value="312">Nec &mdash; Nor</option> <option value="313">Nor &mdash; Odo</option> <option value="314">Odo &mdash; Pat</option> <option value="315">Pat &mdash; Phi</option> <option value="316">Pic &mdash; Por</option> <option value="317">Por &mdash; Rec</option> <option value="318">Red &mdash; Ris</option> <option value="319">Riv &mdash; Ros</option> <option value="320">Ros &mdash; Sal</option> <option value="321">Sal &mdash; San</option> <option value="322">San &mdash; Sar</option> <option value="323">Sar &mdash; Sib</option> <option value="324">Sib &mdash; Sto</option> <option value="325">Str &mdash; Tes</option> <option value="326">Tes &mdash; Tre</option> <option value="327">Tre &mdash; Vav</option> <option value="328">Vee &mdash; Wal</option> <option value="329">Wal &mdash; Wen</option> <option value="330">Wen &mdash; Wil</option> <option value="331">Wil &mdash; Ypr</option> <option value="332">Ypr &mdash; Zac</option></select><br />Index Locorum:&nbsp;<select id="indexLoc" onChange="pager(\'indexLoc\');"> <option value="">Select a page</option> <option value="333">A &mdash; Arn</option> <option value="334">Art &mdash; Bin</option> <option value="335">Bin &mdash; Bur</option> <option value="336">Cad &mdash; Cla</option> <option value="337">Cla &mdash; Dil</option> <option value="338">Dil &mdash; Eyv</option> <option value="339">Fai &mdash; Gra</option> <option value="340">Gra &mdash; Hor</option> <option value="341">Hor &mdash; Lam</option> <option value="342">Lan &mdash; Lym</option> <option value="343">Lym &mdash; Myd</option> <option value="344">Nar &mdash; Ong</option> <option value="345">Orb &mdash; Qul</option> <option value="346">Rad &mdash; Sai</option> <option value="347">Sai &mdash; Sha</option> <option value="348">She &mdash; Tem</option> <option value="349">Ten &mdash; Wal</option> <option value="350">Wal &mdash; Wit</option> <option value="351">Wit &mdash; Zan</option> </select></td><td align="right">Go to page number:<br />Introduction: i &mdash; xlviii<br />Body text: 1 &mdash; 200</td><td><input style="margin-top: 10px" id="pagefield" maxlength="6" size="6" type="text" value=""></input>&nbsp;&nbsp<button id="chpgbut" value="Go" onClick="pager(\'pagefield\');">Go</button></td><td>forth<img src="Images/arrow-next.png" alt="Next Page" style="cursor: pointer; vertical-align: middle;" onclick="pager(\'next\');"/></td></tr></table>',
		height: 1000,
		width: 1000,
		content: $('#page_images').html()
	});
};



/*=========================================================================
 *  jQuery document.ready. NB: anything that relies on Itin. or Map DATA
 *  can't go here because it's all generated AFTER document.ready.
 *  (put it in onLoad)
 *=========================================================================
 */

$(document).ready(function($){ 
// initialize shadowbox and set options here.
    Shadowbox.init();

// Utility Wait function
    $.fn.wait = function(time, type) {
        time = time || 1000;
        type = type || "fx";
        return this.queue(type, function() {
            var self = this;
            setTimeout(function() {
                $(self).dequeue();
            }, time);
        });
    };

// Make an accordion from dl content. Opens w/.mefirst showing.
    $('#about_list dd').hide();
	$('#about_list dd.mefirst').show().prev().css({"background": "#FF9500", "color": "#221"});

	$('#about_list dt').click(function(){
		$thisdt = $(this);
		$thisdd = $(this).next();
		$("#about_list dd:visible").slideUp(function(){
			$thisdd.slideDown("slow");
			$thisdt.css({"background": "#FF9500", "color": "#221"});
		}).prev().css({"background": "#221", "color": "#FF9500"});
	});
	

// Set tab 4 to call loadPage
	$('#tab4').click(loadPage);

// How to use the SimileAjax code to create an info bubble on any element w/class .ttip:
// This one just reports the text in the span, but it could be anything.
// 4th parameter, contentWidth is optional: defaults to 300px.
    $('.ttip').click(function(ev){
        mouseX = ev.pageX;
        mouseY = ev.pageY;
        bubl = document.createElement('div');
        bubl.innerHTML = "<span>"+$(this).text()+"</span>";
        SimileAjax.Graphics.createBubbleForContentAndPoint(bubl, mouseX, mouseY, 100, 'bottom');
    });

/*==============================  SCROLL MOBILE  ==============================
 *  Well, whaddya know: this works. A bit crude, but now we can scroll timeline
 *  on mobile. Better would be to add the right listeners to the right
 *  elements to get real scrolling behavior for the bands. But this'll do.
 *=============================================================================
 */

    $("#rarrow").on('touchstart', function(touchevt){
        touchevt.preventDefault();
        $(this).addClass("active");
        intervalIDright = setInterval(function(){
            var b1 = tl.getBand(1)
            var b1input = $(".timeline-band-input > input").get(1)
            var e = jQuery.Event( "keydown", { keyCode: 39 } );
            b1._onKeyDown(b1input, e, b1input)    
        }, 30)
    });
    
    $("#rarrow").on('touchend', function(touchendevt) {
        $(this).removeClass("active");
        touchendevt.preventDefault();
        clearInterval(intervalIDright);
    });

    $("#larrow").on('touchstart', function(touchevt){
        touchevt.preventDefault();
        $(this).addClass("active");
        intervalIDleft = setInterval(function(){
            var b1 = tl.getBand(1)
            var b1input = $(".timeline-band-input > input").get(1)
            var e = jQuery.Event( "keydown", { keyCode: 37 } );
            b1._onKeyDown(b1input, e, b1input)    
        }, 30)
    });
    
    $("#larrow").on('touchend', function(touchendevt) {
        $(this).removeClass("active");
        touchendevt.preventDefault();
        clearInterval(intervalIDleft);
    });

}); // end $(document).ready()


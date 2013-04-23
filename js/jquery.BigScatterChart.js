var BigScatterChart = $.Class({
	$init : function(htOption){
		this.option({
			'sContainerId' : '',
			'sPrefix' : 'bigscatterchart-',
			'nWidth': 600,
			'nHeight': 400,
			'nXMin': 0, 'nXMax': 100,
			'nYMin': 0, 'nYMax': 100,
			'nZMin': 0, 'nZMax': 1,
			'nXSteps': 5,
			'nYSteps': 5,
			'nXLabel': null,
			'nYLabel': null,
			'nBubbleSize': 10,
			'nPaddingTop' : 40,
			'nPaddingRight' : 40,
			'nPaddingBottom' : 30,
			'nPaddingLeft' : 50,
			'sLineColor' : '#000',			
			'htTypeAndColor' : {
				'Success' : '#b6da54', // type name : color, also order
				'Warning' : '#fcc666',
				'Failed' : '#fd7865',
				'Others' : '#55c7c7'
			},
			'nZIndexForCanvas' : 1,
			'nDefaultRadius' : 3,
			'htGuideLine' : {
				'nLineWidth' : 1,
				'aLineDash' : [2, 5],
				'nGlobalAlpha' : 0.2
			},
			'sTitle' : 'Big Scatter Chart by Denny',
			'htTitleStyle' : {
				'font-size' : '12px',
				'font-weight' : 'bold'
			},
			'sXLabel' : '',
			'sYLabel' : '',
			'htLabelStyle' : {
				'font-size': '10px',
				'line-height': '20px',
				'height': '20px',
			},
			'sShowNoData' : 'No Data',
			'htShowNoDataStyle' : {
				'font-size' : '15px',
				'color' : '#000',
				'font-weight' : 'bold'
			},
			'sDragToSelectClassName' : 'jquery-drag-to-select',
			'fXAxisFormat' : function(nXStep, i){
				var nMilliseconds = (nXStep * i + this._nXMin),
					sDate = new Date(nMilliseconds).toString("HH:mm");
				return sDate; 
			},
			'fYAxisFormat' : function(nYStep, i){
				return this._addComma((this._nYMax + this._nYMin) - ((nYStep*i) + this._nYMin));
			}
		});
		this.option(htOption);
			
		this._initVariables();
		this._initElements();
		this._initEvents();
		this._drawXYAxis();
		this.updateXYAxis();

		// var self = this;
		// $('#saveAsPNG').click(function(e){
		// 	var welCanvas = self._mergeAllDisplay();
		// 	$(this).attr('href', welCanvas.get(0).toDataURL());
			
		// });
	},

	_initVariables : function(){		
		this._aBubbles = [];
		this._aBubbleStep = [];
		
		var nPaddingTop = this.option('nPaddingTop'),
			nPaddingLeft = this.option('nPaddingLeft'),
			nPaddingBottom = this.option('nPaddingBottom'),
			nPaddingRight = this.option('nPaddingRight'),
			nBubbleSize = this.option('nBubbleSize'),
			nWidth = this.option('nWidth'),
			nHeight = this.option('nHeight');

		this.option('nXSteps', this.option('nXSteps') - 1);
		this.option('nYSteps', this.option('nYSteps') - 1);

		if (this.option('nYLabel')) this._paddingLeft += 30;
		if (this.option('nXLabel')) this._paddingBottom += 20;

		this._nXWork = (nWidth - (nPaddingLeft + nPaddingRight)) - nBubbleSize * 2;
		this._nYWork = (nHeight - (nPaddingTop + nPaddingBottom)) - nBubbleSize * 2;		
		
		this._nXMax = this.option('nXMax');
		this._nXMin = this.option('nXMin');
				
		this._nYMax = this.option('nYMax');
		this._nYMin = this.option('nYMin');
		
		this._nZMax = this.option('nZMax');
		this._nZMin = this.option('nZMin');
		
		this._awelXNumber = [];
		this._awelYNumber = [];		

		this._htTypeCount = {};
	},

	_initElements : function(){
		var self = this,
			nXStep = this._nXWork / this.option('nXSteps'),
			nYStep = this._nYWork / this.option('nYSteps'),
			nHeight = this.option('nHeight'),
			nPaddingTop = this.option('nPaddingTop'),
			nPaddingLeft = this.option('nPaddingLeft'),
			nPaddingBottom = this.option('nPaddingBottom'),
			nPaddingRight = this.option('nPaddingRight'),
			nBubbleSize = this.option('nBubbleSize'),
			sLineColor = this.option('sLineColor'),
			htType = this.option('htTypeAndColor'),
			sPrefix = this.option('sPrefix'),
			nZIndexForCanvas = this.option('nZIndexForCanvas');

		// container
		this._welContainer = $('#' + this.option('sContainerId'));					
		this._welContainer.css({
			'position' : 'relative',
			'width' : this.option('nWidth'),
			'height' : this.option('nHeight'),
		});

		// guide
		this._welGuideCanvas = $('<canvas>')
			.attr({
				'width' : this.option('nWidth'),
				'height' : this.option('nHeight')
			}).css({
				'position' : 'absolute',
				'top' : 0,
				'z-index' : nZIndexForCanvas - 1
			}).append($('<div>')
				.width(this.option('nWidth'))
				.height(this.option('nHeight'))
				.text('Your browser does not support the canvas element, get a better one!')
				.css({
					'text-align': 'center',
					'background-color': '#8b2e19',
					'color': '#fff'
				})
			);
		this._welGuideCanvas.appendTo(this._welContainer);
		this._oGuideCtx = this._welGuideCanvas.get(0).getContext('2d');

		// plot chart for bubbles
		this._htwelChartCanvas = {};
		this._htBubbleCtx = {};		
		_.each(htType, function(sVal, sKey){
			this._htwelChartCanvas[sKey] = $('<canvas>')
				.addClass(sPrefix+sKey)
				.attr({
					'width' : this.option('nWidth'),
					'height' : this.option('nHeight')
				}).css({
					'position' : 'absolute',
					'top' : 0,
					'z-index' : nZIndexForCanvas++
				}).appendTo(this._welContainer);
			this._htBubbleCtx[sKey] = this._htwelChartCanvas[sKey].get(0).getContext('2d');
		}, this);

		// Axis
		this._welAxisCanvas = $('<canvas>')
			.attr({
				'width' : this.option('nWidth'),
				'height' : this.option('nHeight')
			}).css({
				'position' : 'absolute',
				'top' : 0,
				'z-index' : nZIndexForCanvas
			}).append($('<div>')
				.width(this.option('nWidth'))
				.height(this.option('nHeight'))
				.text('Your browser does not support the canvas element, get a better one!')
				.css({
					'text-align': 'center',
					'background-color': '#8b2e19',
					'color': '#fff'
				})
			);
		this._welAxisCanvas.appendTo(this._welContainer);
		this._oAxisCtx = this._welAxisCanvas.get(0).getContext('2d');

		// overlay for all the labels
		this._welOverlay = $('<div>').css({
			'position': 'absolute',
			'width': this.option('nWidth'),
			'height': this.option('nHeight'),
			'top': 0,
			'font-family': 'Helvetica, Arial, sans-serif',
			'z-index': 240
		});
		this._welOverlay.appendTo(this._welContainer);

		var htLabelStyle = this.option('htLabelStyle');
		// x axis
		for(var i=0; i<=this.option('nXSteps'); i++){
			this._awelXNumber.push($('<div>')
				.text(' ')
				.css({
					'position': 'absolute',
					'width': nXStep + 'px',
					'text-align': 'center',
					'top': (nHeight - nPaddingBottom + 10) + 'px',
					'left': (nPaddingLeft + nBubbleSize) - (nXStep / 2) + i * nXStep + 'px',
					'color': sLineColor
				})
				.css(htLabelStyle)
			);
		}

		// y axis
		for(var i=0; i<=this.option('nYSteps'); i++){
			this._awelYNumber.push($('<div>')
				.text(' ')
				.css({
					'position': 'absolute',
					'vertical-align': 'middle',
					'width': (nPaddingLeft - 15) + 'px',
					'text-align': 'right',
					'top': (nBubbleSize + (i * nYStep) + nPaddingTop - 10) + 'px',
					'left': '0px',
					'color': sLineColor
				})
				.css(htLabelStyle)
			);
		}
		this._welOverlay.append(this._awelXNumber);
		this._welOverlay.append(this._awelYNumber);	

		// sXLabel
		var sXLabel = this.option('sXLabel');
		if(_.isString(sXLabel) && sXLabel.length > 0){
			this._welOverlay.append(this._welXLabel = $('<div>')
									.text(sXLabel)
									.css(htLabelStyle)
									.css({
										'position': 'absolute',
										'text-align': 'center',
										'top': (nHeight - nPaddingBottom + 10) + 'px',
										'right': 0,
										'color': sLineColor
									})
			);
		}		

		// sYLabel
		var sYLabel = this.option('sYLabel');
		if(_.isString(sYLabel) && sYLabel.length > 0){
			this._welOverlay.append(this._welYLabel = $('<div>')
									.text(sYLabel)
									.css(htLabelStyle)
									.css({
										'position' : 'absolute',
										'vertical-align' : 'middle',
										'width': (nPaddingLeft - 15) + 'px',
										'text-align': 'right',
										'top': (nBubbleSize + nPaddingTop + 10) + 'px',
										'left': '0px',
										'color': sLineColor
									})
			);
		}

		// sShowNoData
		var sShowNoData = this.option('sShowNoData'),
			htShowNoDataStyle = this.option('htShowNoDataStyle');
		this._welShowNoData = $('<div>')
								.text(sShowNoData)
								.css(htShowNoDataStyle)
								.css({
									'position' : 'absolute',
									'top' : nHeight/2 + 'px',
									'width' : '100%',
									'text-align' : 'center'								
								});
		this._welOverlay.append(this._welShowNoData);
		
		// count per type to show up
		this._welTypeUl = $('<ul>')
			.css({
				'float' : 'right',
				'top' : '5px',
				'right' : nPaddingRight + 'px',
				'list-style' : 'none',
				'font-size' : '12px'
			});
		this._htwelTypeLi = {};
		this._htwelTypeSpan = {};
		_.each(htType, function(sVal, sKey){
			this._welTypeUl.append(
				this._htwelTypeLi[sKey] = $('<li>')
				.css({
					'display' : 'inline-block',
					'margin' : '0 10px',
					'padding' : '0',
					'color' : htType[sKey]
				})
				.text(sKey + ' : ')
				.append(
					this._htwelTypeSpan[sKey] = $('<span>')
					.text('0')
				)
			);
		}, this);
		this._welTypeUl.appendTo(this._welOverlay);

		this._awelChartCanvasInOrder = [];
		_.each(this._htwelChartCanvas, function(welChartCanvas, sKey){
			this._awelChartCanvasInOrder.push(welChartCanvas);
		}, this);
		this._welTypeUl.mousedown(function(event){
			event.stopPropagation();
		});
		this._welTypeUl.sortable({
			axis: 'x',
			containment: "document",
    		placeholder: sPrefix + 'placeholder',
			start : function(event, ui){
				$('.bigscatterchart-placeholder').append('<span>&nbsp;</span>');
				ui.item.startIndex = ui.item.index();
			},
			stop : function(event,ui){
				var nZIndexForCanvas = self.option('nZIndexForCanvas');
        		var nStart = ui.item.startIndex,
        			nStop = ui.item.index();

        		var welStart = self._awelChartCanvasInOrder[nStart];
        		self._awelChartCanvasInOrder.splice(nStart, 1); 
        		self._awelChartCanvasInOrder.splice(nStop, 0, welStart);
        		
        		for(var i=0, nLen=self._awelChartCanvasInOrder.length; i<nLen; i++){
        			self._awelChartCanvasInOrder[i].css('z-index', nZIndexForCanvas+i);
        		}
			}
		});

		this._resetTypeCount();

		// title
		var sTitle = this.option('sTitle'),
			htTitleStyle = this.option('htTitleStyle');
		if(_.isString(sTitle) && sTitle.length > 0){
			this._welOverlay.append(this._welTitle = $('<div>')
									.text(sTitle)
									.css({
										'position' : 'absolute',
										'vertical-align' : 'middle',
										'top': '12px',
										'left': nPaddingLeft + 'px'
									})
									.css(htTitleStyle)
			);
		}		
	},

	_initEvents : function(){
		var self = this;
		_.each(this._htwelTypeLi, function(welTypeLi, sKey){
			welTypeLi.css( 'cursor', 'pointer')
				.click(function(){
					this._htwelChartCanvas[sKey].toggle();
					if(!welTypeLi.hasClass('strike')){
						welTypeLi.addClass('strike')
						welTypeLi.css('text-decoration', 'line-through');					
					}else{
						welTypeLi.removeClass('strike')
						welTypeLi.css('text-decoration', 'none');
					};
				}.bind(this));
		}, this);

		var sDragToSelectClassName = this.option('sDragToSelectClassName');
		this._welContainer.dragToSelect({
			className: sDragToSelectClassName,
		    onHide: function (welSelectBox) {
		    	var htPosition = self._adjustSelectBoxForChart(welSelectBox),
		        	htXY = self._parseCoordinatesToXY(htPosition);

		        self._welSelectBox = welSelectBox;

				var fOnSelect = self.option('fOnSelect');
				if(_.isFunction(fOnSelect)){
					fOnSelect.call(self, htPosition, htXY);
				}
		    }
		});
	},


	_moveSelectBox : function(nXGap){
		if(!this._welSelectBox) return;
		if(this._welSelectBox.width() < 2) return;

		var nPositionXGap = (nXGap / (this._nXMax - this._nXMin)) * this._nXWork;
		
		var nLeft = parseInt(this._welSelectBox.css('left'), 10),
			nWidth = this._welSelectBox.width(),
			nPaddingLeft = this.option('nPaddingLeft'),
			nBubbleSize = this.option('nBubbleSize'),
			nXMin = nPaddingLeft + nBubbleSize;

		var nNewLeft = nLeft - nPositionXGap;

		if(nLeft > nXMin){
			if(nNewLeft > nXMin){
				this._welSelectBox.css('left', nNewLeft);
			}else{
				this._welSelectBox.css('left', nXMin);
				this._welSelectBox.width(nWidth + nNewLeft);
			}
		}else{
			this._welSelectBox.width(nWidth - nPositionXGap);
		}

		if(nLeft - nPositionXGap > nPaddingLeft + nBubbleSize){
			this._welSelectBox.css('left', nLeft - nPositionXGap);
		}else{
			
		}
	},

	_adjustSelectBoxForChart : function(welSelectBox){
		var nPaddingTop = this.option('nPaddingTop'),
			nPaddingLeft = this.option('nPaddingLeft'),
			nPaddingBottom = this.option('nPaddingBottom'),
			nPaddingRight = this.option('nPaddingRight'),
			nWidth = this.option('nWidth'),
			nHeight = this.option('nHeight'),
			nBubbleSize = this.option('nBubbleSize');

		var nMinLeft = nPaddingLeft + nBubbleSize,
			nMaxRight = nWidth - nPaddingRight - nBubbleSize,
			nMinTop = nPaddingTop + nBubbleSize,
			nMaxBottom = nHeight - nPaddingBottom - nBubbleSize;

    	var nLeft = parseInt(welSelectBox.css('left'), 10),
    		nRight = nLeft + welSelectBox.width(),
    		nTop = parseInt(welSelectBox.css('top'), 10),
    		nBottom = nTop + welSelectBox.height();

    	if(nLeft < nMinLeft) { nLeft = nMinLeft; }
    	if(nRight > nMaxRight) { nRight = nMaxRight; }
    	if(nTop < nMinTop) { nTop = nMinTop; }
    	if(nBottom > nMaxBottom) { nBottom = nMaxBottom; }

    	welSelectBox.animate({
    		'left' : nLeft,
    		'width' : nRight - nLeft,
    		'top' : nTop,
    		'height' : nBottom - nTop
    	}, 200);
    	var htPosition = {
    		'nLeft' : nLeft,
    		'nWidth' : nRight - nLeft,
    		'nTop' : nTop,
    		'nHeight' : nBottom - nTop
    	}
    	return htPosition;
	},

	_parseCoordinatesToXY : function(htPosition){
		var nPaddingTop = this.option('nPaddingTop'),
			nPaddingLeft = this.option('nPaddingLeft'),
			nPaddingBottom = this.option('nPaddingBottom'),
			nPaddingRight = this.option('nPaddingRight'),
			nWidth = this.option('nWidth'),
			nHeight = this.option('nHeight'),
			nBubbleSize = this.option('nBubbleSize');

		var htXY = {
			'nXFrom' : htPosition.nLeft - nPaddingLeft - nBubbleSize,
			'nXTo' : htPosition.nLeft + htPosition.nWidth - nPaddingLeft - nBubbleSize,
			'nYFrom' : (nHeight - (nPaddingBottom + nBubbleSize)) - (htPosition.nTop + htPosition.nHeight),
			'nYTo' : (nHeight - (nPaddingBottom + nBubbleSize)) - (htPosition.nTop)
		};	

		htXY.nXFrom = this._parseMouseXToXData(htXY.nXFrom);
		htXY.nXTo = this._parseMouseXToXData(htXY.nXTo);
		htXY.nYFrom = this._parseMouseYToYData(htXY.nYFrom);
		htXY.nYTo = this._parseMouseYToYData(htXY.nYTo);
		return htXY;
	},

	_drawXYAxis : function(){
		var nPaddingTop = this.option('nPaddingTop'),
			nPaddingLeft = this.option('nPaddingLeft'),
			nPaddingBottom = this.option('nPaddingBottom'),
			nPaddingRight = this.option('nPaddingRight'),
			nBubbleSize = this.option('nBubbleSize'),
			nWidth = this.option('nWidth'),
			nHeight = this.option('nHeight'),
			sLineColor = this.option('sLineColor'),
			htGuideLine = this.option('htGuideLine');

		this._oAxisCtx.lineWidth = htGuideLine.nLineWidth;
		this._oAxisCtx.globalAlpha = 1;
		this._oAxisCtx.lineCap = 'round';
	  	this._oAxisCtx.strokeStyle = sLineColor;
	  	this._oAxisCtx.beginPath();
	  	this._oAxisCtx.moveTo(nPaddingLeft, nPaddingTop);
		this._oAxisCtx.lineTo(nPaddingLeft, nHeight - nPaddingBottom);
		this._oAxisCtx.lineTo(nWidth - nPaddingRight, nHeight - nPaddingBottom);
	  	this._oAxisCtx.stroke();

	  	this._oGuideCtx.lineWidth = htGuideLine.nLineWidth;
		this._oGuideCtx.globalAlpha = htGuideLine.nGlobalAlpha;	
		if ( this._oGuideCtx.setLineDash !== undefined )   this._oGuideCtx.setLineDash(htGuideLine.aLineDash);
		if ( this._oGuideCtx.mozDash !== undefined )       this._oGuideCtx.mozDash = htGuideLine.aLineDash;		  	

		var nXStep = this._nXWork / this.option('nXSteps');
		var nYStep = this._nYWork / this.option('nYSteps');

		for(var i=0; i<=this.option('nXSteps'); i++){
			var mov = nPaddingLeft + nBubbleSize + nXStep * i;
	  		this._oAxisCtx.beginPath();
			this._oAxisCtx.moveTo(mov, nHeight - nPaddingBottom);
			this._oAxisCtx.lineTo(mov, nHeight - nPaddingBottom + 10);
			this._oAxisCtx.stroke();

			// x 축 가이드라인
			this._oGuideCtx.beginPath();
			this._oGuideCtx.moveTo(mov, nPaddingTop);
			this._oGuideCtx.lineTo(mov, nHeight - nPaddingBottom);
			this._oGuideCtx.stroke();
		}

		for(var i=0; i<=this.option('nYSteps'); i++){
			var mov = nHeight - (nPaddingBottom + nBubbleSize + nYStep * i);
			this._oAxisCtx.beginPath();
		  	this._oAxisCtx.moveTo(nPaddingLeft, mov);
			this._oAxisCtx.lineTo(nPaddingLeft - 10, mov);
			this._oAxisCtx.stroke();

			// y 축 가이드라인
			this._oGuideCtx.beginPath();
			this._oGuideCtx.moveTo(nPaddingLeft, mov);
			this._oGuideCtx.lineTo(nWidth - nPaddingRight, mov);			
			this._oGuideCtx.stroke();
		}
	},

	updateXYAxis: function(nXMin, nXMax, nYMin, nYMax) {
		if(_.isNumber(nXMin)){ this._nXMin = this.option('nXMin', nXMin); }
		if(_.isNumber(nXMax)){ this._nXMax = this.option('nXMin', nXMax); }
		if(_.isNumber(nYMin)){ this._nYMin = this.option('nYMin', nYMin); }
		if(_.isNumber(nYMin)){ this._nYMax = this.option('nYMax', nYMax); }
		
		var fXAxisFormat = this.option('fXAxisFormat'),
			nXStep = (this._nXMax - this._nXMin) / this.option('nXSteps');
		_.each(this._awelXNumber, function(el, i){
			if(_.isFunction(fXAxisFormat)){
				el.text(fXAxisFormat.call(this, nXStep, i));
			}else{
				el.text((xstep * i + this._nXMin).round());
			}
		}, this);
		
		var fYAxisFormat = this.option('fYAxisFormat'),
			nYStep = (this._nYMax - this._nYMin) / this.option('nYSteps');
		_.each(this._awelYNumber, function(el, i){
			if(_.isFunction(fXAxisFormat)){
				el.text(fYAxisFormat.call(this, nYStep, i));
			}else{
				el.text(this._addComma((this._nYMax + this._nYMin) - ((nYStep*i) + this._nYMin)));
			}
		}, this)
	},	

	setBubbles : function(aBubbles){
		this._aBubbles = [];
		this._aBubbleStep = [];

		this.addBubbles(aBubbles);
	},

	addBubbles : function(aBubbles, htTypeCount){
		if(_.isArray(this._aBubbles) === false) return;
		this._aBubbles.push(aBubbles);
		var htTypeCount = htTypeCount || this._countPerType(aBubbles);
		var htBubble = {
			'nXMin' : aBubbles[0].x,
			'nXMax' : aBubbles[aBubbles.length - 1].x,
			'nYMin' : (_.min(aBubbles, function(a){ return a.y; })).y,
			'nYMax' : (_.max(aBubbles, function(a){ return a.y; })).y,
			'nLength' : aBubbles.length,
			'htTypeCount' : {}
		};
		var htType = this.option('htTypeAndColor');
		_.each(htType, function(sVal, sKey){
			htBubble.htTypeCount[sKey] = htTypeCount[sKey];
		}, this);		

		this._aBubbleStep.push(htBubble);
	},

	_countPerType : function(aBubbles){
		var aBubbles = aBubbles,
			htTypeCount = {};		

		if(_.isArray(aBubbles) && aBubbles.length > 0){
			for(var i=0, nLen=aBubbles.length; i<nLen; i++){
				if(_.isNumber(htTypeCount[aBubbles[i].type]) === false){
					htTypeCount[aBubbles[i].type] = 0;
				}
				htTypeCount[aBubbles[i].type] += 1;
			}
		}
		_.each(htTypeCount, function(sVal, sKey){
			this._htTypeCount[sKey] += htTypeCount[sKey];
		}, this);
		return htTypeCount;
	},

	_resetTypeCount : function(){
		this._htTypeCount = {};
		var htType = this.option('htTypeAndColor');
		_.each(htType, function(sVal, sKey){
			this._htTypeCount[sKey] = 0;
		}, this);
	},

	_recountAllPerType : function(){
		var aBubbles = this._aBubbles;

		this._resetTypeCount();

		for(var i=0, nLen=aBubbles.length; i<nLen; i++){
			for(var j=0, nLen2=aBubbles[i].length; j<nLen2; j++){
				this._htTypeCount[aBubbles[i][j].type] += 1;
			}
		}
		return this._htTypeCount;
	},

	_showTypeCount : function(){
		_.each(this._htTypeCount, function(sVal, sKey){
			this._htwelTypeSpan[sKey].text(this._addComma(sVal));
		}, this);	
	},

	_addComma : function(nNumber){
		var sNumber = nNumber + '';
		var sPattern = /(-?[0-9]+)([0-9]{3})/;
		while(sPattern.test(sNumber)) {
			sNumber = sNumber.replace(sPattern,"$1,$2");
		}
		return sNumber;
	},

	_removeComma : function(sNumber){
		return parseInt(sNumber.replace(/\,/g, ''), 10);
	},

	redrawBubbles : function() {	
		this._recountAllPerType();
		this._showTypeCount();		
		this.updateXYAxis();

		if(this._aBubbles.length > 0){
			this._hideNoData();	
		}
		
		for(var i=0, nLen = this._aBubbles.length; i<nLen; i++){
			this._drawBubbules(this._aBubbles[i]);
		}
	},	

	clear : function(){
		var nPaddingLeft = this.option('nPaddingLeft'),
			nPaddingBottom = this.option('nPaddingBottom'),
			nWidth = this.option('nWidth'),
			nHeight = this.option('nHeight'),
			htType = this.option('htTypeAndColor'),
			sDragToSelectClassName = this.option('sDragToSelectClassName');

		_.each(htType, function(sVal, sKey){
			this._htBubbleCtx[sKey].clearRect(0, 0, nWidth, nHeight);
		}, this);		
		this._resetTypeCount();
		this._showTypeCount();
		this._aBubbles = [];
		this._aBubbleStep = [];
		this._showNoData();

		this._welContainer.find('.' + sDragToSelectClassName).hide();
	},

	addBubbleAndDraw : function(aBubbles){
		if(_.isArray(aBubbles) === false || aBubbles.length === 0){
			return;
		}
		if(aBubbles.length > 0){
			this._hideNoData();	
		}		

		this.addBubbles(aBubbles);
		this._showTypeCount();	
		this._drawBubbules(aBubbles);
	},

	_drawBubbules : function(aBubbles){
		var nPaddingTop = this.option('nPaddingTop'),
			nPaddingLeft = this.option('nPaddingLeft'),
			nPaddingBottom = this.option('nPaddingBottom'),
			nPaddingRight = this.option('nPaddingRight'),
			nBubbleSize = this.option('nBubbleSize'),
			htTypeAndColor = this.option('htTypeAndColor'),
			nDefaultRadius = this.option('nDefaultRadius');

		//this._oChartCtx.lineWidth = 1;
		for(var i = 0, nLen = aBubbles.length; i < nLen; i++) {
			var x = this._parseXDataToXChart(aBubbles[i].x),
				y = this._parseYDataToYChart(aBubbles[i].y),
				r = this._parseZDataToZChart(aBubbles[i].r || nDefaultRadius),
				a = aBubbles[i].y / this._nYMax * 0.7,
				sThisType = aBubbles[i].type;
		
			this._htBubbleCtx[sThisType].beginPath();
			// this._htBubbleCtx[sThisType].globalAlpha = 0.8;
			this._htBubbleCtx[sThisType].fillStyle = htTypeAndColor[sThisType];
			this._htBubbleCtx[sThisType].strokeStyle = htTypeAndColor[sThisType];
			this._htBubbleCtx[sThisType].arc(x, y, r, 0, Math.PI * 2, true);
			this._htBubbleCtx[sThisType].globalAlpha = 0.3 + a;			
			//this._htBubbleCtx[sThisType].stroke();
			this._htBubbleCtx[sThisType].fill();
			
			aBubbles[i].realx = x; aBubbles[i].realy = y; aBubbles[i].realz = r;
		}		
	},

	_parseXDataToXChart : function(nX){
		var nPaddingLeft = this.option('nPaddingLeft'),
			nBubbleSize = this.option('nBubbleSize');
		return Math.round(((nX - this._nXMin) / (this._nXMax - this._nXMin)) * this._nXWork) + nPaddingLeft + nBubbleSize;
	},
 
	_parseMouseXToXData : function(nX){
		return Math.round((nX / this._nXWork) * (this._nXMax - this._nXMin)) + this._nXMin;
	},

	_parseYDataToYChart : function(nY){
		var nPaddingTop = this.option('nPaddingTop'),
			nBubbleSize = this.option('nBubbleSize');
		return Math.round(this._nYWork - (((nY - this._nYMin) / (this._nYMax - this._nYMin)) * this._nYWork)) + nPaddingTop + nBubbleSize;
	},

	_parseMouseYToYData : function(nY){
		return Math.round((nY / this._nYWork) * (this._nYMax - this._nYMin));
	},

	_parseZDataToZChart : function(nZ){
		var nBubbleSize = this.option('nBubbleSize');		
		return Math.round(((nZ - this._nZMin) / (this._nZMax - this._nZMin)) * (nBubbleSize));
	},

	addBubbleAndMoveAndDraw : function(aBubbles, nXMax){
		var nPaddingTop = this.option('nPaddingTop'),
			nPaddingLeft = this.option('nPaddingLeft'),
			nPaddingBottom = this.option('nPaddingBottom'),
			nPaddingRight = this.option('nPaddingRight'),r
			nBubbleSize = this.option('nBubbleSize'),
			nWidth = this.option('nWidth'),
			nHeight = this.option('nHeight');

		if(_.isArray(aBubbles) === false || aBubbles.length === 0){
			return;
		}else{
			this._hideNoData();
		}
		if(nXMax > this._nXMax){
			var nXGap = nXMax - this._nXMax;
			var nX = nXGap + this._nXMin;
			var nXWidth = Math.round(((nX - this._nXMin) / (this._nXMax - this._nXMin)) * this._nXWork);
			this._moveSelectBox(nXGap);
			this._moveChartLeftwardly(nPaddingLeft + nBubbleSize + nXWidth, 0, nWidth-nXWidth, nHeight);
			this._nXMax = nXMax;
			this._nXMin += nXGap;
			this._removeOldDataLessThan(this._nXMin);
		}		
		this.addBubbles(aBubbles);
		this._showTypeCount();
		this._drawBubbules(aBubbles); // 평균 33 ~ 45 ms 걸림
		//this.redrawBubbles(); // 평균 2629 ~ 3526 ms 걸림, 90~100배 차이
		this.updateXYAxis();

		// _drawBubbules: 35.000ms 
		// _drawBubbules: 44.000ms 
		// _drawBubbules: 43.000ms 
		// _drawBubbules: 43.000ms 
		// _drawBubbules: 45.000ms 
		// _drawBubbules: 36.000ms 
		// _drawBubbules: 37.000ms 
		// _drawBubbules: 36.000ms 
		// _drawBubbules: 33.000ms 
		// 
		// redrawBubbles: 3468.000ms 
		// redrawBubbles: 3526.000ms 
		// redrawBubbles: 3481.000ms 
		// redrawBubbles: 3446.000ms 
		// redrawBubbles: 3478.000ms 
		// redrawBubbles: 3425.000ms 
		// redrawBubbles: 2784.000ms 
		// redrawBubbles: 2685.000ms 
		// redrawBubbles: 2629.000ms 
	},

	_removeOldDataLessThan : function(nX){
		// 여기서 조금 느려질 수 있다.
		// 하지만 그리는데 지장이 없기에 괜찮을 것 같다.
		// 워커를 사용하였지만, 전체 배열을 주고 받는 시간도 오래걸린다 
		var aBubbles = this._aBubbles || [],
			aIndexToBeRemoved = [],
			htType = this.option('htTypeAndColor');

		outerLoop:
		for(var i = 0, nLen = aBubbles.length; i < nLen; i++) {
			var htTypeCountToBeRemoved = {};			
			_.each(htType, function(sVal, sKey){
				htTypeCountToBeRemoved[sKey] = 0;
			}, this);

			if(this._aBubbleStep[i].nXMin <= nX){
				for(var j=0, nLen2 = aBubbles[i].length; j<nLen2; j++){
					htTypeCountToBeRemoved[aBubbles[i][j].type] += 1;
					if(aBubbles[i][j].x > nX || j === nLen2-1){
						aBubbles[i].splice(0, j+1);
						this._aBubbleStep[i].nXMin = nX;
						this._aBubbleStep[i].nLength = aBubbles[i].length;

						_.each(htTypeCountToBeRemoved, function(sVal, sKey){
							this._aBubbleStep[i]['htTypeCount'][sKey] -= sVal;
							this._htTypeCount[sKey] -= sVal;
						}, this);

						if(aBubbles[i].length === 0){
							aIndexToBeRemoved.push(i);							
						}
						break outerLoop;
					}
				}
			}
		}
		for(var i=0, nLen=aIndexToBeRemoved.length; i<nLen; i++){
			aBubbles.splice(aIndexToBeRemoved[i], 1);
			this._aBubbleStep.splice(aIndexToBeRemoved[i], 1);							
		}
		return;
	},

	_moveChartLeftwardly : function(x, y, width, height){
		var nPaddingLeft = this.option('nPaddingLeft'),
			nBubbleSize = this.option('nBubbleSize'),
			htType = this.option('htTypeAndColor');

		_.each(htType, function(sVal, sKey){
			var aImgData = this._htBubbleCtx[sKey].getImageData(x, y, width, height);
			this._htBubbleCtx[sKey].putImageData(aImgData, nPaddingLeft+nBubbleSize, 0);
		}, this);		
	},

	getDataByXY : function(nXFrom, nXTo, nYFrom, nYTo){
		var aBubbleStep = this._aBubbleStep,
			aBubbles = this._aBubbles,
			aData = [],
			bStarted = false;

		var aVisibleType = [];
		_.each(this._htwelTypeLi, function(welTypeLi, sKey){
			if(welTypeLi.css( 'text-decoration') == 'none'){
				aVisibleType.push(sKey);
			}
		}, this);

		// console.time('getDataByXY');
		// 열심히 성능 개선하려 시도하였지만, 그닥 빨라지지 않는다, 오히려 약간 오래 걸림 -_-;;
		for(var i=0, nLen=aBubbleStep.length; i<nLen; i++){
			if(nXFrom <= aBubbleStep[i].nXMin && nXTo >= aBubbleStep[i].nXMax
				&& nYFrom <= aBubbleStep[i].nYMin && nYTo >= aBubbleStep[i].nYMax){ // xFrom -- min ======= max ---- nTo
				aData = aData.concat(aBubbles[i]);
			// }else if(nXFrom >= aBubbleStep[i].nXMin && nXFrom <= aBubbleStep[i].nXMax){ // min ----- xFrom ====== max
			// 	for(var j=0, nLen2=aBubbleStep[i].nLength; j<nLen2; j++){
			// 		if(aBubbles[i][j].x >= nXFrom && aBubbles[i][j].x <= nXTo){ // 같은 시간대가 여러개 나올 수 있지만 처음꺼 기준.
			// 			//aData = aData.concat(aBubbles[i].slice(j));
			// 			//break;
			// 			if(nYFrom <= aBubbles[i][j].y && nYTo >= aBubbles[i][j].y){
			// 				console.log('a', i, j);
			// 				aData.push(aBubbles[i][j]);
			// 			}
			// 		}
			// 	}
			// }else if(nXTo >= aBubbleStep[i].nXMin && nXTo <= aBubbleStep[i].nXMax){ // min ====== xTo ---- max
			// 	for(var j=0, nLen2=aBubbleStep[i].nLength; j<nLen2; j++){
			// 		if(aBubbles[i][j].x >= nXFrom && aBubbles[i][j].x <= nXTo){
			// 			//aData = aData.concat(aBubbles[i].slice(0, j-1)); // 같은 시간대가 여러개 있을 수 있으므로 마지막 기준.
			// 			//break;
			// 			if(nYFrom <= aBubbles[i][j].y && nYTo >= aBubbles[i][j].y){
			// 				console.log('b', i, j);
			// 				aData.push(aBubbles[i][j]);
			// 			}
			// 		}
			// 	}
			// }else if(nXFrom >= aBubbleStep[i].nXMin || nXTo <= aBubbleStep[i].nXMax){
			// 	console.log('i', i, aBubbleStep[i].nXMin, aBubbleStep[i].nXMax);
			// 	for(var j=0, nLen2=aBubbleStep[i].nLength; j<nLen2; j++){
			// 		if(aBubbles[i][j].x >= nXFrom && aBubbles[i][j].x <= nXTo
			// 			&& aBubbles[i][j].y >= nYFrom && aBubbles[i][j].y <= nYTo){
			// 			console.log('b', i, j);
			// 			aData.push(aBubbles[i][j]);
			// 		}
			// 	}
			// }else if((nXFrom >= aBubbleStep[i].nXMin && nXFrom <= aBubbleStep[i].nXMax) || bStarted){
			// 	bStarted = true;
			// 	if(nXTo >= aBubbleStep[i].nXMin){
			// 		console.log('i', i);
			// 		for(var j=0, nLen2=aBubbleStep[i].nLength; j<nLen2; j++){
			// 			if(aBubbles[i][j].x >= nXFrom && aBubbles[i][j].x <= nXTo
			// 				&& aBubbles[i][j].y >= nYFrom && aBubbles[i][j].y <= nYTo){
			// 				//console.log('c', i, j);
			// 				aData.push(aBubbles[i][j]);
			// 			}
			// 		}	
			// 	}else{
			// 		break;
			// 	}
			}else{
				for(var j=0, nLen2=aBubbleStep[i].nLength; j<nLen2; j++){
					if(aBubbles[i][j].x >= nXFrom && aBubbles[i][j].x <= nXTo
						&& aBubbles[i][j].y >= nYFrom && aBubbles[i][j].y <= nYTo
						&& _.indexOf(aVisibleType, aBubbles[i][j].type) >= 0){
						aData.push(aBubbles[i][j]);
					}
				}	
			}
		}
		// console.timeEnd('getDataByXY');
		return aData;
	},

	_hideNoData : function(){
		this._welShowNoData.hide();
	},

	_showNoData : function(){
		this._welShowNoData.show();
	},

	destroy : function(){
		this._welContainer.empty();
		_.each(this, function(content, property){
			delete this[property];
		}, this);
	},

	_mergeAllDisplay : function(){
		var nWidth = this.option('nWidth'),
			nHeight = this.option('nHeight');
		var welCanvas = $('<canvas>').attr({
										'width' : nWidth,
										'height' : nHeight
									});
		var oCtx = welCanvas.get(0).getContext('2d');
		oCtx.fillStyle="#FFFFFF";
		oCtx.fillRect(0, 0, nWidth, nHeight);
		// soCtx.globalCompositeOperation = 'destination-out';

		// guide line
		oCtx.drawImage(this._welGuideCanvas.get(0), 0, 0);

		// scatter
		_.each(this._awelChartCanvasInOrder, function(welChartCanvas, sKey){
			if(welChartCanvas.css('display') === 'block'){
				oCtx.drawImage(welChartCanvas.get(0), 0, 0);
			}
		}, this);

		// xy axis
		oCtx.drawImage(this._welAxisCanvas.get(0), 0, 0);

		// common setting
		oCtx.textBaseline = "top";

		// title
		var nTitleX = parseInt(this._welTitle.css('left'), 10),
			nTitleY = parseInt(this._welTitle.css('top'), 10);
		oCtx.textAlign = "left"; 
		oCtx.fillStyle = this._welTitle.css('color');		
		oCtx.font = this._welTitle.css('font');
		oCtx.fillText(this._welTitle.text(), nTitleX, nTitleY);

		// count
		var htContainerOffset = this._welContainer.offset();
		oCtx.textAlign = "left";
		_.each(this._htwelTypeLi, function(welTypeLi){
			var htOffset = welTypeLi.offset();
			var nX = htOffset.left - htContainerOffset.left,
				nY = htOffset.top - htContainerOffset.top;
			console.log(nX, nY, welTypeLi.css('color'), welTypeLi.css('font'));
			oCtx.fillStyle = welTypeLi.css('color');
			oCtx.font = welTypeLi.css('font');
			oCtx.fillText(welTypeLi.text(), nX, nY);		
			if(welTypeLi.hasClass('strike')){
				oCtx.moveTo(nX, nY + welTypeLi.height()/2);
				oCtx.lineTo(nX + welTypeLi.width(), nY + welTypeLi.height()/2);
				oCtx.strokeStyle = welTypeLi.css('color');
				oCtx.lineWidth = 0.7;
				oCtx.stroke();
			}	
		});

		// x axis
		oCtx.textAlign = "center"; 
		_.each(this._awelXNumber, function(welXNumber){
			var nX = parseInt(welXNumber.css('left'), 10) + welXNumber.width() / 2,
				nY = parseInt(welXNumber.css('top'), 10);
			oCtx.fillStyle = welXNumber.css('color');
			oCtx.font = welXNumber.css('font');
			oCtx.fillText(welXNumber.text(), nX, nY);
		});

		// y axis
		oCtx.textAlign = "right"; 
		_.each(this._awelYNumber, function(welYNumber){
			var nX = parseInt(welYNumber.css('left'), 10) + welYNumber.width(),
				nY = parseInt(welYNumber.css('top'), 10);
			oCtx.fillStyle = welYNumber.css('color');
			oCtx.font = welYNumber.css('font');
			oCtx.fillText(welYNumber.text(), nX, nY);
		});

		// x label
		oCtx.textAlign = "right"; 
		var nX = nWidth,
			nY = parseInt(this._welXLabel.css('top'), 10);
		oCtx.fillStyle = this._welXLabel.css('color');
		oCtx.font = this._welXLabel.css('font');
		console.log(nX, nY);
		oCtx.fillText(this._welXLabel.text(), nX, nY);

		// y label
		oCtx.textAlign = "right"; 
		nX = parseInt(this._welYLabel.css('left'), 10) + this._welYLabel.width();
		nY = parseInt(this._welYLabel.css('top'), 10);
		oCtx.fillStyle = this._welYLabel.css('color');
		oCtx.font = this._welYLabel.css('font');
		oCtx.fillText(this._welYLabel.text(), nX, nY);

		// nodata
		if(this._welShowNoData.css('display') === 'block'){
			oCtx.textAlign = "center";
			oCtx.fillStyle = this._welShowNoData.css('color');
			oCtx.font = this._welShowNoData.css('font');
			oCtx.fillText(this._welShowNoData.text(), parseInt(this._welShowNoData.css('top')), nWidth/2);
		}

		// drag-selecting
		var sDragToSelectClassName = this.option('sDragToSelectClassName'),
			welDragToSelect = $('.' + sDragToSelectClassName);
		oCtx.rect(parseInt(welDragToSelect.css('left')), parseInt(welDragToSelect.css('top')), welDragToSelect.width(), welDragToSelect.height());
		oCtx.globalAlpha = welDragToSelect.css('opacity');
		oCtx.fillStyle = welDragToSelect.css('background-color');
		oCtx.fill();
		oCtx.strokeStyle = welDragToSelect.css('border-color');
		oCtx.stroke();

		return welCanvas;
	},

	saveAsPNG : function(elA){
		var welCanvas = this._mergeAllDisplay();
		$(elA).attr('href', welCanvas.get(0).toDataURL('image/png'));
	},

	saveAsJPEG : function(elA){
		var welCanvas = this._mergeAllDisplay();
		$(elA).attr('href', welCanvas.get(0).toDataURL('image/jpeg'));
	}
});
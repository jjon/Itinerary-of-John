SimileAjax.DOM.registerEventWithObject(this._div,"touchstart",this,"_onTouchStart"); SimileAjax.DOM.registerEventWithObject(this._div,"touchmove",this,"_onTouchMove");

Timeline._Band.prototype._onTouchStart=function(D,A,E) { if(A.touches.length == 1) { var touch = A.changedTouches[0]; this._dragX=touch.clientX; this._dragY=touch.clientY; } }

Timeline._Band.prototype._onTouchMove=function(D,A,E) { if(A.touches.length == 1) { A.preventDefault(); var touch = A.changedTouches[0]; var C=touch.clientX-this._dragX; var B=touch.clientY-this._dragY; this._dragX=touch.clientX; this._dragY=touch.clientY; this._moveEther(this._timeline.isHorizontal()?C:B); this._positionHighlight(); this._fireOnScroll(); this._setSyncWithBandDate(); } };


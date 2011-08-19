(function($) {
	var options = {
	  touch: {
	    pan: 'xy',
	    scale: 'xy'
	  }
	};

	function init(plot) {
		var isPanning = false;
		var isZooming = false;
		var lastTouchPosition = { x: -1, y: -1 };
		var lastTouchDistance = 0;
		var relativeOffset = { x: 0, y: 0};
		var relativeScale = 1.0;
		var scaleOrigin = { x: 50, y: 50 };
		
		function pan(delta) {
			var placeholder = plot.getPlaceholder();
			var options = plot.getOptions();
			
			relativeOffset.x -= delta.x;
			relativeOffset.y -= delta.y;
			
			switch (options.touch.pan) {
			  case 'x':
			  case 'X':
			    placeholder.children('div.flot-touch-container').css('-webkit-transform', 'translateX(' + relativeOffset.x + 'px)');
			    break;
			  case 'y':
			  case 'Y':
			    placeholder.children('div.flot-touch-container').css('-webkit-transform', 'translateY(' + relativeOffset.y + 'px)');
			    break;
			  default:
			    placeholder.children('div.flot-touch-container').css('-webkit-transform', 'translate(' + relativeOffset.x + 'px,' + relativeOffset.y + 'px)');
			    break;
			}
			
	    $(".message").html("Delta pan x: "  + delta.x + ", y: " + delta.y);
		}
		
		function scale(delta) {
			var placeholder = plot.getPlaceholder();
			var options = plot.getOptions();
			var container = placeholder.children('div.flot-touch-container');
			
			relativeScale *= 1 + (delta / 100);
			
			switch (options.touch.scale) {
			  case 'x':
			  case 'X':
			    container.css('-webkit-transform', 'scaleX(' + relativeScale + ')');
			    break;
			  case 'y':
			  case 'Y':
			    container.css('-webkit-transform', 'scaleY(' + relativeScale + ')');
			    break;
			  default:
			    container.css('-webkit-transform', 'scale(' + relativeScale + ')');
			    break;
			}
			
			$(".message").html("Delta scale: " + delta);
		}
		
		function draw(plot, ctx) {
			var placeholder = plot.getPlaceholder();
		}

		function bindEvents(plot, eventHolder) {
			var placeholder = plot.getPlaceholder();
			var container = $('<div class="flot-touch-container" style="background:#fff;"/>');
			
			placeholder.css({
			  'background': '#fff url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////mpqaPjL2kgAAABdJREFUeNpiYIQCBhgYIIEBth4mABBgAEUQAIEfdL0YAAAAAElFTkSuQmCC) repeat',
			  'overflow': 'hidden'
			}).children('canvas').wrapAll(container);
			
			placeholder.bind('touchstart', function(evt) {
				var touches = evt.originalEvent.touches;
				var container = placeholder.children('div.flot-touch-container');
				
				if (touches.length === 1) {
					isPanning = true;
					lastTouchPosition = {
						x: touches[0].pageX, // pageX
						y: touches[0].pageY  // pageY
					};
					lastTouchDistance = 0;
				}
				
				else if (touches.length === 2) {
					isZooming = true;
					lastTouchPosition = {
						x: (touches[0].pageX + touches[1].pageX) / 2,
						y: (touches[0].pageY + touches[1].pageY) / 2
					};
					lastTouchDistance = Math.sqrt(Math.pow(touches[1].pageX - touches[0].pageX, 2) + Math.pow(touches[1].pageY - touches[0].pageY, 2));
				}
				
				var offset = placeholder.offset();
				var rect = {
				  x: offset.left,
				  y: offset.top,
				  width: placeholder.width(),
				  height: placeholder.height()
				};
				
				var normalizedTouchPosition = {
				  x: lastTouchPosition.x,
				  y: lastTouchPosition.y
				};
				
				if (normalizedTouchPosition.x < rect.x) {
				  normalizedTouchPosition.x = rect.x;
				} else if (normalizedTouchPosition.x > rect.x + rect.width) {
				  normalizedTouchPosition.x = rect.x + rect.width;
				}

				if (normalizedTouchPosition.y < rect.y) {
				  normalizedTouchPosition.y = rect.y;
				} else if (normalizedTouchPosition.y > rect.y + rect.height) {
				  normalizedTouchPosition.y = rect.y + rect.height;
				}
				
				scaleOrigin = {
  			  x: Math.round((normalizedTouchPosition.x / rect.width) * 100),
  			  y: Math.round((normalizedTouchPosition.y / rect.height) * 100)
  			};

  			container.css('-webkit-transform-origin', scaleOrigin.x + '% ' + scaleOrigin.y + '%');
				
				$(".message").html("Event touchstart: " + touches.length + " touch(es)");
				
				return false;
			});
			
			placeholder.bind('touchmove', function(evt) {
				var touches = evt.originalEvent.touches;
				var position, distance, delta;
				
				if (isPanning && touches.length === 1) {
					position = {
						x: touches[0].pageX,
						y: touches[0].pageY
					};
					delta = {
						x: lastTouchPosition.x - position.x,
						y: lastTouchPosition.y - position.y
					};
					
					// Transform via the delta
					pan(delta);
					
					lastTouchPosition = position;
					lastTouchDistance = 0;
				}
				
				else if (isZooming && touches.length === 2) {
					distance = Math.sqrt(Math.pow(touches[1].pageX - touches[0].pageX, 2) + Math.pow(touches[1].pageY - touches[0].pageY, 2));
					position = {
						x: (touches[0].pageX + touches[1].pageX) / 2,
						y: (touches[0].pageY + touches[1].pageY) / 2
					};
					delta = distance - lastTouchDistance;
					
					// Scale via the delta
					scale(delta);
					
					lastTouchPosition = position;
					lastTouchDistance = distance;
				}
			});
			
			placeholder.bind('touchend', function(evt) {
  			var placeholder = plot.getPlaceholder();
  			var options = plot.getOptions();
			  var container = placeholder.children('div.flot-touch-container');
			  
			  // Apply the pan offset.
			  switch (options.touch.pan.toLowerCase()) {
  			  case 'x':
  			    plot.pan({ left: relativeOffset.x * -1, top: 0 });
  			    break;
  			  case 'y':
  			    plot.pan({ left: 0, top: relativeOffset.y * -1 });
  			    break;
  			  default:
  			    plot.pan({ left: relativeOffset.x * -1, top: relativeOffset.y * -1 });
  			    break;
  			}
  			
  			// Apply the scale.
  			if (relativeScale !== 1.0) {
  			  var width = plot.width();
  			  var height = plot.height();
  			  var scaleOriginPixel = {
  			    x: Math.round((scaleOrigin.x / 100) * width),
  			    y: Math.round((scaleOrigin.y / 100) * height)
  			  };
  			  var range = {
        	  x: {
        	    min: scaleOriginPixel.x - (scaleOrigin.x / 100) * width / relativeScale,
        	    max: scaleOriginPixel.x + (1 - (scaleOrigin.x / 100)) * width / relativeScale
        	  },
        	  y: {
        	    min: scaleOriginPixel.y - (scaleOrigin.y / 100) * height / relativeScale,
        	    max: scaleOriginPixel.y + (1 - (scaleOrigin.y / 100)) * height / relativeScale
        	  }
        	};

  			  $.each(plot.getAxes(), function(index, axis) {
  			    if (axis.direction === options.touch.scale.toLowerCase() || options.touch.scale.toLowerCase() == 'xy') {
          	  var min = axis.c2p(range[axis.direction].min);
          	  var max = axis.c2p(range[axis.direction].max);

          	  if (min > max) {
          	    var temp = min;
          	    min = max;
          	    max = temp;
          	  }

          	  axis.options.min = min;
          	  axis.options.max = max;
  			    }
  			  });
    			
    			plot.setupGrid();
        	plot.draw();
			  }
			  
				isPanning = false;
				isZooming = false;
				lastTouchPosition = { x: -1, y: -1 };
				lastTouchDistance = 0;
				relativeOffset = { x: 0, y: 0 };
				relativeScale = 1.0;
				scaleOrigin = { x: 50, y: 50 };
				
				container.css({
				  '-webkit-transform': 'translate(' + relativeOffset.x + 'px,' + relativeOffset.y + 'px) scale(' + relativeScale + ')',
				  '-webkit-transform-origin': scaleOrigin.x + '% ' + scaleOrigin.y + '%'
				});
			});
		}

		function shutdown(plot, eventHolder) {
			var placeholder = plot.getPlaceholder();
			
			placeholder.unbind('touchstart').unbind('touchmove').unbind('touchend');
		}

		plot.hooks.draw.push(draw);
		plot.hooks.bindEvents.push(bindEvents);
		plot.hooks.shutdown.push(shutdown);
	}

	$.plot.plugins.push({
		init: init,
		options: options,
		name: 'touch',
		version: '1.0'
	});
})(jQuery);

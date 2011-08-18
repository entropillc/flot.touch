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
						x: touches[0].screenX,
						y: touches[0].screenY
					};
					lastTouchDistance = 0;
				}
				
				else if (touches.length === 2) {
					isZooming = true;
					lastTouchPosition = {
						x: (touches[0].screenX + touches[1].screenX) / 2,
						y: (touches[0].screenY + touches[1].screenY) / 2
					};
					lastTouchDistance = Math.sqrt(Math.pow(touches[1].screenX - touches[0].screenX, 2) + Math.pow(touches[1].screenY - touches[0].screenY, 2));
				}
				
				scaleOrigin = {
  			  x: Math.round((lastTouchPosition.x / screen.width) * 100),
  			  y: Math.round((lastTouchPosition.y / screen.height) * 100)
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
						x: touches[0].screenX,
						y: touches[0].screenY
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
					distance = Math.sqrt(Math.pow(touches[1].screenX - touches[0].screenX, 2) + Math.pow(touches[1].screenY - touches[0].screenY, 2));
					position = {
						x: (touches[0].screenX + touches[1].screenX) / 2,
						y: (touches[0].screenY + touches[1].screenY) / 2
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
			  switch (options.touch.pan) {
  			  case 'x':
  			  case 'X':
  			    plot.pan({ left: relativeOffset.x * -1, top: 0 });
  			    break;
  			  case 'y':
  			  case 'Y':
  			    plot.pan({ left: 0, top: relativeOffset.y * -1 });
  			    break;
  			  default:
  			    plot.pan({ left: relativeOffset.x * -1, top: relativeOffset.y * -1 });
  			    break;
  			}
  			
  			// Apply the scale.
  			// TODO: Add support for single-axis scaling here.
			  switch (options.touch.scale) {
  			  case 'x':
  			  case 'X':
  			    plot.zoom({ amount: relativeScale });
  			    break;
  			  case 'y':
  			  case 'Y':
  			    plot.zoom({ amount: relativeScale });
  			    break;
  			  default:
  			    plot.zoom({ amount: relativeScale });
  			    break;
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

function cal(id){

    // Data.
    var data = [];
    var current_week = moment().week();

    // D3 setup.
    var cal = d3.select(id);

    var toolbar = cal.append('div')
        .attr('class', 'toolbar');

    var container = cal.append('div')
       .attr('class', 'y_cal_container');

    var yaxis = container.append('div')
        .attr('class', 'yaxis');

    var page = container.append('div')
        .attr('class', 'page');

    var xaxis = cal.append('div')
        .attr('class', 'xaxis');

    var x_scale = d3.scale.ordinal()
        .domain(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

    var y_scale = d3.scale.linear()
        .domain([0, 60*24]);

    var y_tick = yaxis.selectAll('.ytick')
        .data(d3.range(0, 24*60, 60))
        .enter()
        .append('div')
        .attr('class', 'ytick');

    var x_tick = xaxis.selectAll('.tick')
        .data(x_scale.domain())
        .enter()
        .append('div')
        .attr('class', 'tick');

    var color = d3.scale.category10();

    y_tick.append('span').text(function(d){
      return (d/60) + ':00';
    });

    x_tick.append('span')
        .text(function(d){
            return d;
        });

    var x0;
    xaxis.on('touchstart', function(){
        x0 = d3.event.changedTouches[0].clientX;
    }).on('touchend', function(){
        var x1 = d3.event.changedTouches[0].clientX;
        if(x1 > x0){
            current_week++;
        } else {
            current_week--;
        }
        toolbar.text(current_week)
    });

    // Drag behaviour for draging and resizeing calendar events.
    var resizebehaviour = d3.behavior.drag()
        .on('dragstart', function(d){
            var parent = d3.select(this.parentNode);
            var div = d3.select(this);
            parent.classed('selected', true);
            div.style('z-index', 2);
            parent.style('z-index', 1);
            d3.event.sourceEvent.stopPropagation();
        })
        .on('drag', function(d){
            resize_event(d, d3.select(this.parentNode));
        })
        .on('dragend', function(d){
            var parent = d3.select(this.parentNode);
            var div = d3.select(this);
            parent.classed('selected', false);
            parent.style('z-index', 'auto');
            div.style('z-index', 'auto');
            resizeend_event(d, parent);
            ease();
        });

    var dragbehaviour = d3.behavior.drag()
        .on('dragstart', function(d){
            var div = d3.select(this);
            div.style('z-index', 1);
            div.classed('selected', true);
            drag_event(d, div);
        })
        .on('drag', function(d){
            drag_event(d, d3.select(this));
            console.log(d3.event.x, d3.event.y);
        })
        .on('dragend', function(d){
            var div = d3.select(this);
            div.style('z-index', 'auto');
            div.classed('selected', false);
            dragend_event(d, div);
            ease();
        });

    d3.select(window).on('resize', function(){
        resize_everything();
    });

    // Update data.
    var add_event = function(event){
        data.push(event);

        var event = page.selectAll('.event_container')
            .data(data, function(d){
                return d.id;
            });

        var eventEnter = event.enter()

        var event_container = eventEnter.append('div')
            .attr('class', function(d){
                return 'event_container'
            })
            .style('background-color', function(d){
                return color(d.id);
            })
            .attr('id', function(d){
                return  'event_id'+d.id;
            })
            .on('click', function(d){
                //console.log(d);
            });

        var event_bottom = event_container.append('div')
            .attr('class', 'event_bottom')
            .on('click', function(d){
                //console.log('bottom', d);
            });

        event_container.call(dragbehaviour);
        event_bottom.call(resizebehaviour);

        resize_everything();
    }

    // Resize gui.
    var resize_everything = function(){
        var w = parseInt(page.style('width'));
        var h = parseInt(page.style('height'))
        x_scale.rangeBands([0, w], 0.1);
        y_scale.range([0, h]);

        d3.selectAll('.event_container')
            .style({
                top: function(d){
                    return y_scale(d.start) + 'px';
                },
                height: function(d){
                    return y_scale(d.duration) + 'px';
                },
                left: function(d){
                    return x_scale(d.day) + 'px';
                },
                width: function(){
                    return x_scale.rangeBand() + 'px';
                }
            });

        y_tick.style({
            top: function(d,i){
                return i + 'em';
            }
        });

        x_tick.style({
            left: function(d) {
                return x_scale(d) + 'px'
            },
            width: x_scale.rangeBand() + 'px'
        });
        ease();
    };

    // The drag events. Update gui on 'drag' events. Snap-to-grid and
    // update data on 'dragend' events.

    var drag_event = function(d, div){
        var x = d3.event.x;
        var y = d3.event.y;

        div.style({
            top: function(d){
                var height = parseInt(div.style('height'));
                return (y - height/2) + 'px';
            },
            left: function(d){
                var width = parseInt(div.style('width'));
                return (x-width/2) + 'px';
            }});
    };

    var dragend_event = function(d, div){
        var x = parseInt(div.style('left'));
        var range = x_scale.range();
        var elem_width = parseInt(div.style('width'));
        var elem_height = parseInt(div.style('height'));

        // Find nearest day to snap to.
        var i = 0;
        while(x+elem_width/2 > range[i]){ i++; }
        var day = 'Mon';

        if(i==0){
            x = range[0];
            day = x_scale.domain()[0];
        } else {
            x = range[i-1];
            day = x_scale.domain()[i-1];
        }

        var top = parseInt(div.style('top'));
        var height = parseInt(page.style('height'));
        if(top <= 0){
            top = 0;
        } else if (top+elem_height >= height) {
            top = (height - elem_height);
        }

        div.style({
            left: function(){ return x + 'px'; },
            top: function(){ return top + 'px'; }
        });

        d.day = day;
        d.start = y_scale.invert(top);
    };

    var resize_event = function(d, div){
        var y = d3.event.y;
        var height = parseInt(page.style('height'));
        var top = parseInt(div.style('top'));
        if (y <= (height-top)){
            div.style('height', d3.event.y + 'px');
        }
    };

    var resizeend_event = function(d, div){
        d.duration = y_scale.invert(parseInt(div.style('height')));
    };

    var ease = function(){
        // Nest by day.
        var nested = d3.nest()
            .key(function(d) { return d.day; })
            .entries(data);

        // Get values from nest
        var values = nested.map(function(n) { return n.values});

        // Sort by start time
        var sort =function(l) {
            l.sort(function(a,b){
                var start0 = a.start;
                var start1 = b.start;
                if(start0 < start1){ return -1;}
                if(start0 > start1){ return 1;}
                return 0;
            })
            return l;
        };
        values.forEach(sort);

        // Find islands.
        var global_islands = [];
        values.forEach(function(events){
            var i = 0;
            var d = events[i];
            var k = d.id;
            // Init first island.
            var isle =  {set:{}, max:  d.start + d.duration};
            isle.set[d.id] = d;
            var local_islands = [isle];
            // Find all islands.
            for(i=1,j=0; i < events.length; i++){
                d = events[i];
                var current_isle = local_islands[j];
                var max = current_isle.max;
                if(d.start <= max){
                    var k = d.id;
                    current_isle.set[k] = d;
                    current_isle.max = d3.max([d.start+d.duration,max]);
                } else { // End of island found.
                    j++;
                    var isle = {set:{}, max:  d.start + d.duration};
                    isle.set[d.id] = d;
                    local_islands.push(isle);
                }
            }
            global_islands.push(local_islands);
        });

        // Greedy packing.
        global_islands.forEach(function(local){
            local.forEach(function(isle){
                var sorted = sort(d3.values(isle.set));
                var ids = sorted.map(function(d) { return {id: d.id, x: 0 }});
                // Store taken heights (value) for each column (index).
                var taken_heights = ids.map(function(){ return 0; });
                // Store number of used columns.
                var taken_columns = 1;

                // For each event...
                for(i=0; i < sorted.length; i++){
                    d = sorted[i];
                    // find first column with free space.
                    for(j=0; j < taken_heights.length; j++){
                        if(d.start >= taken_heights[j]){
                            taken_heights[j] = d.start+d.duration;
                            ids[i].x = j;
                            taken_columns = d3.max([taken_columns, j+1]);
                            break;
                        }
                    }
                }
                // Fill whole x_scale band with packed events.
                var new_band = x_scale.rangeBand()/taken_columns;
                ids.forEach(function(id){
                    d3.select('#event_id'+id.id)
                        .style({
                            left: function(d){
                                return x_scale(d.day) + new_band*id.x + 'px';
                            },
                            width: function(){
                                return (new_band - 4) + 'px';
                            }
                        });
                });
            });
        });
    };

    // Init cal.
    resize_everything();

    // Return object.
    return {
        add_event: add_event
    }
}

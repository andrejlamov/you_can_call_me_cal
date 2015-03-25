function cal(id){

    // D3 setup.
    var data = [];

    var cal = d3.select(id);

    var yaxis = cal.append('div')
        .attr('class', 'yaxis');
    var xaxis = cal.append('div')
        .attr('class', 'xaxis');
    var page = cal.append('div')
        .attr('class', 'page');

    var x_scale = d3.scale.ordinal()
        .domain(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

    var y_scale = d3.scale.linear()
        .domain([0, 60*24]);

    var y_tick = yaxis.selectAll('.tick')
        .data(d3.range(0, 24*60, 60))
        .enter()
        .append('div')
        .attr('class', 'tick');

    var x_tick = xaxis.selectAll('.tick')
        .data(x_scale.domain())
        .enter()
        .append('div')
        .attr('class', 'tick');

    y_tick.append('span')
        .text(function(d){
            return d/60 + ':00';
        });

    x_tick.append('span')
        .text(function(d){
            return d;
        });

    // Drag behaviour for draging and resizeing calendar events.
    var resizebehaviour = d3.behavior.drag()
        .on('dragstart', function(d){
            d3.event.sourceEvent.stopPropagation();
        })
        .on('drag', function(d){
            resize_event(d, d3.select(this.parentNode))
        })
        .on('dragend', function(d){
            resizeend_event(d, d3.select(this.parentNode))
        });

    var dragbehaviour = d3.behavior.drag()
        .on('drag', function(d){ drag_event(d, d3.select(this)) })
        .on('dragend', function(d){ dragend_event(d, d3.select(this)) });


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
                return 'event_container ' + 'event_id'+d.id})
            .on('click', function(d){
                console.log(d);
            });

        var event_bottom = event_container.append('div')
            .attr('class', 'event_bottom')
            .on('click', function(d){
                console.log('bottom', d);
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
            top: function(d){
                return y_scale(d) + 'px';
            },
            height: '1em',
            width: '2em'
        });

        x_tick.style({
            left: function(d) {
                console.log(d)
                return x_scale(d) + 'px'
            },
            width: x_scale.rangeBand() + 'px',
            height: '1em',
        });
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
        var elem_width = x_scale.rangeBand();
        var elem_height = parseInt(div.style('height'));

        // Find nearest day to snap to.
        var i = 0;
        while(x+elem_width/2 > range[i]){ i++; }
        x = i==0 ? range[0] : range[i-1];

        var top = div.style('top');
        var height = parseInt(page.style('height'));
        var top0 = parseInt(top);
        var top1 = top;
        if(top0 <= 0){
            top1 = '0px';
        } else if (top0+elem_height >= height) {
            top1 = '22em';
        }

        div.style({
            left: function(){ return x + 'px'; },
            top: function(){ return top1 }
        });

        d.day = x_scale.domain()[i-1];
        d.start = y_scale.invert(top0);
    };

    var resize_event = function(d, div){
        div.style('height', d3.event.y + 'px');
    };

    var resizeend_event = function(d, div){
        d.duration = y_scale.invert(parseInt(div.style('height')));
    };

    return {
        add_event: add_event
    }
}

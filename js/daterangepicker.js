/**
* @version: 1.0.1
* @author: Dan Grossman http://www.dangrossman.info/
* @date: 2012-08-20
* @copyright: Copyright (c) 2012 Dan Grossman. All rights reserved.
* @license: Licensed under Apache License v2.0. See http://www.apache.org/licenses/LICENSE-2.0
* @website: http://www.improvely.com/
* Modified by ERDIL
*/
!function ($) {
    function equals(date1, date2) {
      return (date1 < date2) ? false : (date1 > date2) ? false : true;
    }
  
    var DateRangePicker = function (element, options, cb) {
        var hasOptions = typeof options == 'object'
        var localeObject;
        
        //state
        this.startDate = moment().startOf('day');
        this.endDate = moment().startOf('day');
        this.currentDate = moment().startOf('day');
        this.calendarMinViewMode = 'days';
        this.calendarStartView = 'month';
        this.quarterlyView = false;        
        this.minDate = moment("01-01-2001", "MM-DD-YYYY");
        this.maxDate = false;
        this.changed = false;
        this.customRangeChoice = true;        
        this.ranges = {};
        this.defaultRange = '';
        this.separators = [];
        this.opens = 'right';
        this.opensV = 'bottom';
        this.cb = function () { };
        this.format = 'MM/DD/YYYY';
        this.separator = ' - ';
        this.showWeekNumbers = false;
        this.locale = {
            customRangeLabel: 'Custom Range',
            daysOfWeek: moment().lang()['weekdaysMin'],
            monthNames: moment().lang()['months'],
            firstDay: 0
        };

        localeObject = this.locale;

        // by default, the daterangepicker element is placed at the bottom of HTML body
        this.parentEl = 'body';

        //element that triggered the date range picker
        this.element = $(element);

        if (this.element.hasClass('pull-right'))
            this.opens = 'left';

        if (this.element.is('input')) {
            this.element.on({
                click: $.proxy(this.show, this),
                focus: $.proxy(this.show, this)
            });
        } else {
            this.element.on('click', $.proxy(this.show, this));
        }

        if (hasOptions) {
            if(typeof options.locale == 'object') {
                $.each(localeObject, function (property, value) {
                    localeObject[property] = options.locale[property] || value;
                });
            }
        }
        
        if (hasOptions && typeof options.customRangeChoice != 'undefined' && !options.customRangeChoice) {
          this.customRangeChoice = false;
        }
        
        this.parentEl = (hasOptions && options.parentEl && $(options.parentEl)) || $(this.parentEl);
        var DRPTemplate = '<div class="daterangepicker dropdown-menu">' +
                '<div class="ranges">' +
                '</div>' +
              '</div>';              

        var calendarStart = this.parentEl.attr('id') + '-calendar-start';
        var calendarEnd = this.parentEl.attr('id') + '-calendar-end';    
        var DRPPopoverTemplate =  '<div class="daterangepicker-popover">' +
                        '<div class="calendars">' +
                          '<table class="calendars-table table">' +
                            '<thead>' +
                              '<tr>' +
                                '<th>Début</th>' +
                                '<th>Fin</th>' +
                              '</tr>' +
                            '</thead>' +
                            '<tbody>' +
                              '<tr>' +
                                '<td><div id="' + calendarStart + '" class="calendar-start"></div></td>' +
                                '<td><div id="' + calendarEnd + '" class="calendar-end"></div></td>' +
                              '</tr>' +
                            '</tbody>' +
                          '</table>' +
                        '</div>' +
                        '<div class="separator"></div>' +
                        '<div>' +
                          '<button class="btn btn-main submit">Valider</button>' +
                          '<button class="btn cancel">Annuler</button>' +
                        '</div>'
                     '</div>';


        //the date range picker
        this.container = $(DRPTemplate).appendTo(this.parentEl);
        this.$customRangeContainer = $(DRPPopoverTemplate).appendTo(this.parentEl);
        this.$calendarStart = $('#' + calendarStart);
        this.$calendarEnd = $('#' + calendarEnd);

        if (hasOptions) {

            if (typeof options.format == 'string')
                this.format = options.format;

            if (typeof options.separator == 'string')
                this.separator = options.separator;

            if (typeof options.startDate == 'object')
                this.startDate = options.startDate;

            if (typeof options.endDate == 'object')
                this.endDate = options.endDate;

            if (typeof options.minDate == 'object')
                this.minDate = options.minDate;

            if (typeof options.maxDate == 'object')
                this.maxDate = options.maxDate;

            if (typeof options.currentDate == 'object')
                this.currentDate = options.currentDate;
                
            if (Object.prototype.toString.apply(options.separators) === '[object Array]') {
              this.separators = options.separators;
            }
            
            if (typeof options.calendarMinViewMode === 'string') {
              this.calendarMinViewMode = options.calendarMinViewMode;
            }
            
            if (typeof options.calendarStartView === 'string') {
              this.calendarStartView = options.calendarStartView;
            }
            
            if (typeof options.quarterlyView === 'boolean') {
              this.quarterlyView = options.quarterlyView;
            }
            
            if (typeof options.defaultRange === 'string') {
              this.defaultRange = options.defaultRange;              
            }
            
            if (typeof options.opensV == 'string') {
              this.opensV = options.opensV;
            }            

            if (typeof options.ranges == 'object') {
              for (var range in options.ranges) {
                var start = options.ranges[range][0];
                var end = options.ranges[range][1];

                if (typeof start == 'string')
                    start = moment(start);

                if (typeof end == 'string')
                    end = moment(end);

                // If we have a min/max date set, bound this range
                // to it, but only if it would otherwise fall
                // outside of the min/max.
                if (this.minDate && start < this.minDate) {
                    start = this.minDate;
                }
                if (this.maxDate && end > this.maxDate) {
                    end = this.maxDate;
                }
                // If the end of the range is before the minimum (if min is set) OR
                // the start of the range is after the max (also if set) don't display this
                // range option.
                if ((this.minDate && end < this.minDate) || (this.maxDate && start > this.maxDate)) {
                    continue;
                }

                this.ranges[range] = [moment(start).startOf('day'), moment(end).startOf('day')];
              }

              var list = '<ul>';
              var index = 0;
              if (this.opensV === 'top' && this.customRangeChoice) {                
                list += '<li class="range custom-range"><span class="checkmark"></span>' + this.locale.customRangeLabel + '</li>';
                list += '<li class="range divider"></li>';                
              } 
              _.each(this.ranges, function(value, key) {
                if (_.contains(this.separators, index)) {
                  list += '<li class="range divider"></li>';
                }
                var cssActive = '';
                if (key === this.defaultRange) {
                  cssActive = ' active';
                  this.startDate = value[0];
                  this.endDate = value[1];
                }
                list += '<li class="range"><span class="checkmark' + cssActive + '"></span>'
                         + key 
                         + '<span class="date-description">' 
                         + value[0].format('L') + ' - ' + value[1].format('L') 
                         + '</span></li>';
                index += 1;
              }, this)
              if (this.opensV === 'bottom' && this.customRangeChoice) {
                list += '<li class="range divider"></li>';                
                list += '<li class="range custom-range"><span class="checkmark"></span>' + this.locale.customRangeLabel + '</li>';
              }
              list += '</ul>';
              this.container.find('.ranges').prepend(list);
            }

            // update day names order to firstDay
            if (typeof options.locale == 'object') {
              if (typeof options.locale.firstDay == 'number') {
                this.locale.firstDay = options.locale.firstDay;
                var iterator = options.locale.firstDay;
                while (iterator > 0) {
                  this.locale.daysOfWeek.push(this.locale.daysOfWeek.shift());
                  iterator--;
                }
              }
            }

            if (typeof options.opens == 'string') {
                this.opens = options.opens;
            }                
        }

        if (typeof cb == 'function')
            this.cb = cb;

        this.container.addClass('opens' + this.opensV + this.opens);
        this.$customRangeContainer.addClass('opens' + this.opensV + this.opens);

        //event listeners
        this.container.find('.ranges').on('mousedown', 'li.range', $.proxy(this.mousedown, this));
        this.container.find('.ranges').on('click', 'li.range', $.proxy(this.clickRange, this));
        
        this.$customRangeContainer.on('click', 'button.cancel', $.proxy(this.cancelCustomRangePopover, this));
        this.$customRangeContainer.on('click', 'button.submit', $.proxy(this.submitCustomRangePopover, this));
        
        this.createCalendars();        
        this.$customRangeContainer.hide();
    };

    DateRangePicker.prototype = {

        constructor: DateRangePicker,

        mousedown: function (e) {
            e.stopPropagation();
            e.preventDefault();
        },

        notify: function () {
          this.$calendarStart.datepicker('update', this.startDate.format('MM/DD/YYYY'));
          this.$calendarEnd.datepicker('update', this.endDate.format('MM/DD/YYYY'));          
          this.cb(this.startDate, this.endDate);
        },

        move: function (container) {
            var parentOffset = {
                top: this.parentEl.offset().top - this.parentEl.scrollTop(),
                left: this.parentEl.offset().left - this.parentEl.scrollLeft()
            };
            var top = 0;
            if (this.opensV == 'bottom') {
              top = this.parentEl.height;
            } else {
              top = 0 - container.outerHeight();
            }
            if (this.opens == 'left') {
                container.css({
                    top: top,
                    right: 0,
                    left: 'auto'
                });
            } else {
                container.css({
                    top: top,
                    left: this.parentEl.width() - container.outerWidth(),
                    right: 'auto'
                });
            }
        },

        show: function (e) {
            this.container.show();
            this.move(this.container);

            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }

            this.changed = false;
            $(document).on('mousedown', $.proxy(this.hide, this));
        },

        hide: function (e) {          
            this.container.hide();
            $(document).off('mousedown', this.hide);

            if (this.changed) {
                this.changed = false;
                this.notify();
            }
        },

        clickRange: function (e) {
          $target = $(e.target);
          if ($target.is('span')) {
            $target = $target.parent();            
          }
          
          if ($target.hasClass('custom-range')) {
            this.hide();
            this.$customRangeContainer.show();
            this.move(this.$customRangeContainer);
            $(document).on('mousedown', $.proxy(this.clickOutsideCustomRangePopover, this));
            e.preventDefault();
            return false;
          } else {
            var label = $target.justtext();
            this.container.find('div.ranges li span.checkmark').removeClass('active');
            $target.find('span.checkmark').addClass('active');
            var dates = this.ranges[label];
            this.startDate = dates[0];
            this.endDate = dates[1];
            this.changed = true;
            this.hide();
          }
        },
        
        cancelCustomRangePopover: function(e) {
          this.$customRangeContainer.hide();
        },
        
        clickOutsideCustomRangePopover: function(e) {
    			if ($(e.target).closest('.daterangepicker-popover').length == 0) {
    				this.$customRangeContainer.hide();
    			}
        },
        
        submitCustomRangePopover: function(e) {
          this.startDate = moment(this.$calendarStart.data('datepicker').getDate());
          this.endDate = moment(this.$calendarEnd.data('datepicker').getDate());
          this.container.find('div.ranges li span.checkmark').removeClass('active');
          this.container.find('li.custom-range span.checkmark').addClass('active');
          this.notify();
          this.$customRangeContainer.hide();                    
        },
        
        createCalendars: function() {
          this.$calendarStart.datepicker({
            format: 'mm/dd/yyyy',
            weekStart: 1,
            language: 'fr', 
            startDate: this.minDate.format('MM/DD/YYYY'),
            endDate: this.currentDate.subtract('days', 1).format('MM/DD/YYYY'),
            minViewMode: this.calendarMinViewMode,
            quarterlyView: this.quarterlyView,
            startView: this.calendarStartView,
            todayHighlight: true,
            todayBtn: true
          });
          this.$calendarEnd.datepicker({
            format: 'mm/dd/yyyy',
            weekStart: 1,
            language: 'fr', 
            startDate: this.currentDate.add('days', 1).format('MM/DD/YYYY'),
            minViewMode: this.calendarMinViewMode,
            quarterlyView: this.quarterlyView,
            startView: this.calendarStartView,
            todayHighlight: true,
            todayBtn: true
          });
          this.$calendarStart.datepicker('update', this.startDate.format('MM/DD/YYYY'));
          this.$calendarEnd.datepicker('update', this.endDate.format('MM/DD/YYYY'));          
        }
    };

    $.fn.daterangepicker = function (options, cb) {
      this.each(function() {
        var el = $(this);
        if (!el.data('daterangepicker'))
          el.data('daterangepicker', new DateRangePicker(el, options, cb));
      });
      return this;
    };
    
    $.fn.justtext = function() {   
        return $(this).clone()
                .children()
                .remove()
                .end()
                .text(); 
    };

} (window.jQuery);

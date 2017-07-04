jQuery(function($){    
    $.datepicker.regional['zh-CN'] = {    
        clearText: '清除', clearStatus: '清除已选日期',  
        closeText: '关闭',    
        prevText: '<上月',    
        nextText: '下月>',    
        currentText: '今天',    
        monthNames: ['1月','2月','3月','4月','5月','6月',    
        '7月','8月','9月','10月','11月','12月'],    
        monthNamesShort: ['1','2','3','4','5','6',    
        '7','8','9','10','11','12'],    
        dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],    
        dayNamesShort: ['周日','周一','周二','周三','周四','周五','周六'],    
        dayNamesMin: ['日','一','二','三','四','五','六'],    
        weekHeader: '周',    
        dateFormat: 'yy-mm-dd',    
        firstDay: 1,    
        isRTL: false,    
        showMonthAfterYear: true,    
        yearSuffix: '年'
    };
    $.datepicker.setDefaults($.datepicker.regional['zh-CN']);    
});    

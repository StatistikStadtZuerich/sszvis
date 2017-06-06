(function(d3) {
  'use strict';

  d3.formatDefaultLocale({
    'decimal': '.',
    'thousands': ' ', // This is a 'narrow space', not a regular space. Used as the thousands separator by d3.format
    'grouping': [3],
    'currency': ['CHF ', ''],
    'dateTime': '%a. %e. %B %X %Y',
    'date': '%d.%m.%Y',
    'time': '%H:%M:%S',
    'periods': [],
    'days': ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    'shortDays': ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    'months': ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    'shortMonths': ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  });

  d3.timeFormatDefaultLocale({
    'decimal': '.',
    'thousands': ' ', // This is a 'narrow space', not a regular space. Used as the thousands separator by d3.format
    'grouping': [3],
    'currency': ['CHF ', ''],
    'dateTime': '%a. %e. %B %X %Y',
    'date': '%d.%m.%Y',
    'time': '%H:%M:%S',
    'periods': [],
    'days': ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    'shortDays': ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    'months': ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    'shortMonths': ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  });

  d3.time || (d3.time = {});
  d3.time.format = d3.timeFormat;

}(d3));

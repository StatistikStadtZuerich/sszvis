;(function() {

  var localizedFormat = d3.locale({
    "decimal": ".",
    "thousands": " ",
    "grouping": [3],
    "currency": ["CHF ", ""],
    "dateTime": "%a. %e. %B %X %Y",
    "date": "%d.%m.%Y",
    "time": "%H:%M:%S",
    "periods": [],
    "days": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    "shortDays": ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    "months": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    "shortMonths": ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
  });
  d3.format = localizedFormat.numberFormat
  d3.time.format = localizedFormat.timeFormat

}());

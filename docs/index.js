import React from 'react';
import ReactDOM from 'react-dom';
import {Catalog, pageLoader} from 'catalog';
import ProjectSpecimen from './ProjectSpecimen/Project';

const staticMarkdown = src => pageLoader(`${process.env.PUBLIC_URL}/${src}`);
const staticFile = src => `${process.env.PUBLIC_URL}/${src}`

const pages = [
  {
    path: 'intro-group',
    title: 'Introduction',
    pages: [
      {path: '/', title: 'Overview', content: staticMarkdown('intro.md')},
      {path: 'faq', title: 'FAQ', content: staticMarkdown('faq.md')},
      {path: 'changelog', title: 'Change Log', content: staticMarkdown('CHANGELOG.md')}
    ]
  },
  {
    path: 'style-guide',
    title: 'Style guide',
    pages: [
      {path: 'annotations', title: 'Annotations', content: staticMarkdown('style-guide/annotations.md')},
      {path: 'axes', title: 'Axes', content: staticMarkdown('style-guide/axes.md')},
      {path: 'behaviors', title: 'Behaviors', content: staticMarkdown('style-guide/behavior.md')},
      {path: 'breakpoints', title: 'Breakpoints', content: staticMarkdown('style-guide/breakpoints.md')},
      {
        path: 'colors',
        title: 'Colors',
        content: staticMarkdown('style-guide/colors.md'),
        styles: [staticFile('style-guide/colors.css')],
        scripts: [staticFile('style-guide/colors.js')]
      },
      {path: 'controls', title: 'Controls', content: staticMarkdown('style-guide/controls.md')},
      {path: 'legends', title: 'Legends', content: staticMarkdown('style-guide/legends.md')},
      {
        path: 'tooltips',
        title: 'Tooltips',
        content: staticMarkdown('style-guide/tooltips.md'),
        styles: [staticFile('style-guide/tooltips.css')],
        scripts: [staticFile('style-guide/tooltips.js')]
      }
    ]
  },
  {
    path: 'beginners',
    title: 'Beginner charts',
    content: staticMarkdown('beginners.md')
  },
  {
    path: 'line-charts',
    title: 'Line charts',
    pages: [
      {path: 'line-chart-single', title: 'Single', content: staticMarkdown('line-chart-single/README.md')},
      {path: 'line-chart-multiple', title: 'Multiple', content: staticMarkdown('line-chart-multiple/README.md')}
    ]
  },
  {
    path: 'bar-charts',
    title: 'Bar charts',
    pages: [
      {path: 'bar-chart-vertical', title: 'Vertical', content: staticMarkdown('bar-chart-vertical/README.md')},
      {path: 'bar-chart-vertical-stacked', title: 'Vertical (stacked)', content: staticMarkdown('bar-chart-vertical-stacked/README.md')},
      {path: 'bar-chart-horizontal', title: 'Horizontal', content: staticMarkdown('bar-chart-horizontal/README.md')},
      {path: 'bar-chart-horizontal-stacked', title: 'Horizontal (stacked)', content: staticMarkdown('bar-chart-horizontal-stacked/README.md')},
      {path: 'bar-chart-grouped', title: 'Grouped', content: staticMarkdown('bar-chart-grouped/README.md')}
    ]
  },
  {
    path: 'area-chart-stacked',
    title: 'Area charts',
    content: staticMarkdown('area-chart-stacked/README.md')
  },
  {
    path: 'map',
    title: 'Maps',
    pages: [
      {path: 'map-standard', title: 'Choropleth Maps', content: staticMarkdown('map-standard/README.md')},
      // {path: 'map-baselayer', title: 'Map Base Layers', content: staticMarkdown('map-baselayer/README.md')},
      {path: 'map-extended', title: 'Extended Maps', content: staticMarkdown('map-extended/README.md')},
      {path: 'map-signature', title: 'Signature Maps', content: staticMarkdown('map-signature/README.md')}
    ]
  },
  {
    path: 'various',
    title: 'Various',
    pages: [
      {path: 'heat-table', title: 'Heat table', content: staticMarkdown('heat-table/README.md') },
      {path: 'pie-charts', title: 'Pie chart', content: staticMarkdown('pie-charts/README.md') },
      {path: 'population-pyramid', title: 'Population pyramid', content: staticMarkdown('population-pyramid/README.md')},
      {path: 'scatterplot', title: 'Scatterplot', content: staticMarkdown('scatterplot/README.md')},
      {path: 'scatterplot-over-time', title: 'Scatterplot Over Time', content: staticMarkdown('scatterplot-over-time/README.md')},
      {path: 'sunburst', title: 'Sunburst', content: staticMarkdown('sunburst/README.md')},
      {path: 'sankey', title: 'Sankey Diagram (Parallel Sets)', content: staticMarkdown('sankey/README.md')}
    ]
  }
];

ReactDOM.render(
  <Catalog 
    title='SSZ Visualization Library'
    specimens={{
      project: ProjectSpecimen({
        sizes: [
          {width: '750px', height: '600px'},
          {width: '541px', height: '500px'},
          {width: '284px', height: '500px'}
        ]
      })
    }}
    theme={{
      background: '#fdfdfd',
      brandColor: '#0070bc',
      linkColor: '#CC6171',
      // msRatio: 1.1,
      pageHeadingBackground: '#f5f5f5',
      pageHeadingTextColor: '#0070bc',
      sidebarColorHeading: '#0070bc',
      sidebarColorText: '#777',
      sidebarColorTextActive: '#0070bc'
    }}
    pages={pages}
  />,
  document.getElementById('catalog')
);

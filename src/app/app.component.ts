import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  customColors = [];

  lineChartScheme = {
    domain: ['#073bfa', '#ef0909', '#000000'],
  };

  colorScheme = {
    domain: ['#135614', '#8a0000', '#726805', '#a89b9b'],
  };

  title = 'ngxBubbbleChartLineCombo';

  // // options
  legendTitle = 'Legend';
  animations: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Acceleration in (s) 0-100';
  yAxisLabel: string = 'Price in €';
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  gradient: boolean = true;
  showLegend: boolean = true;
  showGridLines: boolean = true;
  isLineChartEnabled: boolean = true;

  lineChartSeries = [
    {
      name: 'Scatter',
      series: [
        {
          value: 0,
          name: 0,
        },
        {
          value: 75000,
          name: 7.6,
        },
        {
          value: 75000,
          name: 9.6,
        },
      ],
    },
  ];

  bubbleChartData = [
    {
      name: 'BMW',
      series: [
        {
          name: 'BMW I116',
          x: 7.6,
          y: 50000,
          r: 63,
        },
      ],
    },
    {
      name: 'Tesla',
      series: [
        {
          name: 'Tesla Model Y',
          x: 7.6,
          y: 75000,
          r: 63,
        },
        {
          name: 'Tesla Model 3',
          x: 9.6,
          y: 55000,
          r: 63,
        },
      ],
    },
    {
      name: 'VW',
      series: [
        {
          name: 'VW Polo',
         x: 2.6,
          y: 20000,
          r: 63,
        },
      ],
    },
  ];

}

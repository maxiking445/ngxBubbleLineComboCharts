import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BubbleChartAndLineChartComponent } from './customchart/bubble-chart-and-line-chart.component';
import { BubbleChartAndLineChartSeriesComponent } from './customchart/bubble-chart-and-line-chart-series.component';
import { BubbleChartModule, NgxChartsModule } from '@swimlane/ngx-charts';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


@NgModule({
  declarations: [
    AppComponent,
    BubbleChartAndLineChartComponent,
    BubbleChartAndLineChartSeriesComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NgxChartsModule,
    BubbleChartModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

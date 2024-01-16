import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ContentChild,
  TemplateRef
} from '@angular/core';
import {trigger, style, animate, transition} from '@angular/animations';
import {isPlatformServer} from '@angular/common';
import {scaleBand, scaleLinear, scalePoint, scaleTime} from 'd3-scale';
import {
  BaseChartComponent,
  BubbleChartSeries, calculateViewDimensions,
  ColorHelper, getDomain, getScale, getScaleType, id, LegendOptions,
  LegendPosition,
  ScaleType,
  ViewDimensions
} from "@swimlane/ngx-charts";
import {curveLinear} from 'd3-shape';

@Component({
  selector: 'ngx-charts-bubble-chart-and-line-chart',
  template: `
    <ngx-charts-chart
      [view]="[width, height]"
      [showLegend]="legend"
      [activeEntries]="activeEntries"
      [legendOptions]="legendOptions"
      [animations]="animations"
      (legendLabelClick)="onClick($event)"
      (legendLabelActivate)="onActivate($event)"
      (legendLabelDeactivate)="onDeactivate($event)"
    >
      <svg:defs>
        <svg:clipPath [attr.id]="clipPathId">
          <svg:rect
            [attr.width]="dims.width + 10"
            [attr.height]="dims.height + 10"
            [attr.transform]="'translate(-5, -5)'"
          />
        </svg:clipPath>
      </svg:defs>
      <svg:g [attr.transform]="transform" class="bubble-chart chart">
        <svg:g
          ngx-charts-x-axis
          *ngIf="xAxis"
          [showGridLines]="showGridLines"
          [dims]="dims"
          [xScale]="xScale"
          [showLabel]="showXAxisLabel"
          [labelText]="xAxisLabel"
          [trimTicks]="trimXAxisTicks"
          [rotateTicks]="rotateXAxisTicks"
          [maxTickLength]="maxXAxisTickLength"
          [tickFormatting]="xAxisTickFormatting"
          [ticks]="xAxisTicks"
          [wrapTicks]="wrapTicks"
          (dimensionsChanged)="updateXAxisHeight($event)"
        />
        <svg:g
          ngx-charts-y-axis
          *ngIf="yAxis"
          [showGridLines]="showGridLines"
          [yScale]="yScale"
          [dims]="dims"
          [showLabel]="showYAxisLabel"
          [labelText]="yAxisLabel"
          [trimTicks]="trimYAxisTicks"
          [maxTickLength]="maxYAxisTickLength"
          [tickFormatting]="yAxisTickFormatting"
          [ticks]="yAxisTicks"
          [wrapTicks]="wrapTicks"
          (dimensionsChanged)="updateYAxisWidth($event)"
        />
        <svg:rect
          class="bubble-chart-area"
          x="0"
          y="0"
          [attr.width]="dims.width"
          [attr.height]="dims.height"
          style="fill: rgb(255, 0, 0); opacity: 0; cursor: 'auto';"
          (mouseenter)="deactivateAll()"
        />
        <svg:g *ngIf="!isSSR" [attr.clip-path]="clipPath">
          <svg:g *ngFor="let series of data; trackBy: trackBy" [@animationState]="'active'">
            <svg:g
              ngx-charts-and-line-bubble-series
              [xScale]="xScale"
              [yScale]="yScale"
              [rScale]="rScale"
              [xScaleType]="xScaleType"
              [yScaleType]="yScaleType"
              [xAxisLabel]="xAxisLabel"
              [yAxisLabel]="yAxisLabel"
              [colors]="colors"
              [data]="series"
              [activeEntries]="activeEntries"
              [tooltipDisabled]="tooltipDisabled"
              [tooltipTemplate]="tooltipTemplate"
              (select)="onClick($event, series)"
              (activate)="onActivate($event)"
              (deactivate)="onDeactivate($event)"
            />
          </svg:g>
        </svg:g>
        <svg:g *ngIf="isSSR" [attr.clip-path]="clipPath">
          <svg:g *ngFor="let series of data; trackBy: trackBy">
            <svg:g
              ngx-charts-and-line-bubble-series
              [xScale]="xScale"
              [yScale]="yScale"
              [rScale]="rScale"
              [xScaleType]="xScaleType"
              [yScaleType]="yScaleType"
              [xAxisLabel]="xAxisLabel"
              [yAxisLabel]="yAxisLabel"
              [colors]="colors"
              [data]="series"
              [activeEntries]="activeEntries"
              [tooltipDisabled]="tooltipDisabled"
              [tooltipTemplate]="tooltipTemplate"
              (select)="onClick($event, series)"
              (activate)="onActivate($event)"
              (deactivate)="onDeactivate($event)"
            />
          </svg:g>
        </svg:g>
      </svg:g>
      <svg:g *ngIf="isLineChartEnabled" [attr.transform]="transform" class="line-chart chart">
        <svg:g>


          <svg:g *ngFor="let series of linedata; trackBy: trackBy">
            <svg:g
              ngx-charts-line-series
              [xScale]="xScaleLine"
              [yScale]="yScaleLine"
              [colors]="linegraphColors"
              [data]="series"
              [activeEntries]="activeEntries"
              [scaleType]="scaleType"
              [curve]="curve"
              [animations]="animations"
            />
          </svg:g>

          <svg:g
            ngx-charts-tooltip-area
            *ngIf="!tooltipDisabled"
            [dims]="dims"
            [xSet]="xSet"
            [xScale]="xScaleLine"
            [yScale]="yScaleLine"
            [results]="linedata"
            [colors]="linegraphColors"
            [tooltipDisabled]="tooltipDisabled"
            (hover)="updateHoveredVertical($event)"
          />

          <svg:g *ngFor="let series of linedata">
            <svg:g
              ngx-charts-circle-series
              [xScale]="xScaleLine"
              [yScale]="yScaleLine"
              [colors]="linegraphColors"
              [data]="series"
              [scaleType]="scaleType"
              [visibleValue]="hoveredVertical"
              [activeEntries]="activeEntries"
              [tooltipDisabled]="tooltipDisabled"
              (select)="onClick($event)"
              (activate)="onActivate($event)"
              (deactivate)="onDeactivate($event)"
            />
          </svg:g>

        </svg:g>
      </svg:g>
    </ngx-charts-chart>
  `,
  styleUrls: ['bubble-chart-and-line-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('animationState', [
      transition(':leave', [
        style({
          opacity: 1
        }),
        animate(
          500,
          style({
            opacity: 0
          })
        )
      ])
    ])
  ]
})
export class BubbleChartAndLineChartComponent extends BaseChartComponent {
  @Input() showGridLines: boolean = true;
  @Input() legend = false;
  @Input() legendTitle: string = 'Legend';
  @Input() legendPosition: LegendPosition = LegendPosition.Right;
  @Input() xAxis: boolean = true;
  @Input() yAxis: boolean = true;
  @Input() showXAxisLabel: boolean;
  @Input() showYAxisLabel: boolean;
  @Input() xAxisLabel: string;
  @Input() yAxisLabel: string;
  @Input() trimXAxisTicks: boolean = true;
  @Input() trimYAxisTicks: boolean = true;
  @Input() rotateXAxisTicks: boolean = true;
  @Input() maxXAxisTickLength: number = 16;
  @Input() maxYAxisTickLength: number = 16;
  @Input() xAxisTickFormatting: any;
  @Input() yAxisTickFormatting: any;
  @Input() xAxisTicks: any[];
  @Input() yAxisTicks: any[];
  @Input() roundDomains: boolean = false;
  @Input() maxRadius: number = 10;
  @Input() minRadius: number = 3;
  @Input() autoScale: boolean;
  @Input() schemeType: ScaleType = ScaleType.Ordinal;
  @Input() tooltipDisabled: boolean = false;
  @Input() xScaleMin: number;
  @Input() xScaleMax: number;
  @Input() yScaleMin: number;
  @Input() yScaleMax: number;
  @Input() wrapTicks = false;
  @Input() linedata: any;
  @Input() lineChartScheme: any;
  @Input() isLineChartEnabled: boolean;

  @Output() activate: EventEmitter<any> = new EventEmitter();
  @Output() deactivate: EventEmitter<any> = new EventEmitter();

  @ContentChild('tooltipTemplate') tooltipTemplate: TemplateRef<any>;
  linegraphColors: ColorHelper

  curve: any = curveLinear;
  dims: ViewDimensions;
  colors: ColorHelper;
  scaleType: ScaleType = ScaleType.Linear;
  margin: number[] = [10, 20, 10, 20];
  bubblePadding: number[] = [0, 0, 0, 0];
  data: BubbleChartSeries[];

  legendOptions: LegendOptions;
  transform: string;

  clipPath: string;
  clipPathId: string;

  seriesDomain: number[];
  xDomain: number[];
  yDomain: number[];
  rDomain: number[];

  xScaleType: ScaleType;
  yScaleType: ScaleType;

  yScale: any;
  xScale: any;
  rScale: any;

  xAxisHeight: number = 0;
  yAxisWidth: number = 0;

  activeEntries: any[] = [];

  isSSR = false;
  xScaleLine: any;
  yScaleLine: any;
  yRightAxisScaleFactor: any;
  private xDomainLine: any;
  private yDomainLine: any[];
  private bandwidth: number;
  private filteredDomain: any;
  private hoveredVertical;
  private xSet;


  ngOnInit() {
    if (isPlatformServer(this.platformId)) {
      this.isSSR = true;
    }
  }

  update(): void {
    super.update();

    this.dims = calculateViewDimensions({
      width: this.width,
      height: this.height,
      margins: this.margin,
      showXAxis: this.xAxis,
      showYAxis: this.yAxis,
      xAxisHeight: this.xAxisHeight,
      yAxisWidth: this.yAxisWidth,
      showXLabel: this.showXAxisLabel,
      showYLabel: this.showYAxisLabel,
      showLegend: this.legend,
      legendType: this.schemeType,
      legendPosition: this.legendPosition
    });

    this.seriesDomain = this.results.map(d => d.name);
    this.rDomain = this.getRDomain();
    this.xDomain = this.getXDomain();
    this.yDomain = this.getYDomain();


    const colorDomain = this.schemeType === ScaleType.Ordinal ? this.seriesDomain : this.rDomain;
    this.colors = new ColorHelper(this.scheme, this.schemeType, colorDomain, this.customColors);

    this.data = this.results;

    this.minRadius = Math.max(this.minRadius, 1);
    this.maxRadius = Math.max(this.maxRadius, 1);

    this.rScale = this.getRScale(this.rDomain, [this.minRadius, this.maxRadius]);

    this.bubblePadding = [0, 0, 0, 0];
    this.setScales();

    this.bubblePadding = this.getBubblePadding();
    this.setScales();

    this.legendOptions = this.getLegendOptions();

    this.clipPathId = 'clip' + id().toString();
    this.clipPath = `url(#${this.clipPathId})`;

    //Linechart
    if (this.linedata !== undefined) {
      this.xDomainLine = this.getXDomainLine();
      if (this.filteredDomain) {
        this.xDomainLine = this.filteredDomain;
      }

      this.yDomainLine = this.getYDomainLine();
      // this.seriesDomain = this.getSeriesDomain();
      this.scaleLines();
      // this.legendOptions = this.getLegendOptions();

      this.setColors()

    }
    this.transform = `translate(${this.dims.xOffset},${this.margin[0]})`;
  }

  setColors(): void {
    let domain;
    if (this.schemeType === ScaleType.Ordinal) {
      domain = this.xDomain;
    } else {
      domain = this.yDomain;
    }

    this.colors = new ColorHelper(this.scheme, this.schemeType, domain, this.customColors);
    this.linegraphColors = new ColorHelper(this.lineChartScheme, this.schemeType, domain, this.customColors);
  }

  isDate(value): boolean {
    if (value instanceof Date) {
      return true;
    }

    return false;
  }

  @HostListener('mouseleave')
  hideCircles(): void {
    this.hoveredVertical = null;
    this.deactivateAll();
  }

  updateHoveredVertical(item): void {
    this.hoveredVertical = item.value;
    this.deactivateAll();
  }

  getScaleType(values): ScaleType {
    let date = true;
    let num = true;

    for (const value of values) {
      if (!this.isDate(value)) {
        date = false;
      }

      if (typeof value !== 'number') {
        num = false;
      }
    }

    if (date) {
      return ScaleType.Time;
    }

    if (num) {
      return ScaleType.Linear;
    }

    return ScaleType.Ordinal;
  }

  getXDomainLine(): any[] {
    let lineChartValues = [];
    let bubblechartValues = [];
    //MaxXData from Linedata
    for (const results of this.linedata) {
      for (const d of results.series) {
        if (!lineChartValues.includes(d.name)) {
          lineChartValues.push(d.name);
        }
      }
    }
    //MaxXData from BubblechartData
    for (const results of this.results) {
      for (const d of results.series) {
        if (!bubblechartValues.includes(d.x)) {
          bubblechartValues.push(d.x);
        }
      }
    }

    this.scaleType = this.getScaleType(lineChartValues);
    let domain = [];

    if (this.scaleType === 'time') {
      const min = Math.min(...lineChartValues);
      const max = Math.max(...lineChartValues);
      domain = [min, max];
    } else if (this.scaleType === 'linear') {
      lineChartValues = lineChartValues.map(v => Number(v));
      const minLinechart = Math.min(...lineChartValues);
      const minBubble = Math.min(...bubblechartValues);
      const maxBubble = Math.max(...bubblechartValues);
      const maxLinechart = Math.max(...lineChartValues);

      domain = [Math.min(minBubble, minLinechart), Math.max(maxBubble, maxLinechart)];

    } else {
      domain = lineChartValues;
    }
    this.xSet = lineChartValues;
    return domain;
  }

  getYDomainLine(): any[] {
    const domain = [];

    for (const results of this.linedata) {
      for (const d of results.series) {
        if (domain.indexOf(d.value) < 0) {
          domain.push(d.value);
        }
        if (d.min !== undefined) {
          if (domain.indexOf(d.min) < 0) {
            domain.push(d.min);
          }
        }
        if (d.max !== undefined) {
          if (domain.indexOf(d.max) < 0) {
            domain.push(d.max);
          }
        }
      }
    }

    let min = Math.min(...domain);
    const max = Math.max(...domain);
    if (this.yRightAxisScaleFactor) {
      const minMax = this.yRightAxisScaleFactor(min, max);
      return [Math.min(0, minMax.min), minMax.max];
    } else {
      min = Math.min(0, min);
      return [min, max];
    }
  }

  getXScaleLine(domain, width): any {
    const barPadding = 0;
    let scale;
    if (this.bandwidth === undefined) {
      this.bandwidth = width - barPadding;
    }
    const offset = Math.floor((width + barPadding - (this.bandwidth + barPadding) * domain.length) / 2);

    if (this.scaleType === 'time') {
      scale = scaleTime().range([0, width]).domain(domain);
    } else if (this.scaleType === 'linear') {
      scale = scaleLinear().range([0, width]).domain(domain);

      if (this.roundDomains) {
        scale = scale.nice();
      }
    } else if (this.scaleType === 'ordinal') {
      scale = scalePoint()
        .range([offset + this.bandwidth / 2, width - offset - this.bandwidth / 2])
        .domain(domain);
    }
    return scale;
  }

  getYScaleLine(domain, height): any {
    const scale = scaleLinear().range([height, 0]).domain(domain);

    return this.roundDomains ? scale.nice() : scale;
  }

  scaleLines() {
    this.xScaleLine = this.getXScaleLine(this.xDomainLine, this.dims.width);
    this.yScaleLine = this.getYScaleLine(this.yDomainLine, this.dims.height);
  }

  // getSeriesDomain(): any[] {
  //   this.combinedSeries = this.lineChart.slice(0);
  //   this.combinedSeries.push({
  //     name: this.yAxisLabel,
  //     series: this.results
  //   });
  //   return this.combinedSeries.map(d => d.name);
  // }


  onClick(data) {
    this.select.emit(data);
  }

  getBubblePadding(): number[] {
    let yMin = 0;
    let xMin = 0;
    let yMax = this.dims.height;
    let xMax = this.dims.width;

    for (const s of this.data) {
      for (const d of s.series) {
        const r = this.rScale(d.r);
        const cx = this.xScaleType === ScaleType.Linear ? this.xScale(Number(d.x)) : this.xScale(d.x);
        const cy = this.yScaleType === ScaleType.Linear ? this.yScale(Number(d.y)) : this.yScale(d.y);
        xMin = Math.max(r - cx, xMin);
        yMin = Math.max(r - cy, yMin);
        yMax = Math.max(cy + r, yMax);
        xMax = Math.max(cx + r, xMax);
      }
    }
    xMax = Math.max(xMax - this.dims.width, 0);
    yMax = Math.max(yMax - this.dims.height, 0);
    return [yMin, xMax, yMax, xMin];
  }

  setScales() {
    let width = this.dims.width;
    if (this.xScaleMin === undefined && this.xScaleMax === undefined) {
      width = width - this.bubblePadding[1];
    }
    let height = this.dims.height;
    if (this.yScaleMin === undefined && this.yScaleMax === undefined) {
      height = height - this.bubblePadding[2];
    }
    this.xScale = this.getXScale(this.xDomain, width);
    this.yScale = this.getYScale(this.yDomain, height);
  }

  getYScale(domain, height: number): any {
    return getScale(domain, [height, this.bubblePadding[0]], this.yScaleType, this.roundDomains);
  }

  getXScale(domain, width: number): any {
    return getScale(domain, [this.bubblePadding[3], width], this.xScaleType, this.roundDomains);
  }

  getRScale(domain, range): any {
    const scale = scaleLinear().range(range).domain(domain);

    return this.roundDomains ? scale.nice() : scale;
  }

  getLegendOptions(): LegendOptions {
    const opts = {
      scaleType: this.schemeType as any,
      colors: undefined,
      domain: [],
      position: this.legendPosition,
      title: undefined
    };

    if (opts.scaleType === ScaleType.Ordinal) {
      opts.domain = this.seriesDomain;
      opts.colors = this.colors;
      opts.title = this.legendTitle;
    } else {
      opts.domain = this.rDomain;
      opts.colors = this.colors.scale;
    }

    return opts;
  }

  getXDomain(): number[] {
    const values = [];

    for (const results of this.results) {
      for (const d of results.series) {
        if (!values.includes(d.x)) {
          values.push(d.x);
        }
      }
    }

    this.xScaleType = getScaleType(values);
    return getDomain(values, this.xScaleType, this.autoScale, this.xScaleMin, this.xScaleMax);
  }

  getYDomain(): number[] {
    const values = [];

    for (const results of this.results) {
      for (const d of results.series) {
        if (!values.includes(d.y)) {
          values.push(d.y);
        }
      }
    }

    this.yScaleType = getScaleType(values);
    if (this.isLineChartEnabled){
      const domain = [];
      for (const results of this.linedata) {
        for (const d of results.series) {
          if (domain.indexOf(d.value) < 0) {
            domain.push(d.value);
          }
          if (d.min !== undefined) {
            if (domain.indexOf(d.min) < 0) {
              domain.push(d.min);
            }
          }
          if (d.max !== undefined) {
            if (domain.indexOf(d.max) < 0) {
              domain.push(d.max);
            }
          }
        }
      }
      const max = Math.max(...domain);
      this.yScaleMax = max
    }
    return getDomain(values, this.yScaleType, this.autoScale, this.yScaleMin, this.yScaleMax);
  }

  getRDomain(): [number, number] {
    let min = Infinity;
    let max = -Infinity;

    for (const results of this.results) {
      for (const d of results.series) {
        const value = Number(d.r) || 1;
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }

    return [min, max];
  }

  updateYAxisWidth({width}: { width: number }): void {
    this.yAxisWidth = width;
    this.update();
  }

  updateXAxisHeight({height}: { height: number }): void {
    this.xAxisHeight = height;
    this.update();
  }

  onActivate(item): void {
    const idx = this.activeEntries.findIndex(d => {
      return d.name === item.name;
    });
    if (idx > -1) {
      return;
    }

    this.activeEntries = [item, ...this.activeEntries];
    this.activate.emit({value: item, entries: this.activeEntries});
  }

  onDeactivate(item): void {
    const idx = this.activeEntries.findIndex(d => {
      return d.name === item.name;
    });

    this.activeEntries.splice(idx, 1);
    this.activeEntries = [...this.activeEntries];

    this.deactivate.emit({value: item, entries: this.activeEntries});
  }

  deactivateAll(): void {
    this.activeEntries = [...this.activeEntries];
    for (const entry of this.activeEntries) {
      this.deactivate.emit({value: entry, entries: []});
    }
    this.activeEntries = [];
  }

  trackBy(index: number, item): string {
    return `${item.name}`;
  }
}

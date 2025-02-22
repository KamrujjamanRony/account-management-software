import { Component, ElementRef, ViewChild, Input } from '@angular/core';
import ApexCharts from 'apexcharts';

@Component({
  selector: 'app-apex-chart',
  imports: [],
  templateUrl: './apex-chart.component.html',
  styleUrl: './apex-chart.component.css'
})
export class ApexChartComponent {
  @ViewChild('chart', { static: true }) chartElement!: ElementRef;
  @Input() chartData!: any;
  @Input() categories!: any;

  ngAfterViewInit() {
    const options = {
      series: this.chartData,
      chart: {
        type: "bar",
        height: 450,
        fontFamily: "Inter, sans-serif",
        toolbar: { show: false }
      },
      dataLabels: {
        enabled: false,
        textAnchor: 'start',
        offsetY: 50,
        offsetX: -20,
        style: {
          colors: ['#333']
        },
        background: {
          enabled: true,
          foreColor: '#fff', // Text color
          padding: 1,
          borderRadius: 3,
          borderWidth: 1,
          borderColor: '#333', // Border color
          opacity: 0.9
        }
      },
      plotOptions: {
        bar: { horizontal: false, columnWidth: "70%", borderRadius: 8 }
      },
      xaxis: {
        categories: this.categories,
        labels: { style: { fontFamily: "Inter, sans-serif" } }
      },
      yaxis: { show: true },
      fill: { opacity: 1 },
      colors: ["#1A56DB", "#FDBA8C"]
    };

    const chart = new ApexCharts(this.chartElement.nativeElement, options);
    chart.render();
  }

}

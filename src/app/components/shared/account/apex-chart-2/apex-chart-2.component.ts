import { Component, ElementRef, ViewChild, Input, AfterViewInit } from '@angular/core';
import ApexCharts from 'apexcharts';

@Component({
  selector: 'app-apex-chart-2',
  templateUrl: './apex-chart-2.component.html',
  styleUrls: ['./apex-chart-2.component.css']
})
export class ApexChart2Component implements AfterViewInit {
  @ViewChild('chart2', { static: true }) chartElement!: ElementRef;
  @Input() chartData!: any;  // Data should be passed from parent component

  ngAfterViewInit() {
    if (!this.chartData || this.chartData.length === 0) return;  // Ensure data is available
    console.log(this.chartData)

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Convert `chartData` into proper format for ApexCharts
    const formattedSeries = this.chartData?.map((series: any) => ({
      name: series.name,
      data: series.data?.map((value: number, index: number) => ({
        x: monthNames[index],  // Month name as label
        y: value
      }))
    }));

    const options = {
      series: formattedSeries,
      chart: {
        type: "bar",
        height: 350,
        fontFamily: "Inter, sans-serif",
        toolbar: { show: false }
      },
      dataLabels: {
        enabled: true,
        dropShadow: {
          enabled: true,
          left: 2,
          top: 2,
          opacity: 0.2
        },
        style: {
          colors: ['#333']
        },
        background: {
          enabled: true,
          foreColor: '#fff', // Text color inside labels
          padding: 4,
          borderRadius: 5,
          borderWidth: 1,
          borderColor: '#333', // Border color
          opacity: 0.8
        }
      },
      plotOptions: {
        bar: { horizontal: false, columnWidth: "70%", borderRadius: 8 }
      },
      xaxis: {
        categories: monthNames,
        labels: { style: { fontFamily: "Inter, sans-serif" } }
      },
      yaxis: { show: true },
      fill: { opacity: 1 },
      colors: ["#1A56DB"]
    };

    const chart = new ApexCharts(this.chartElement.nativeElement, options);
    chart.render();
  }
}

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ChartModule } from 'primeng/chart';
import { UIChart } from 'primeng/chart';
import { DashboardManagementService } from '../dashboard-management.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    NzTabsModule, CommonModule, NzCardModule, NzSpinModule, ChartModule, NzIconModule, NzGridModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  public loading = false;
  public summaryList: any[] = [];

  public categoryChartOptions: any;
  public monthlyChartOptions: any;

  @ViewChild('monthlyChartCanvas', { static: false }) monthlyChartRef!: UIChart;
  @ViewChild('categoryChartCanvas', { static: false }) categoryChartRef!: UIChart;

  constructor(private dashboardService: DashboardManagementService) {
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.dashboardService.getAdminDashboard().subscribe({
      next: (res) => {
        this.summaryList = res.summaryCards;

        // Category Chart (Pie)
        this.categoryChartOptions = {
          type: res.chart.chartType,
          data: {
            labels: res.chart.labels,
            datasets: [{
              data: res.chart.values,
              backgroundColor: ['#F8B94F', '#EC7B6B', '#49BAC8', '#A7D398', '#74A3D4']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              },
              title: {
                display: true,
                text: 'Top 5 Orders by Category',
                font: {
                  size: 16,
                  weight: 'bold'
                }
              }
            },
          }
        };

        // Monthly Trend Chart (Line)
        this.monthlyChartOptions = {
          type: res.additionalCharts[0].chartType,
          data: {
            labels: res.additionalCharts[0].labels,
            datasets: [{
              data: res.additionalCharts[0].values,
              fill: true,
              borderColor: '#1890ff',
              tension: 0.1
            }]
          },
          options: {
            plugins: {
              responsive: true,
              maintainAspectRatio: false,
              legend: { display: false },
              title: {
                display: true,
                text: 'Monthly Orders Trend',
                font: {
                  size: 16,
                  weight: 'bold'
                }
              }
            },
            scales: {
              x: { title: { display: true, text: 'Month' } },
              y: { title: { display: true, text: 'Total Orders' } }
            }
          }
        };

        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  downloadChart(chartName: 'monthly_trend' | 'top_5_category') {
    let chartComponent: UIChart | null = null;

    if (chartName === 'monthly_trend' && this.monthlyChartRef) {
      chartComponent = this.monthlyChartRef;
    } else if (chartName === 'top_5_category' && this.categoryChartRef) {
      chartComponent = this.categoryChartRef;
    }

    if (chartComponent && chartComponent.chart) {
      const canvas = chartComponent.chart.canvas as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Create a temporary off-screen canvas with white background
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
          // Fill with white background
          tempCtx.fillStyle = '#ffffff';
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

          // Draw the existing chart onto the white background
          tempCtx.drawImage(canvas, 0, 0);

          // Export as PNG
          const image = tempCanvas.toDataURL('image/png');

          const link = document.createElement('a');
          link.href = image;
          link.download = `${chartName}_chart.png`;
          link.click();
        }
      }
    }
  }
}

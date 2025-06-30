import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { ChartModule } from 'primeng/chart';
import { DashboardManagementService } from '../dashboard-management.service';

@Component({
  selector: 'app-order-dashboard',
  standalone: true,
  imports: [
    CommonModule, NzCardModule, NzSpinModule, ChartModule, NzIconModule, NzGridModule
  ],
  templateUrl: './order-dashboard.component.html',
  styleUrl: './order-dashboard.component.scss'
})
export class OrderDashboardComponent implements OnInit {
  public loading = false;
  public summaryList: any[] = [];
  public chartOptions: any;
  public notifications: string[] = [];

  constructor(private dashboardService: DashboardManagementService) {
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.dashboardService.getOrderDashboard().subscribe(res => {
      this.summaryList = res.summaryCards;
      this.notifications = res.notifications;

      this.chartOptions = {
        type: res.chart.chartType,
        data: {
          labels: res.chart.labels,
          datasets: [{
            data: res.chart.values,
            backgroundColor: ['#F8B94F', '#EC7B6B', '#49BAC8', '#A7D398', '#74A3D4', '#969696'],
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
              text: 'Total Orders By Status',
              font: {
                size: 16,
                weight: 'bold'
              }
            }
          }
        }
      };
    })
  }

  downloadChart() {
    const canvas = document.querySelector('app-order-dashboard canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Create an offscreen canvas with the same size
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        // Fill with white
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw the original chart over the white background
        tempCtx.drawImage(canvas, 0, 0);

        // Export as PNG
        const image = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = 'order_status_chart.png';
        link.click();
      }
    }
  }
}

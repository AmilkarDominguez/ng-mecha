import { Component } from '@angular/core';
import { BirthdayCard } from './components/birthday-card/birthday-card';
import { LowStockCard } from './components/low-stock-card/low-stock-card';
import { ReceivablesCard } from './components/receivables-card/receivables-card';
import { StatTiles } from './components/stat-tiles/stat-tiles';
import { IncomeExpenseTrendCard } from './components/income-expense-trend-card/income-expense-trend-card';
import { OrderStatusCard } from './components/order-status-card/order-status-card';
import { TopServicesCard } from './components/top-services-card/top-services-card';
import { RecentOrdersCard } from './components/recent-orders-card/recent-orders-card';

@Component({
  selector: 'app-dashboard',
  imports: [
    BirthdayCard,
    LowStockCard,
    ReceivablesCard,
    StatTiles,
    IncomeExpenseTrendCard,
    OrderStatusCard,
    TopServicesCard,
    RecentOrdersCard,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {}

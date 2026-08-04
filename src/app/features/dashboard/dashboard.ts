import { Component } from '@angular/core';
import { BirthdayCard } from './components/birthday-card/birthday-card';
import { LowStockCard } from './components/low-stock-card/low-stock-card';

@Component({
  selector: 'app-dashboard',
  imports: [BirthdayCard, LowStockCard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {}

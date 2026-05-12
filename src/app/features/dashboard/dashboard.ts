import { Component } from '@angular/core';
import { BirthdayCard } from './components/birthday-card/birthday-card';

@Component({
  selector: 'app-dashboard',
  imports: [BirthdayCard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {}

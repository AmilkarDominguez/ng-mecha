import { Component, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { RouterOutlet } from '@angular/router';
import { NavMenu } from '../../features/dashboard/components/nav-menu/nav-menu';

@Component({
  selector: 'app-admin-layout',
  imports: [MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule, MatDividerModule, RouterOutlet, NavMenu],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  sidenavOpen = signal(false);
}

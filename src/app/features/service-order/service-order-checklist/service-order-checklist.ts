import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SPServiceOrder } from '../../../core/services/supabase/sb-service-order';
import { SPServiceOrderProcessCheck } from '../../../core/services/supabase/sb-service-order-process-check';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ServiceOrder } from '../../../core/models/service-order.model';
import { ServiceOrderChecklistSection } from '../../../core/models/service-order-process-check.model';

@Component({
  selector: 'app-service-order-checklist',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatTooltipModule, MatCheckboxModule, MatProgressSpinnerModule],
  templateUrl: './service-order-checklist.html',
  styleUrl: './service-order-checklist.scss',
})
export class ServiceOrderChecklist implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(SPServiceOrder);
  private checklistService = inject(SPServiceOrderProcessCheck);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly order = signal<ServiceOrder | null>(null);
  readonly sections = signal<ServiceOrderChecklistSection[]>([]);

  private orderId = '';

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.orderId) {
      this.router.navigate(['/dashboard/ordenes/en-curso']);
      return;
    }
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.orderService.getById(this.orderId).subscribe({
      next: (order) => {
        this.order.set(order);
        // sync es best-effort: si falla igual intentamos mostrar el
        // checklist que ya exista (ej. sin conexion momentanea a la RPC).
        this.checklistService.sync(this.orderId).subscribe({
          next: () => this.loadSections(),
          error: () => this.loadSections(),
        });
      },
      error: () => {
        this.snackBar.open('No se pudo cargar la orden', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  private loadSections(): void {
    this.checklistService.getSections(this.orderId).subscribe({
      next: (sections) => {
        this.sections.set(sections);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('No se pudo cargar el checklist', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  totalChecked(): number {
    return this.sections().reduce((acc, s) => acc + s.items.filter((i) => i.checked).length, 0);
  }

  totalItems(): number {
    return this.sections().reduce((acc, s) => acc + s.items.length, 0);
  }

  onToggle(sectionIndex: number, itemIndex: number, event: MatCheckboxChange): void {
    const item = this.sections()[sectionIndex].items[itemIndex];
    const userId = this.authService.currentUser()?.id ?? null;
    const checked = event.checked;

    this.checklistService.toggle(item.id, checked, userId).subscribe({
      next: (updated) => {
        this.sections.update((sections) => {
          const copy = sections.map((s) => ({ ...s, items: [...s.items] }));
          copy[sectionIndex].items[itemIndex] = updated;
          return copy;
        });
      },
      error: () => {
        this.snackBar.open('No se pudo actualizar el proceso', 'Cerrar', { duration: 3000 });
      },
    });
  }

  checkedByLabel(item: ServiceOrderChecklistSection['items'][number]): string {
    const user = item.checked_by_user;
    if (!user) return '';
    return [user.name, user.lastname].filter(Boolean).join(' ') || 'Sistema';
  }

  onBack(): void {
    this.router.navigate(['/dashboard/ordenes/en-curso']);
  }
}

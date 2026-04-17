import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { Industry } from '../../../core/models/industry.model';
import { SPIndustry } from '../../../core/services/supabase/sb-industry';
import { IndustryTable } from './components/industry-table/industry-table';
import { IndustryFormModal, IndustryFormData } from './components/industry-form-modal/industry-form-modal';
import { IndustryDetailModal } from './components/industry-detail-modal/industry-detail-modal';
import { IndustryDeleteConfirmModal } from './components/industry-delete-confirm-modal/industry-delete-confirm-modal';

@Component({
  selector: 'app-industry-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    IndustryTable,
  ],
  templateUrl: './industry-dashboard.html',
  styleUrl: './industry-dashboard.scss',
})
export class IndustryDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private service = inject(SPIndustry);

  readonly industries = toSignal(this.service.listen(), { initialValue: [] });
  readonly searchTerm = signal('');

  readonly filteredIndustries = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.industries();
    return this.industries().filter(
      (i) =>
        i.name.toLowerCase().includes(term) ||
        (i.description ?? '').toLowerCase().includes(term),
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(IndustryFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: {} satisfies IndustryFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const newIndustry: Industry = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
      };

      this.service.add(newIndustry).subscribe(() => {
        this.snackBar.open('Industria registrada correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onEdit(industry: Industry): void {
    const ref = this.dialog.open(IndustryFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: { industry } satisfies IndustryFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;

      this.service.update({ ...result, id: industry.id }).subscribe(() => {
        this.snackBar.open('Industria actualizada correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onView(industry: Industry): void {
    this.dialog.open(IndustryDetailModal, {
      width: '38rem',
      maxWidth: '95vw',
      data: industry,
    });
  }

  onDelete(industry: Industry): void {
    const ref = this.dialog.open(IndustryDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: industry,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.service.delete(industry.id).subscribe(() => {
        this.snackBar.open('Industria eliminada', 'Cerrar', { duration: 3000 });
      });
    });
  }
}

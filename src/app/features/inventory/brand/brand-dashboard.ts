import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Brand } from '../../../core/models/brand.model';
import { BRAND_MOCK } from './brand.mock';
import { BrandTable } from './components/brand-table/brand-table';
import { BrandFormModal, BrandFormData } from './components/brand-form-modal/brand-form-modal';
import { BrandDetailModal } from './components/brand-detail-modal/brand-detail-modal';
import { BrandDeleteConfirmModal } from './components/brand-delete-confirm-modal/brand-delete-confirm-modal';

@Component({
  selector: 'app-brand-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    BrandTable,
  ],
  templateUrl: './brand-dashboard.html',
  styleUrl: './brand-dashboard.scss',
})
export class BrandDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private brands = signal<Brand[]>(BRAND_MOCK);
  searchTerm = signal('');

  filteredBrands = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.brands();
    return this.brands().filter(b =>
      (b.name ?? '').toLowerCase().includes(term) ||
      (b.description ?? '').toLowerCase().includes(term) ||
      (b.score ?? '').toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(BrandFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: {} satisfies BrandFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newBrand: Brand = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.brands.update(list => [newBrand, ...list]);
      this.snackBar.open('Marca registrada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(brand: Brand): void {
    const ref = this.dialog.open(BrandFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: { brand } satisfies BrandFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.brands.update(list =>
        list.map(b => b.id === brand.id
          ? { ...b, ...result, updatedAt: new Date() }
          : b
        )
      );
      this.snackBar.open('Marca actualizada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(brand: Brand): void {
    this.dialog.open(BrandDetailModal, {
      width: '38rem',
      maxWidth: '95vw',
      data: brand,
    });
  }

  onDelete(brand: Brand): void {
    const ref = this.dialog.open(BrandDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: brand,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.brands.update(list => list.filter(b => b.id !== brand.id));
      this.snackBar.open('Marca eliminada', 'Cerrar', { duration: 3000 });
    });
  }
}

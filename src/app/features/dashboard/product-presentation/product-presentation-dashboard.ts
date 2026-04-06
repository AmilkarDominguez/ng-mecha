import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductPresentation } from '../../../core/models/product-presentation.model';
import { PRODUCT_PRESENTATION_MOCK } from './product-presentation.mock';
import { ProductPresentationTable } from './components/product-presentation-table/product-presentation-table';
import {
  ProductPresentationFormModal,
  ProductPresentationFormData,
} from './components/product-presentation-form-modal/product-presentation-form-modal';
import { ProductPresentationDetailModal } from './components/product-presentation-detail-modal/product-presentation-detail-modal';
import { ProductPresentationDeleteConfirmModal } from './components/product-presentation-delete-confirm-modal/product-presentation-delete-confirm-modal';

@Component({
  selector: 'app-product-presentation-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ProductPresentationTable,
  ],
  templateUrl: './product-presentation-dashboard.html',
  styleUrl: './product-presentation-dashboard.scss',
})
export class ProductPresentationDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private presentations = signal<ProductPresentation[]>(PRODUCT_PRESENTATION_MOCK);
  searchTerm = signal('');

  filteredPresentations = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.presentations();
    return this.presentations().filter(p =>
      (p.name ?? '').toLowerCase().includes(term) ||
      (p.code ?? '').toLowerCase().includes(term) ||
      (p.description ?? '').toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(ProductPresentationFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: {} satisfies ProductPresentationFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newPresentation: ProductPresentation = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.presentations.update(list => [newPresentation, ...list]);
      this.snackBar.open('Presentación registrada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(presentation: ProductPresentation): void {
    const ref = this.dialog.open(ProductPresentationFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: { presentation } satisfies ProductPresentationFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.presentations.update(list =>
        list.map(p => p.id === presentation.id
          ? { ...p, ...result, updatedAt: new Date() }
          : p
        )
      );
      this.snackBar.open('Presentación actualizada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(presentation: ProductPresentation): void {
    this.dialog.open(ProductPresentationDetailModal, {
      width: '38rem',
      maxWidth: '95vw',
      data: presentation,
    });
  }

  onDelete(presentation: ProductPresentation): void {
    const ref = this.dialog.open(ProductPresentationDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: presentation,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.presentations.update(list => list.filter(p => p.id !== presentation.id));
      this.snackBar.open('Presentación eliminada', 'Cerrar', { duration: 3000 });
    });
  }
}

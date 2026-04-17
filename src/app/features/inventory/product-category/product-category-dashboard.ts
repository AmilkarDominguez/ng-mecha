import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductCategory } from '../../../core/models/product-category.model';
import { SPProductCategory } from '../../../core/services/supabase/sb-product-cateogory';
import { ProductCategoryTable } from './components/product-category-table/product-category-table';
import {
  ProductCategoryFormModal,
  ProductCategoryFormData,
} from './components/product-category-form-modal/product-category-form-modal';
import { ProductCategoryDetailModal } from './components/product-category-detail-modal/product-category-detail-modal';
import { ProductCategoryDeleteConfirmModal } from './components/product-category-delete-confirm-modal/product-category-delete-confirm-modal';

@Component({
  selector: 'app-product-category-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ProductCategoryTable,
  ],
  templateUrl: './product-category-dashboard.html',
  styleUrl: './product-category-dashboard.scss',
})
export class ProductCategoryDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private service = inject(SPProductCategory);

  readonly categories = toSignal(this.service.listen(), { initialValue: [] });
  readonly searchTerm = signal('');

  readonly filteredCategories = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.categories();
    return this.categories().filter(
      (c) =>
        (c.name ?? '').toLowerCase().includes(term) ||
        (c.title ?? '').toLowerCase().includes(term) ||
        (c.description ?? '').toLowerCase().includes(term),
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(ProductCategoryFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: {} satisfies ProductCategoryFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const newCategory: ProductCategory = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
      };

      this.service.add(newCategory).subscribe(() => {
        this.snackBar.open('Categoría registrada correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onEdit(category: ProductCategory): void {
    const ref = this.dialog.open(ProductCategoryFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: { category } satisfies ProductCategoryFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;

      this.service.update({ ...result, id: category.id }).subscribe(() => {
        this.snackBar.open('Categoría actualizada correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onView(category: ProductCategory): void {
    this.dialog.open(ProductCategoryDetailModal, {
      width: '38rem',
      maxWidth: '95vw',
      data: category,
    });
  }

  onDelete(category: ProductCategory): void {
    const ref = this.dialog.open(ProductCategoryDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: category,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.service.delete(category.id).subscribe(() => {
        this.snackBar.open('Categoría eliminada', 'Cerrar', { duration: 3000 });
      });
    });
  }
}

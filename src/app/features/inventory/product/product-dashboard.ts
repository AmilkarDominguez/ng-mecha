import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '../../../core/models/product.model';
import { ProductCategory } from '../../../core/models/product-category.model';
import { ProductPresentation } from '../../../core/models/product-presentation.model';
import { PRODUCT_MOCK } from './product.mock';
import { PRODUCT_CATEGORY_MOCK } from '../product-category/product-category.mock';
import { PRODUCT_PRESENTATION_MOCK } from '../product-presentation/product-presentation.mock';
import { ProductTable } from './components/product-table/product-table';
import { ProductFormModal, ProductFormData } from './components/product-form-modal/product-form-modal';
import { ProductDetailModal, ProductDetailData } from './components/product-detail-modal/product-detail-modal';
import { ProductDeleteConfirmModal } from './components/product-delete-confirm-modal/product-delete-confirm-modal';

@Component({
  selector: 'app-product-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ProductTable,
  ],
  templateUrl: './product-dashboard.html',
  styleUrl: './product-dashboard.scss',
})
export class ProductDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private products = signal<Product[]>(PRODUCT_MOCK);
  searchTerm = signal('');

  readonly categories: ProductCategory[] = PRODUCT_CATEGORY_MOCK;
  readonly presentations: ProductPresentation[] = PRODUCT_PRESENTATION_MOCK;

  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.products();
    return this.products().filter(p =>
      (p.name ?? '').toLowerCase().includes(term) ||
      (p.description ?? '').toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(ProductFormModal, {
      width: '44rem',
      maxWidth: '95vw',
      data: { categories: this.categories, presentations: this.presentations } satisfies ProductFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newProduct: Product = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.products.update(list => [newProduct, ...list]);
      this.snackBar.open('Producto registrado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(product: Product): void {
    const ref = this.dialog.open(ProductFormModal, {
      width: '44rem',
      maxWidth: '95vw',
      data: { product, categories: this.categories, presentations: this.presentations } satisfies ProductFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.products.update(list =>
        list.map(p => p.id === product.id
          ? { ...p, ...result, updatedAt: new Date() }
          : p
        )
      );
      this.snackBar.open('Producto actualizado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(product: Product): void {
    this.dialog.open(ProductDetailModal, {
      width: '40rem',
      maxWidth: '95vw',
      data: { product, categories: this.categories, presentations: this.presentations } satisfies ProductDetailData,
    });
  }

  onDelete(product: Product): void {
    const ref = this.dialog.open(ProductDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: product,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.products.update(list => list.filter(p => p.id !== product.id));
      this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 3000 });
    });
  }
}

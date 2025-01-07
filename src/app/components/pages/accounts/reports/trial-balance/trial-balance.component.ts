import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-trial-balance',
  imports: [FormsModule, CommonModule],
  templateUrl: './trial-balance.component.html',
  styleUrl: './trial-balance.component.css'
})
export class TrialBalanceComponent {
  categories = [
    { id: 'automobiles', label: 'Automobiles' },
    { id: 'film', label: 'Film & Animation' },
    { id: 'science', label: 'Science & Technology' },
    { id: 'art', label: 'Art' },
    { id: 'music', label: 'Music' },
    { id: 'travel', label: 'Travel & Events' },
    { id: 'sports', label: 'Sports' },
    { id: 'news', label: 'News & Politics' },
    { id: 'tutorials', label: 'Tutorials' },
  ];

  filteredCategories = [...this.categories];
  selectedCategory: { id: string; label: string } | null = null;
  isOptionsVisible = false;
  searchTerm = '';

  toggleOptions(): void {
    this.isOptionsVisible = !this.isOptionsVisible;
    if (!this.isOptionsVisible) {
      this.searchTerm = '';
      this.filterCategories();
    }
  }

  selectCategory(category: { id: string; label: string }): void {
    this.selectedCategory = category;
    this.isOptionsVisible = false;
  }

  filterCategories(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredCategories = this.categories.filter((category) =>
      category.label.toLowerCase().includes(term)
    );
  }

}

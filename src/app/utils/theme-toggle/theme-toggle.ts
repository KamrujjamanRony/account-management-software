import { Component } from '@angular/core';

@Component({
  selector: 'app-theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.css',
})
export class ThemeToggle {
  ngOnInit() {
    // Initial icon setup
    setTimeout(() => this.setupThemeIcons(), 0);
  }

  ngAfterViewInit() {
    // Add click event listener after view is initialized
    setTimeout(() => this.initializeThemeToggle(), 0);
  }

  setupThemeIcons() {
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
    
    if (themeToggleDarkIcon && themeToggleLightIcon) {
      // Hide both initially
      themeToggleDarkIcon.classList.add('hidden');
      themeToggleLightIcon.classList.add('hidden');
      
      // Show appropriate icon based on theme
      if (localStorage.getItem('color-theme') === 'dark' || 
          (!('color-theme' in localStorage) && 
           window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        themeToggleLightIcon.classList.remove('hidden');
      } else {
        themeToggleDarkIcon.classList.remove('hidden');
      }
    }
  }

  initializeThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
    
    if (!themeToggleBtn || !themeToggleDarkIcon || !themeToggleLightIcon) {
      return;
    }

    themeToggleBtn.addEventListener('click', () => {
      // Toggle icons
      themeToggleDarkIcon.classList.toggle('hidden');
      themeToggleLightIcon.classList.toggle('hidden');

      // Handle theme switching
      if (localStorage.getItem('color-theme')) {
        if (localStorage.getItem('color-theme') === 'light') {
          document.documentElement.classList.add('dark');
          localStorage.setItem('color-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('color-theme', 'light');
        }
      } else {
        if (document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('color-theme', 'light');
        } else {
          document.documentElement.classList.add('dark');
          localStorage.setItem('color-theme', 'dark');
        }
      }
    });
  }

}

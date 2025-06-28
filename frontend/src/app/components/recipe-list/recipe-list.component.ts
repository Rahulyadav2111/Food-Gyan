import { Component, OnInit } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { AuthService } from '../../services/auth.service';
import { Recipe } from '../../models/recipe.model';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html'
})
export class RecipeListComponent implements OnInit {
  recipes: Recipe[] = [];
  allergenFilter: string = '';
  errorMessage: string | null = null;
  loading = false;
  userEmail: string | null = null;

  constructor(private recipeService: RecipeService, private authService: AuthService) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      this.userEmail = decoded.email;
      console.log('User email:', this.userEmail);
    }
    this.loadRecipes();
  }

  loadRecipes() {
    this.loading = true;
    this.errorMessage = null;
    this.recipeService.getRecipes(this.allergenFilter).subscribe({
      next: (recipes) => {
        console.log('Raw recipes from API:', recipes);
        this.recipes = recipes
          .map(recipe => {
            console.log('Processing recipe:', recipe);
            return {
              ...recipe,
              id: recipe.id
            };
          })
          .filter(recipe => recipe.id && typeof recipe.id === 'string' && recipe.id.trim() !== '');
        console.log('Mapped recipes:', this.recipes);
        this.loading = false;
        if (this.recipes.length === 0) {
          this.errorMessage = 'No valid recipes found';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = `Error loading recipes: ${err.message}`;
        console.error('Error loading recipes:', err);
      }
    });
  }

  filterRecipes() {
    this.loadRecipes();
  }

  deleteRecipe(id: string | undefined) {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.warn('Invalid or undefined recipe ID:', id);
      this.errorMessage = 'Cannot delete recipe: Invalid ID';
      return;
    }
    if (confirm('Are you sure you want to delete this recipe?')) {
      console.log('Attempting to delete recipe with ID:', id);
      this.recipeService.deleteRecipe(id).subscribe({
        next: () => {
          console.log('Recipe deleted successfully:', id);
          this.recipes = this.recipes.filter(recipe => recipe.id !== id);
        },
        error: (err) => {
          this.errorMessage = `Error deleting recipe: ${err.message}`;
          console.error('Delete error:', err);
        }
      });
    }
  }
}
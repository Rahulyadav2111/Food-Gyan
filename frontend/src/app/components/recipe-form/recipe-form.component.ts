import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RecipeService } from '../../services/recipe.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Recipe } from '../../models/recipe.model';

@Component({
  selector: 'app-recipe-form',
  templateUrl: './recipe-form.component.html'
})
export class RecipeFormComponent implements OnInit {
  recipeForm: FormGroup;
  isEditMode = false;
  recipeId: string | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  loading = false;
  allergensList = ['peanuts', 'dairy', 'gluten', 'soy', 'nuts'];

  constructor(
    private fb: FormBuilder,
    private recipeService: RecipeService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.recipeForm = this.fb.group({
      title: ['', Validators.required],
      ingredients: ['', Validators.required],
      instructions: ['', Validators.required],
      calories: [0, [Validators.required, Validators.min(0)]],
      protein: [0, [Validators.required, Validators.min(0)]],
      carbs: [0, [Validators.required, Validators.min(0)]],
      fat: [0, [Validators.required, Validators.min(0)]],
      allergens: [[]]
    });
  }

  ngOnInit() {
    this.recipeId = decodeURIComponent(this.route.snapshot.paramMap.get('id') || '');
    console.log('Recipe ID from route:', this.recipeId);
    if (this.recipeId) {
      this.isEditMode = true;
      this.loadRecipe();
    }
  }

  loadRecipe() {
    if (this.recipeId) {
      this.recipeService.getRecipes().subscribe({
        next: (recipes) => {
          const recipe = recipes.find((r: Recipe) => r.id === this.recipeId);
          console.log('Found recipe:', recipe);
          if (recipe) {
            this.recipeForm.patchValue({
              title: recipe.title,
              ingredients: recipe.ingredients.join(', '),
              instructions: recipe.instructions,
              calories: recipe.nutritionalInfo.calories,
              protein: recipe.nutritionalInfo.protein,
              carbs: recipe.nutritionalInfo.carbs,
              fat: recipe.nutritionalInfo.fat,
              allergens: recipe.allergens
            });
          } else {
            this.errorMessage = 'Recipe not found';
          }
        },
        error: (err) => {
          this.errorMessage = err.message;
          console.error('Error loading recipe:', err);
        }
      });
    }
  }

  toggleAllergen(event: Event) {
    const input = event.target as HTMLInputElement;
    const allergens = this.recipeForm.get('allergens')?.value as string[];
    if (input.checked) {
      allergens.push(input.value);
    } else {
      const index = allergens.indexOf(input.value);
      if (index > -1) {
        allergens.splice(index, 1);
      }
    }
    this.recipeForm.get('allergens')?.setValue(allergens);
  }

  onSubmit() {
    if (this.recipeForm.valid) {
      this.loading = true;
      this.errorMessage = null;
      this.successMessage = null;
      const formValue = this.recipeForm.value;
      const recipe: Recipe = {
        title: formValue.title,
        ingredients: formValue.ingredients.split(',').map((i: string) => i.trim()),
        instructions: formValue.instructions,
        nutritionalInfo: {
          calories: formValue.calories,
          protein: formValue.protein,
          carbs: formValue.carbs,
          fat: formValue.fat
        },
        allergens: formValue.allergens,
        createdBy: ''
      };

      const request = this.isEditMode && this.recipeId
        ? this.recipeService.updateRecipe(this.recipeId, recipe)
        : this.recipeService.createRecipe(recipe);

      request.subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = this.isEditMode ? 'Recipe updated successfully!' : 'Recipe added successfully!';
          this.recipeForm.reset();
          setTimeout(() => this.router.navigate(['/recipes']), 2000);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.message;
        }
      });
    }
  }
}
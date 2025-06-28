const express = require('express');
const neo4j = require('neo4j-driver');
const { v4: uuidv4 } = require('uuid'); 
const driver = require('../config/neo4j');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Create Recipe
router.post('/', authMiddleware, async (req, res) => {
  const { title, ingredients, instructions, nutritionalInfo, allergens } = req.body;
  if (!title || !ingredients || !instructions || !nutritionalInfo) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const session = driver.session();
  try {
    const id = uuidv4(); 
    const result = await session.run(
      'CREATE (r:Recipe {id: $id, title: $title, ingredients: $ingredients, instructions: $instructions, nutritionalInfo: $nutritionalInfo, allergens: $allergens, createdBy: $email}) RETURN r',
      {
        id, 
        title,
        ingredients: JSON.stringify(ingredients),
        instructions,
        nutritionalInfo: JSON.stringify(nutritionalInfo),
        allergens: JSON.stringify(allergens),
        email: req.user.email,
      }
    );
    const recipe = result.records[0].get('r').properties;
    recipe.ingredients = JSON.parse(recipe.ingredients);
    recipe.nutritionalInfo = JSON.parse(recipe.nutritionalInfo);
    recipe.allergens = JSON.parse(recipe.allergens);
    res.status(201).json(recipe);
  } catch (error) {
    console.error('Error creating recipe:', error); // Debug log
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    await session.close();
  }
});

// Read All Recipes
router.get('/', async (req, res) => {
  const { allergenFilter } = req.query;
  const session = driver.session();
  try {
    let query = 'MATCH (r:Recipe) RETURN r';
    let params = {};
    if (allergenFilter) {
      query = 'MATCH (r:Recipe) WHERE NOT $allergen IN r.allergens RETURN r';
      params = { allergen: JSON.stringify([allergenFilter]) }; // Ensure allergens is an array
    }
    const result = await session.run(query, params);
    const recipes = result.records.map(record => {
      const props = record.get('r').properties;
      props.ingredients = JSON.parse(props.ingredients);
      props.nutritionalInfo = JSON.parse(props.nutritionalInfo);
      props.allergens = JSON.parse(props.allergens);
      props.id = props.id || record.get('r').identity.toString();
      return props;
    });
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error); // Debug log
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    await session.close();
  }
});

// Update Recipe
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, ingredients, instructions, nutritionalInfo, allergens } = req.body;
  const session = driver.session();
  try {
    const result = await session.run(
      'MATCH (r:Recipe {id: $id, createdBy: $email}) SET r.title = $title, r.ingredients = $ingredients, r.instructions = $instructions, r.nutritionalInfo = $nutritionalInfo, r.allergens = $allergens RETURN r',
      {
        id,
        title,
        ingredients: JSON.stringify(ingredients),
        instructions,
        nutritionalInfo: JSON.stringify(nutritionalInfo),
        allergens: JSON.stringify(allergens),
        email: req.user.email,
      }
    );
    if (result.records.length === 0) {
      return res.status(404).json({ message: 'Recipe not found or unauthorized' });
    }
    const recipe = result.records[0].get('r').properties;
    recipe.ingredients = JSON.parse(recipe.ingredients);
    recipe.nutritionalInfo = JSON.parse(recipe.nutritionalInfo);
    recipe.allergens = JSON.parse(recipe.allergens);
    res.json(recipe);
  } catch (error) {
    console.error('Error updating recipe:', error); // Debug log
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    await session.close();
  }
});

// Delete Recipe
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const session = driver.session();
  try {
    const result = await session.run(
      'MATCH (r:Recipe {id: $id, createdBy: $email}) DELETE r RETURN count(r) as count',
      { id, email: req.user.email }
    );
    if (result.records[0].get('count').low === 0) {
      return res.status(404).json({ message: 'Recipe not found or unauthorized' });
    }
    res.json({ message: 'Recipe deleted' });
  } catch (error) {
    console.error('Error deleting recipe:', error); // Debug log
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
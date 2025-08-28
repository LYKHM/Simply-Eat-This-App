const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Database connection

//Add credentials to .env file
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'your_database'
  });


  app.post('/api/users', async (req, res) => {
    //console.log("=== POST /api/users endpoint hit ===");
    
  
    try {
      const { clerk_id, email, provider } = req.body;
      //console.log("Extracted data:", { clerk_id, email, provider });
  
      if (!clerk_id || !email) {
        console.error("Missing required fields");
        return res.status(400).json({ error: 'Missing clerk_id or email' });
      }
  
    
      const connection = await pool.getConnection();
      
    
     
      const [existing] = await connection.execute(
        'SELECT clerk_id, email FROM clerk_user WHERE email = ? OR clerk_id = ?',  // Check both email AND clerk_id
        [email, clerk_id]
      );
      
      
      if (existing.length > 0) {
        
        connection.release();
        return res.status(200).json({ 
          success: true, 
          clerk_id: existing[0].clerk_id,
          email: existing[0].email,
          message: 'User already exists' 
        });
      }
  
      
      const [result] = await connection.execute(
        'INSERT INTO clerk_user (clerk_id, email, provider, created_at) VALUES (?, ?, ?, NOW())',
        [clerk_id, email, provider]
      );
      
      connection.release();
     
      res.status(201).json({ success: true, user_id: result.insertId });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Get user endpoint
app.get('/api/users/:clerk_id', async (req, res) => {
    try {
      const { clerk_id } = req.params;
      
      const connection = await pool.getConnection();
      const [rows] = await connection.execute(
        'SELECT * FROM clerk_user WHERE clerk_id = ?',
        [clerk_id]
      );
      connection.release();
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  
// Main
app.post("/api/data", async (req, res) => {
  
  let { ChosenDiet, ChosenCalories, ChosenTime, ChosenMeals, clerk_id } = req.body; // Add cost and allergies here too

 

if (ChosenDiet === "Anything") {
  ChosenDiet = ["vegan", "keto", "paleo"]; // Add more later...  
}


let dietCondition = "";
let dietValues = [];

if (Array.isArray(ChosenDiet)) {
  const placeholders = ChosenDiet.map(() => "?").join(",");
  dietCondition = `diet IN (${placeholders})`;
  dietValues = ChosenDiet.map(d => d.toLowerCase());
} else {
  dietCondition = `diet = ?`;
  dietValues = [ChosenDiet.toLowerCase()];
}


const MEAL_COUNT = ChosenMeals;
const MEALS_PER_EVENT = 2; // Always 2 meals per event
const TOTAL_MEALS = MEAL_COUNT * MEALS_PER_EVENT;
const MEAL_LABELS_BY_COUNT = {
1: ["Dinner"],
2: ["Breakfast", "Lunch"],
3: ["Breakfast", "Lunch", "Dinner"],
//4: ["Breakfast", "Lunch", "Snack", "Dinner"], These come later
//5: ["Breakfast", "Snack", "Lunch", "Snack", "Dinner"],
//6: ["Breakfast", "Snack", "Lunch", "Snack", "Dinner", "Snack"]
};

const dynamicMealTimes = MEAL_LABELS_BY_COUNT[MEAL_COUNT];
const TOTAL_CALORIES = ChosenCalories;
const TARGET_PER_MEAL = TOTAL_CALORIES / MEAL_COUNT;

const CALORIE_MARGIN = 150; // Lower this once I have a larger database. I think I need a few hundred recipes to make it work.


let con;


try {
      con = await mysql.createConnection({ // WHY wont await work? 
      host: process.env.DB_HOST, 
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 3306,
  });


  //Find ALL candidate meals
  const [meals] = await con.execute( // WHY wont await work?
    `SELECT id, name, calories, protein, fat, carbs, prep_time, cook_time, makes_x_servings, image, diet, Health_Score, cost, allergies
     FROM rec
     WHERE ${dietCondition} AND prep_time <= ? AND cook_time <= ?`,
     [...dietValues, ChosenTime, ChosenTime]
  );


  if (meals.length < 3) {
    console.log("❌ Not enough candidate meals.");
    return;
  }

  // Coerce to numbers once
  const candidates = meals.map(m => ({
    ...m,
    calories: Number(m.calories),
    protein:  Number(m.protein),
    fat:      Number(m.fat),
    carbs:    Number(m.carbs),
    prep_time: Number(m.prep_time),
    cook_time: Number(m.cook_time),
    // makes_x_servings is irrelevant for scaling if your data is per-serving,
    // but you can keep it as metadata:
    makes_x_servings: Number(m.makes_x_servings) || 1,
  }));

  // Cap per-dish calories so two dishes can fit in one event
  const perDishCap = TARGET_PER_MEAL / MEALS_PER_EVENT;
  const capped = candidates.filter(m => m.calories > 0 && m.calories <= perDishCap);

 
  // If there are enough capped dishes, use them; otherwise fall back to all
  const mealPool = capped.length >= TOTAL_MEALS ? capped : candidates;

  if (capped.length < TOTAL_MEALS) console.log("Using uncapped mealPool; capped insufficient:", capped.length);



  // Fisher-Yates algorithm
  function shuffle(array){
      for(let i = array.length - 1; i > 0; i--){
          const random = Math.floor(Math.random() * (i + 1));

          [array[i], array[random]] = [array[random], array[i]];
      }
    }
      
    //shuffle(candidates);
    //const picked = candidates.slice(0, TOTAL_MEALS);
    

    function scaleMealToTarget(meal, targetCalories) { 

      const per = {
      calories: meal.calories || 0,
      protein:  meal.protein  || 0,
      fat:      meal.fat      || 0,
      carbs:    meal.carbs    || 0,
    };


    if (!isFinite(per.calories) || per.calories <= 0) {
      // if bad data, fall back to 1 serving totals of 0s
      return { ...meal, servings: 1, scaledCalories: 0, scaledProtein: 0, scaledFat: 0, scaledCarbs: 0 };
    }


      //Take a look at these. 
      // integer servings (≥1) closest to target
      const servings = Math.max(1, Math.round(targetCalories / per.calories));

     // const floorS = Math.max(1, Math.floor(targetCalories / per.calories));
     // const ceilS  = Math.max(1, Math.ceil (targetCalories / per.calories));
     // const err = s => Math.abs(s * per.calories - targetCalories);
     // const servings = err(floorS) <= err(ceilS) ? floorS : ceilS;

      //const s = Math.max(0.25, targetCalories / per.calories);

      return {
        ...meal,
        servings,
        scaledCalories: servings * per.calories,
        scaledProtein:  servings * per.protein,
        scaledFat:      servings * per.fat,
        scaledCarbs:    servings * per.carbs,
        
      };
    }

    
    const MAX_TRIES = 7;
    let mealGroups = null;


    for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
      shuffle(mealPool);
      const picked = mealPool.slice(0, TOTAL_MEALS);
      if (picked.length < TOTAL_MEALS) break;

    
  // System: Two different meals on each meal event.
  
    const groups = [];
    for (let i = 0; i < MEAL_COUNT; i++){
      const meal1 = picked[i * 2];
      const meal2 = picked[i * 2 + 1];
      if (!meal1 || !meal2){
        continue;
      }
      
      const scaled1 = scaleMealToTarget(meal1, TARGET_PER_MEAL / 2); 
      const scaled2 = scaleMealToTarget(meal2, TARGET_PER_MEAL / 2);
    
      groups.push({
        label: dynamicMealTimes[i], 
        meals: [scaled1 , scaled2],
      });
  }

            
    const allGood = groups.length === MEAL_COUNT && groups.every(group => {
    const totalCals = group.meals.reduce((sum, m) => sum + m.scaledCalories, 0);
    return Math.abs(totalCals - TARGET_PER_MEAL) <= CALORIE_MARGIN;
  });

  
    if (allGood) {
      mealGroups = groups;
      break;
      }
    }

  // If mealGroups is stull null after the loop, that means every attempt failed, so you send an error
  if (!mealGroups) {
    return res.status(400).json({ error: "Meal groups don't meet calorie goals after retries." });  
  } 


    const allMeals = mealGroups.flatMap(group => group.meals);
    //console.log("allMeals:", allMeals);

    const grabRecipeId = mealGroups.flatMap(group => group.meals.map(meal => meal.id));

    const placeholders = grabRecipeId.map(() => '?').join(','); 

    const [rows] = await con.execute(
      `SELECT recipe_id, ingredient_id, quantity, unit FROM ri
      WHERE recipe_id IN (${placeholders})
      ORDER BY recipe_id, ingredient_id`,
      grabRecipeId
    );

   
    const grabIngredientId = rows.map(rows => rows.ingredient_id);
    const secondPlaceholders = grabIngredientId.map(() => '?').join(','); 

    const [rows2] = await con.execute(
      `SELECT id, name FROM ing
      WHERE id IN (${secondPlaceholders})`,
      grabIngredientId
    );

    
    const ingredientNameMap = {};

    rows2.forEach(ing => {
      ingredientNameMap[ing.id] = ing.name;
    });

    
    const ingredientsByRecipe = {};

    rows.forEach(row => {
    const recipeId = row.recipe_id; // Now I grab the recipe_id from the row

  // Find the scaled meal for this recipe
    const meal = allMeals.find(m => m.id === recipeId)

    if (!meal) return;

    const servings = meal.servings || 1;
  
    // Calculate the scaled quantity
    const scaledQty = Number(row.quantity) * servings;

    if (!ingredientsByRecipe[recipeId]) { // Look into this section
      ingredientsByRecipe[recipeId] = [];
    }

    ingredientsByRecipe[recipeId].push({
      ingredientId: row.ingredient_id,
      name: ingredientNameMap[row.ingredient_id] || "Unknown",
      quantity: scaledQty,
      unit: row.unit
    });
  });



  const dailymealPlan = {
    date: new Date().toISOString(),
    diet: ChosenDiet,
    TARGET_PER_MEAL: TARGET_PER_MEAL,
    mealTime: dynamicMealTimes,
    totalDailyCalories: allMeals.reduce((sum, m) => sum + Math.round(m.scaledCalories), 0),
    totalDailyCarbs:    allMeals.reduce((sum, m) => sum + Math.round(m.scaledCarbs),    0),
    totalDailyProtein:  allMeals.reduce((sum, m) => sum + Math.round(m.scaledProtein),  0),
    totalDailyFat:      allMeals.reduce((sum, m) => sum + Math.round(m.scaledFat),      0),
    meals: mealGroups.map(group => ({
      diet: ChosenDiet,
      label: group.label,
      labelCalories: Math.round(group.meals.reduce((sum, m) => sum + m.scaledCalories, 0)),
      meals: group.meals.map(m => ({
        recipeId: m.id,
        image: m.image,
        name: m.name,
        Health_Score: m.Health_Score,
       // cost: m.cost,       add these later. I think I lost connection. I told you so
       // allergies: m.allergies, add this later.
        servings: m.servings, 
        prep_time: m.prep_time,
        cook_time: m.cook_time,
        diet: m.diet,
        calories: Math.round(m.calories),
        protein:  Math.round(m.protein),
        carbs:    Math.round(m.carbs),
        fat:      Math.round(m.fat),
        scaledCalories: Math.round(m.scaledCalories),
        scaledProtein:  Math.round(m.scaledProtein),
        scaledCarbs:    Math.round(m.scaledCarbs),
        scaledFat:      Math.round(m.scaledFat),

        ingredients: ingredientsByRecipe[m.id] || []
      }))
    }))
  };
  //console.log("Daily Meal Plan:", JSON.stringify(dailymealPlan, null, 2));

 

  if(clerk_id){
    
    try{
      const planDate = new Date().toISOString().split('T')[0];
      

      //Do I need this?
      //await con.execute(
       // 'DELETE FROM your_table_name WHERE user_id = ? AND log_dates = ?',
        //[clerk_id, planDate]
      //);

       // Insert each meal into the database
       for (const group of dailymealPlan.meals) {
        for (let mealIndex = 0; mealIndex < group.meals.length; mealIndex++) {
          const meal = group.meals[mealIndex];
          
          await con.execute(
            `INSERT INTO users_food_log 
             (user_id, recipe_id, meal_label, meal_position, servings, log_date, 
              scaled_calories, scaled_protein, scaled_carbs, scaled_fat)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              clerk_id,
              meal.recipeId,
              group.label.toLowerCase(), // meal_label
              mealIndex, // meal_position
              meal.servings,
              planDate, // log_dates
              meal.scaledCalories,
              meal.scaledProtein,
              meal.scaledCarbs,
              meal.scaledFat
            ]
          );
        }
      }

    
    }catch(dbError){
      console.error('Error saving meal plan to database:', dbError);
    }

  }
   
  return res.json(dailymealPlan);
} catch (error) {
  console.error("Error:", error);
  return res.status(500).json({ error: "Internal server error" });
}
finally {
  await con.end();
}
});


// Get daily recipes for a user - CORRECTED VERSION
app.get('/api/daily-recipes/:clerk_id', async (req, res) => {
  
  
  try {
    const { clerk_id } = req.params;
    
    if (!clerk_id) {
      return res.status(400).json({ error: 'clerk_id is required' });
    }

    

    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT 
        -- Log info
        ufl.id AS log_id,
        ufl.log_date,
        ufl.meal_label,
        ufl.servings,
        ufl.scaled_calories,
        ufl.scaled_protein,
        ufl.scaled_carbs,
        ufl.scaled_fat,

        -- User
        ufl.user_id,

        -- Recipe info
        r.id AS recipe_id,
        r.name AS recipe_name,
        r.calories,
        r.protein,
        r.fat,
        r.carbs,
        r.prep_time,
        r.cook_time,
        r.makes_x_servings,
        r.image,
        r.diet,
        r.Health_Score,
        r.cost,
        r.allergies,

        -- Ingredients (scaled per servings)
        i.id AS ingredient_id,
        i.name AS ingredient_name,
        ri.quantity * ufl.servings AS scaled_quantity,
        ri.unit
      FROM users_food_log ufl
      INNER JOIN rec r ON ufl.recipe_id = r.id
      LEFT JOIN ri ON r.id = ri.recipe_id
      LEFT JOIN ing i ON ri.ingredient_id = i.id
      WHERE ufl.user_id = ?
        AND ufl.log_date = CURDATE()
      ORDER BY ufl.meal_label, r.name, i.name
    `, [clerk_id]);

    connection.release();

    if (rows.length === 0) {
      return res.json({
        date: new Date().toISOString(),
        diet: "none",
        TARGET_PER_MEAL: 0,
        mealTime: [],
        totalDailyCalories: 0,
        totalDailyCarbs: 0,
        totalDailyProtein: 0,
        totalDailyFat: 0,
        meals: []
      });
    }

    // Transform the flat data into structured meal plan
    const mealGroups = {};
    const ingredientsByRecipe = {};

    rows.forEach(row => {
      const mealLabel = row.meal_label;
      const recipeId = row.recipe_id;

      // Initialize meal group if it doesn't exist
      if (!mealGroups[mealLabel]) {
        mealGroups[mealLabel] = {
          label: mealLabel.charAt(0).toUpperCase() + mealLabel.slice(1),
          meals: {}
        };
      }

      // Initialize recipe if it doesn't exist in this meal
      if (!mealGroups[mealLabel].meals[recipeId]) {
        mealGroups[mealLabel].meals[recipeId] = {
          id: recipeId,
          image: row.image,
          name: row.recipe_name,
          Health_Score: row.Health_Score,
          servings: row.servings,
          prep_time: row.prep_time,
          cook_time: row.cook_time,
          diet: row.diet,
          calories: row.calories,
          protein: row.protein,
          carbs: row.carbs,
          fat: row.fat,
          scaledCalories: row.scaled_calories,
          scaledProtein: row.scaled_protein,
          scaledCarbs: row.scaled_carbs,
          scaledFat: row.scaled_fat
        };
      }

      // Collect ingredients
      if (row.ingredient_id) {
        if (!ingredientsByRecipe[recipeId]) {
          ingredientsByRecipe[recipeId] = [];
        }
        ingredientsByRecipe[recipeId].push({
          ingredientId: row.ingredient_id,
          name: row.ingredient_name,
          quantity: row.scaled_quantity,
          unit: row.unit
        });
      }
    });

    // Convert to array format matching your existing structure
    const mealGroupsArray = Object.values(mealGroups).map(group => ({
      diet: Object.values(group.meals)[0]?.diet || "unknown",
      label: group.label,
      labelCalories: Math.round(Object.values(group.meals).reduce((sum, m) => sum + m.scaledCalories, 0)),
      meals: Object.values(group.meals).map(m => ({
        recipeId: m.id,
        image: m.image,
        name: m.name,
        Health_Score: m.Health_Score,
        servings: m.servings,
        prep_time: m.prep_time,
        cook_time: m.cook_time,
        diet: m.diet,
        calories: Math.round(m.calories),
        protein: Math.round(m.protein),
        carbs: Math.round(m.carbs),
        fat: Math.round(m.fat),
        scaledCalories: Math.round(m.scaledCalories),
        scaledProtein: Math.round(m.scaledProtein),
        scaledCarbs: Math.round(m.scaledCarbs),
        scaledFat: Math.round(m.scaledFat),
        ingredients: ingredientsByRecipe[m.id] || []
      }))
    }));

    // Calculate totals from all meals
    const allMeals = mealGroupsArray.flatMap(group => group.meals);
    const totalDailyCalories = allMeals.reduce((sum, m) => sum + m.scaledCalories, 0);
    const totalDailyProtein = allMeals.reduce((sum, m) => sum + m.scaledProtein, 0);
    const totalDailyCarbs = allMeals.reduce((sum, m) => sum + m.scaledCarbs, 0);
    const totalDailyFat = allMeals.reduce((sum, m) => sum + m.scaledFat, 0);

    // Return object with EXACT same structure as your existing route
    const dailymealPlan = {
      date: new Date().toISOString(),
      diet: allMeals[0]?.diet || "mixed",
      TARGET_PER_MEAL: mealGroupsArray.length > 0 ? Math.round(totalDailyCalories / mealGroupsArray.length) : 0,
      mealTime: mealGroupsArray.map(g => g.label),
      totalDailyCalories: totalDailyCalories,
      totalDailyCarbs: totalDailyCarbs,
      totalDailyProtein: totalDailyProtein,
      totalDailyFat: totalDailyFat,
      meals: mealGroupsArray
    };

    

    res.json(dailymealPlan);

  } catch (error) {
    console.error('Error fetching daily recipes:', error);
    res.status(500).json({ error: 'Failed to fetch daily recipes' });
  }
});



app.post("/api/refresh", async (req, res) => {
  let { diet, time, targetCalories, clerk_id } = req.body; // Add more filters later

  
  const CalorieMargin = 250;

  if(!diet || time == null ||!targetCalories){
    return res.status(400).json({ error: "diet, time, and targetCalories are required."});
  }

  if(diet === "Anything") {
    diet = ["vegan", "keto", "paleo"];
  }

  const isArray = Array.isArray(diet);
  //console.log("isArray:", isArray)
  const dietPlaceholders = isArray ? diet.map(() => "?").join(",") : "?";
  //console.log("dietPlaceholders", dietPlaceholders)
  const dietValues = (isArray ? diet : [diet]).map(d => d.toLowerCase());
  //console.log("dietValues:", dietValues)

  let con;

  try{
    con = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 3306,
    });

    // 1) Pull candidates (include makes_x_servings so we can scale)
    const [rawCandidates] = await con.execute(
      `SELECT id, name, calories, protein, fat, carbs,
             prep_time, cook_time, makes_x_servings,
             image, diet, Health_Score, cost, allergies
      FROM rec
      WHERE diet ${isArray ? `IN (${dietPlaceholders})` : `= ${dietPlaceholders}`}
        AND prep_time < ?
        AND cook_time < ?`,
      [...dietValues, time, time]
    );

    if (!rawCandidates.length) {
      return res.status(404).json({ error: "No candidates found for refresh." });
    }


    // Coerce types once
    const candidates = rawCandidates.map(r => ({
      ...r,
      calories: Number(r.calories),
      protein: Number(r.protein),
      fat: Number(r.fat),
      carbs: Number(r.carbs),
    //  makes_x_servings: Number(r.makes_x_servings) || 1,
    }));

    // 2) Scale helper — DB values are PER-SERVING
    function scaleMealToTarget(meal, target) {
      const per = {
        calories: Number(meal.calories) || 0,
        protein: Number(meal.protein) || 0,
        fat: Number(meal.fat) || 0,
        carbs: Number(meal.carbs) || 0,
      };
      if (!isFinite(per.calories) || per.calories <= 0) return null;


      // choose integer servings closest to target (≥1)
      const floorS = Math.max(1, Math.floor(target / per.calories)); // Ex 440 / per.calories
      const ceilS  = Math.max(1, Math.ceil (target / per.calories));
      const err = s => Math.abs(s * per.calories - target);
      const servings = err(floorS) <= err(ceilS) ? floorS : ceilS;


      return {
        ...meal,
        servings,
        scaledCalories: servings * per.calories,
        scaledProtein: servings * per.protein,
        scaledFat: servings * per.fat,
        scaledCarbs: servings * per.carbs,
      };
    }

     // 3) Pick the best fit within margin
    
    const targetPerDish = Number(targetCalories) / 2;    // Test if I need to divide by 2. Go back to 1 if it's wrong.. 
   // console.log("targetPerdish:", targetPerDish);
    const scored = candidates
      .map(m => {
        const s = scaleMealToTarget(m, Number(targetPerDish));
        return s ? { meal: s, delta: Math.abs(s.scaledCalories - targetPerDish) } : null;
      })
      .filter(Boolean);

    
    if (!scored.length) return res.status(404).json({ error: "No valid candidates after scaling." });

    let pool = scored.filter(x => x.delta <= CalorieMargin);
    if (!pool.length) {
      scored.sort((a, b) => a.delta - b.delta);
      pool = scored.slice(0, 10);
    }

     // shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

     const chosen = pool[0].meal;

     // 4) Ingredients for the chosen recipe, scaled
    const [ri] = await con.execute(
      `SELECT recipe_id, ingredient_id, quantity, unit FROM ri WHERE recipe_id = ? ORDER BY ingredient_id`,
      [chosen.id]
    );

    const ingIds = ri.map(r => r.ingredient_id);
    let nameMap = {};
    if (ingIds.length) {
      const [ings] = await con.execute(
        `SELECT id, name FROM ing WHERE id IN (${ingIds.map(() => "?").join(",")})`,
        ingIds
      );
      ings.forEach(i => (nameMap[i.id] = i.name));
    }

    //const makes = Math.max(1, Number(chosen.makes_x_servings) || 1);

    // NOTE: if ri.quantity is TOTAL RECIPE quantity, keep "/ makes".
    // If ri.quantity is PER-SERVING, REMOVE "/ makes".
    const ingredients = ri.map(r => ({
      ingredientId: r.ingredient_id,
      name: nameMap[r.ingredient_id] || "Unknown",
      quantity: Number(r.quantity) * chosen.servings,
      unit: r.unit,
    }));

    // 5) Update database if groupIndex and mealIndex provided
    if (clerk_id && req.body.groupIndex !== undefined && req.body.mealIndex !== undefined) {
      try {
        const { groupIndex, mealIndex } = req.body;
        const planDate = new Date().toISOString().split('T')[0];
        
        // Map groupIndex to meal_label
        const mealLabels = ["breakfast", "lunch", "dinner"];
        const mealLabel = mealLabels[groupIndex];
        
        // Update the specific meal in database using meal_position
       //console.log(`🔄 Updating database: user=${clerk_id}, meal_label=${mealLabel}, meal_position=${mealIndex}, old_recipe=?, new_recipe=${chosen.id}`);

        const updateResult = await con.execute(
          `UPDATE users_food_log 
           SET recipe_id = ?, servings = ?, scaled_calories = ?, 
               scaled_protein = ?, scaled_carbs = ?, scaled_fat = ?
           WHERE user_id = ? AND log_date = ? AND meal_label = ? AND meal_position = ?`,
          [
            chosen.id,
            chosen.servings,
            chosen.scaledCalories,
            chosen.scaledProtein,
            chosen.scaledCarbs,
            chosen.scaledFat,
            clerk_id,
            planDate,
            mealLabel,
            mealIndex
          ]
        );
        
      } catch (updateError) {
        console.error('Error updating meal in database:', updateError);
      }
    }

    // 6) Return numbers (not strings)
    return res.json({
      id: chosen.id,
      name: chosen.name,
      Health_Score: chosen.Health_Score,
      cost: chosen.cost,
      allergies: chosen.allergies,
      calories: Math.round(chosen.calories),
      protein: Math.round(chosen.protein),
      fat: Math.round(chosen.fat),
      carbs: Math.round(chosen.carbs),
      scaledCalories: Math.round(chosen.scaledCalories),
      scaledProtein: Math.round(chosen.scaledProtein),
      scaledCarbs: Math.round(chosen.scaledCarbs),
      scaledFat: Math.round(chosen.scaledFat),
      prep_time: chosen.prep_time,
      cook_time: chosen.cook_time,
      makes_x_servings: chosen.makes_x_servings, // keep for ingredient math
      image: chosen.image,
      diet: chosen.diet,
      servings: chosen.servings,
      ingredients,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    if (con) await con.end();
  }
});

// Secondary 
app.post('/api/recipes', async (req, res) => {
  const { id, scaledRecipe } = req.body; 
  
  
      
  try{
    const con = await mysql.createConnection({
        host: process.env.DB_HOST, 
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME, 
        port: 3306,
    });
   
    
    const [theRows] = await con.execute(
      `SELECT * FROM rec WHERE id = ?`,
      [id]
  );

  //console.log("Made it to theRows");


  
  if (theRows.length === 0) {
    return res.status(404).json({ error: "Recipe not found"});
  }

  const takeRecipeId = theRows[0]?.id;
  //console.log("Made it to takeRecipeId");
 
  
  const [theRows2] = await con.execute(
        `SELECT recipe_id, ingredient_id, quantity, unit FROM ri
        WHERE recipe_id = ?`,
        [takeRecipeId]
      );

      

    

     
      const takeIngredientId = theRows2.map(theRows2 => theRows2.ingredient_id);
      
      
      const placeholders = takeIngredientId.map(() => '?').join(', ');
      
      const [theRows3] = await con.execute(
        `SELECT id, name FROM ing
        WHERE id IN (${placeholders})`,
        takeIngredientId
      );
      
       
      
      // Step 1: Build a map of ingredient_id -> name
      const theIngredientNameMap = {};
      theRows3.forEach((ing) => {
        theIngredientNameMap[ing.id] = ing.name;
      })
     
      // Step 2: Merge names into ingredient list
      const combinedIngredients = theRows2.map((row2) => ({
        name: theIngredientNameMap[row2.ingredient_id] || "Unknown",
        quantity: row2.quantity,
        unit: row2.unit
      }));
      
      

    const recipe = theRows[0];
    

       

    // Extract original recipe info
    const originalRecipe = {
      id: recipe.id,
      name: recipe.name,
      Health_Score: recipe.Health_Score,
      cost: recipe.cost,
      allergies: recipe.allergies,
      calories: recipe.calories, // Based on original
      protein: recipe.protein,  // Based on original
      fat: recipe.fat,  // Based on original
      carbs: recipe.carbs,  // Based on original
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      makes_x_servings: recipe.makes_x_servings, // Shoulnt I use this? No because I auto scraped 1 serving
      instructions: recipe.instructions,
      image: recipe.image,
      diet: recipe.diet,
      ingredients: combinedIngredients
    };

 
  const shapedScaledRecipe = {
    recipeId: scaledRecipe.recipeId,
    name: scaledRecipe.name,
    servings: scaledRecipe.servings,
    prep_time: scaledRecipe.prep_time,
    cook_time: scaledRecipe.cook_time,
    diet: scaledRecipe.diet,
    calories: scaledRecipe.calories,
    protein: scaledRecipe.protein,
    carbs: scaledRecipe.carbs,
    fat: scaledRecipe.fat,
    scaledCalories: scaledRecipe.scaledCalories,
    scaledProtein: scaledRecipe.scaledProtein,
    scaledCarbs: scaledRecipe.scaledCarbs,
    scaledFat: scaledRecipe.scaledFat,
    ingredients: scaledRecipe.ingredients // match exactly to original array
  };
  
  await con.end();


   return res.json({
    original: originalRecipe,
    scaled: shapedScaledRecipe
   });

  }catch(error){
    console.log("Error:", error);
  }

})

  
// Daily Performance Tracking Endpoints

// Create daily performance record
app.post('/api/daily-performance', async (req, res) => {
  console.log("Hit the daily performance endpoint");
  try {
    const { clerk_id, date, total_calories, total_protein, total_carbs, total_fat } = req.body;
    
    if (!clerk_id || !date || total_calories === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await pool.getConnection();
    
    // Check if record already exists for this user and date
    const [existing] = await connection.execute(
      'SELECT id FROM daily_performance WHERE clerk_id = ? AND date = ?',
      [clerk_id, date]
    );

    if (existing.length > 0) {
      // Update existing record
      await connection.execute(
        'UPDATE daily_performance SET total_calories = ?, total_protein = ?, total_carbs = ?, total_fat = ?, updated_at = NOW() WHERE clerk_id = ? AND date = ?',
        [total_calories, total_protein || 0, total_carbs || 0, total_fat || 0, clerk_id, date]
      );
    } else {
      // Create new record
      await connection.execute(
        'INSERT INTO daily_performance (clerk_id, date, total_calories, total_protein, total_carbs, total_fat, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [clerk_id, date, total_calories, total_protein || 0, total_carbs || 0, total_fat || 0]
      );
    }
    
    connection.release();
    res.json({ success: true, message: 'Daily performance recorded' });
  } catch (error) {
    console.error('Error recording daily performance:', error);
    res.status(500).json({ error: 'Failed to record daily performance' });
  }
});

// Get weekly performance data
app.get('/api/weekly-performance/:clerk_id', async (req, res) => {
  try {
    const { clerk_id } = req.params;
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Missing start_date or end_date' });
    }

    const connection = await pool.getConnection();
    
    // Get performance data for the date range
    const [rows] = await connection.execute(
      `SELECT date, total_calories, total_protein, total_carbs, total_fat 
       FROM daily_performance 
       WHERE clerk_id = ? AND date BETWEEN ? AND ?
       ORDER BY date ASC`,
      [clerk_id, start_date, end_date]
    );
    
    connection.release();
    
    // Create a map of date to calories for easy lookup
    const performanceMap = {};
    rows.forEach(row => {
      performanceMap[row.date] = row.total_calories;
    });
    
    res.json({ 
      performance_data: performanceMap,
      raw_data: rows
    });
  } catch (error) {
    console.error('Error fetching weekly performance:', error);
    res.status(500).json({ error: 'Failed to fetch weekly performance' });
  }
});

// Get current week and previous week performance
app.get('/api/weekly-performance-summary/:clerk_id', async (req, res) => {
  try {
    const { clerk_id } = req.params;
    
    const connection = await pool.getConnection();
    
    // Calculate current week dates (Sunday to Saturday)
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // End of week (Saturday)
    
    // Calculate previous week dates
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);
    
    const previousWeekEnd = new Date(previousWeekStart);
    previousWeekEnd.setDate(previousWeekStart.getDate() + 6);
    
    // Format dates for MySQL
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    // Get current week data
    const [currentWeekRows] = await connection.execute(
      `SELECT date, total_calories 
       FROM daily_performance 
       WHERE clerk_id = ? AND date BETWEEN ? AND ?
       ORDER BY date ASC`,
      [clerk_id, formatDate(currentWeekStart), formatDate(currentWeekEnd)]
    );
    
    // Get previous week data
    const [previousWeekRows] = await connection.execute(
      `SELECT date, total_calories 
       FROM daily_performance 
       WHERE clerk_id = ? AND date BETWEEN ? AND ?
       ORDER BY date ASC`,
      [clerk_id, formatDate(previousWeekStart), formatDate(previousWeekEnd)]
    );
    
    connection.release();
    
    // Create arrays for each week (7 days)
    const currentWeekCalories = new Array(7).fill(0);
    const previousWeekCalories = new Array(7).fill(0);
    
    // Fill current week data
    currentWeekRows.forEach(row => {
      const dayOfWeek = new Date(row.date).getDay(); // 0 = Sunday, 1 = Monday, etc.
      currentWeekCalories[dayOfWeek] = row.total_calories;
    });
    
    // Fill previous week data
    previousWeekRows.forEach(row => {
      const dayOfWeek = new Date(row.date).getDay(); // 0 = Sunday, 1 = Monday, etc.
      previousWeekCalories[dayOfWeek] = row.total_calories;
    });
    
    res.json({
      current_week: currentWeekCalories,
      previous_week: previousWeekCalories,
      current_week_dates: {
        start: formatDate(currentWeekStart),
        end: formatDate(currentWeekEnd)
      },
      previous_week_dates: {
        start: formatDate(previousWeekStart),
        end: formatDate(previousWeekEnd)
      }
    });
  } catch (error) {
    console.error('Error fetching weekly performance summary:', error);
    res.status(500).json({ error: 'Failed to fetch weekly performance summary' });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


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
      console.log("Extracted data:", { clerk_id, email, provider });
  
      if (!clerk_id || !email) {
        console.error("Missing required fields");
        return res.status(400).json({ error: 'Missing clerk_id or email' });
      }
  
      console.log("Getting database connection...");
      const connection = await pool.getConnection();
      console.log("Database connection established");
    
      console.log("Checking if user exists...");
      const [existing] = await connection.execute(
        'SELECT clerk_id, email FROM clerk_user WHERE email = ? OR clerk_id = ?',  // Check both email AND clerk_id
        [email, clerk_id]
      );
      console.log("Existing user check result:", existing);
      console.log("Query found", existing.length, "users");
      
      if (existing.length > 0) {
        console.log("User already exists, returning existing user");
        connection.release();
        return res.status(200).json({ 
          success: true, 
          clerk_id: existing[0].clerk_id,
          email: existing[0].email,
          message: 'User already exists' 
        });
      }
  
      console.log("Inserting new user...");
      const [result] = await connection.execute(
        'INSERT INTO clerk_user (clerk_id, email, provider, created_at) VALUES (?, ?, ?, NOW())',
        [clerk_id, email, provider]
      );
      console.log("Insert result:", result);
      connection.release();
      console.log("✅ User created successfully");
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
  console.log("Hit api/data endpoint")
  let { ChosenDiet, ChosenCalories, ChosenTime, ChosenMeals, clerk_id } = req.body; // Add cost and allergies here too

  console.log("ChosenDiet:", ChosenDiet);
  console.log("ChosenCalories:", ChosenCalories);
  console.log("ChosenTime:", ChosenTime);
  console.log("ChosenMeals:", ChosenMeals);
  console.log("clerk_id:", clerk_id);

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

const CALORIE_MARGIN = 330; // Lower this once I have a larger database. I think I need a few hundred recipes to make it work.


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
      WHERE recipe_id IN (${placeholders})`,
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

  console.log("📊 Final meal plan summary:", {
    totalDailyCalories: dailymealPlan.totalDailyCalories,
    totalDailyProtein: dailymealPlan.totalDailyProtein,
    totalDailyCarbs: dailymealPlan.totalDailyCarbs,
    totalDailyFat: dailymealPlan.totalDailyFat,
    mealCount: dailymealPlan.meals.length
  });

  if(clerk_id){
    console.log("💾 Saving meal plan to database for user:", clerk_id);
    try{
      const planDate = new Date().toISOString().split('T')[0];
      console.log("📅 Plan date:", planDate);

      //Do I need this?
      //await con.execute(
       // 'DELETE FROM your_table_name WHERE user_id = ? AND log_dates = ?',
        //[clerk_id, planDate]
      //);

       // Insert each meal into the database
       for (const group of dailymealPlan.meals) {
        for (const meal of group.meals) {
          console.log("🥘 Inserting meal:", meal.name);
          await con.execute(
            `INSERT INTO users_food_log 
             (user_id, recipe_id, meal_label, servings, log_date, 
              scaled_calories, scaled_protein, scaled_carbs, scaled_fat)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              clerk_id,
              meal.recipeId,
              group.label.toLowerCase(), // meal_label
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

     console.log('✅ Meal plan saved to database successfully');
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


  
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


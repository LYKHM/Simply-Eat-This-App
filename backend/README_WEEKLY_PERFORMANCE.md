# Weekly Performance Tracking System

This system tracks user daily calorie intake and provides weekly performance analytics.

## Database Setup

### 1. Create the daily_performance table

Run the SQL script in `create_daily_performance_table.sql`:

```sql
-- Run this in your MySQL database
source create_daily_performance_table.sql;
```
 
### 2. Table Structure

The `daily_performance` table tracks:
- `clerk_id`: User's Clerk authentication ID
- `date`: Date of the performance record
- `total_calories`: Total calories consumed that day
- `total_protein`: Total protein consumed that day
- `total_carbs`: Total carbs consumed that day
- `total_fat`: Total fat consumed that day
- `created_at`: When the record was created
- `updated_at`: When the record was last updated

## API Endpoints

### 1. Record Daily Performance
**POST** `/api/daily-performance`

Records or updates a user's daily calorie intake.

**Request Body:**
```json
{
  "clerk_id": "user_clerk_id",
  "date": "2024-01-15",
  "total_calories": 2500,
  "total_protein": 150,
  "total_carbs": 200,
  "total_fat": 80
}
```

**Response:**
```json
{
  "success": true,
  "message": "Daily performance recorded"
}
```

### 2. Get Weekly Performance Summary
**GET** `/api/weekly-performance-summary/:clerk_id`

Returns current week and previous week performance data.

**Response:**
```json
{
  "current_week": [2100, 1950, 2200, 1800, 2300, 2000, 1900],
  "previous_week": [1850, 2100, 1950, 2200, 1800, 2300, 2000],
  "current_week_dates": {
    "start": "2024-01-14",
    "end": "2024-01-20"
  },
  "previous_week_dates": {
    "start": "2024-01-07",
    "end": "2024-01-13"
  }
}
```

### 3. Get Custom Date Range Performance
**GET** `/api/weekly-performance/:clerk_id?start_date=2024-01-01&end_date=2024-01-07`

Returns performance data for a custom date range.

## Frontend Integration

### 1. Loading Performance Data

The frontend automatically loads weekly performance data when the home screen loads:

```typescript
useEffect(() => {
  const loadWeeklyPerformance = async () => {
    if (!user) return;
    
    setIsLoadingPerformance(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/weekly-performance-summary/${user.id}`);
      if (response.ok) {
        const performanceData = await response.json();
        setCurrentWeekCalories(performanceData.current_week);
        setPreviousWeekCalories(performanceData.previous_week);
      }
    } catch (error) {
      console.error('Error loading weekly performance:', error);
    } finally {
      setIsLoadingPerformance(false);
    }
  };

  loadWeeklyPerformance();
}, [user?.id]);
```

### 2. Recording Daily Performance

Performance is automatically recorded when:
- A meal plan is generated
- Meals are logged/updated

```typescript
const recordDailyPerformance = async () => {
  if (!user || !mealPlanData) return;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/daily-performance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerk_id: user.id,
        date: today,
        total_calories: mealPlanData.totalDailyCalories || 0,
        total_protein: mealPlanData.totalDailyProtein || 0,
        total_carbs: mealPlanData.totalDailyCarbs || 0,
        total_fat: mealPlanData.totalDailyFat || 0,
      }),
    });

    if (response.ok) {
      // Refresh weekly performance data
      // ... refresh logic
    }
  } catch (error) {
    console.error('Error recording daily performance:', error);
  }
};
```

## How It Works

1. **Daily Tracking**: Each time a user logs meals or generates a meal plan, their daily calorie intake is recorded
2. **Weekly Aggregation**: The system automatically calculates current week (Sunday-Saturday) and previous week performance
3. **Visual Display**: The frontend shows empty boxes that fill up based on calorie intake relative to the goal
4. **Real-time Updates**: Performance data is refreshed whenever new data is recorded

## Data Flow

1. User generates meal plan or logs meals
2. Frontend calls `/api/daily-performance` to record the day's intake
3. Frontend calls `/api/weekly-performance-summary` to get updated weekly data
4. WeeklyPerformance component displays the data with visual indicators

## Notes

- Weeks start on Sunday and end on Saturday
- Future days show empty boxes (no fill)
- Today is highlighted with a blue border
- Past days show green (goal reached) or red (below goal) fills
- The system automatically handles date calculations and data aggregation


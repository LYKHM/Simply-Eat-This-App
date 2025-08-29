import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WeeklyPerformanceProps {
  currentWeekCalories: number[];
  previousWeekCalories: number[];
  targetCalories: number;
  isLoading?: boolean;
}

export default function WeeklyPerformance({ 
  currentWeekCalories, 
  previousWeekCalories, 
  targetCalories,
  isLoading = false
}: WeeklyPerformanceProps) {
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Get today's day index (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();
  
  const getDayStatus = (index: number) => {
    if (index < today) return 'past';
    if (index === today) return 'today';
    return 'future';
  };
  
  const getBoxFillHeight = (calories: number) => {
    const percentage = Math.min(calories / targetCalories, 1);
    return percentage * 40; // Max height 40
  };
  
  const getBoxColor = (calories: number, dayStatus: string) => {
    if (dayStatus === 'future') return 'transparent'; // No fill for future days
    
    const percentage = calories / targetCalories;

    if (percentage >= 1.0) return '#30db1d';        // Green: Goal reached (100%+)
    else if (percentage >= 0.8) return '#ffa500';   // Orange: Close to goal (80-99%)
    else return '#e23d3d';  
  };
  
  const getWeekAverage = (calories: number[]) => {
    const validDays = calories.filter(cal => cal > 0);
    return validDays.length > 0 ? validDays.reduce((a, b) => a + b, 0) / validDays.length : 0;
  };

  const currentWeekAvg = getWeekAverage(currentWeekCalories);
  const previousWeekAvg = getWeekAverage(previousWeekCalories);
  const totalCurrentWeek = currentWeekCalories.reduce((sum, cal) => sum + cal, 0);
  const totalPreviousWeek = previousWeekCalories.reduce((sum, cal) => sum + cal, 0);

  /* Temporary remove this until I get the mysql database working.
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Performance</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading performance data...</Text>
        </View>
      </View>
    );
  }
  */

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Performance</Text>
        <View style={styles.averages}>
          <Text style={styles.averageText}>
            This week: <Text style={styles.averageValue}>{Math.round(currentWeekAvg)}</Text> avg
          </Text>
          <Text style={styles.averageText}>
            Total: <Text style={styles.averageValue}>{totalCurrentWeek.toLocaleString()}</Text>
          </Text>
          <Text style={styles.averageText}>
            Last week: <Text style={styles.averageValue}>{Math.round(previousWeekAvg)}</Text> avg
          </Text>
          <Text style={styles.averageText}>
            Total: <Text style={styles.averageValue}>{totalPreviousWeek.toLocaleString()}</Text>
          </Text>
        </View>
      </View>
      
      <View style={styles.weeksContainer}>
        <View style={styles.weekSection}>
          <Text style={styles.weekLabel}>Last Week</Text>
          <View style={styles.boxesContainer}>
            {previousWeekCalories.map((calories, index) => (
              <View key={index} style={styles.dayContainer}>
                <View style={styles.boxOutline}>
                  <View 
                    style={[
                      styles.boxFill, 
                      { 
                        height: getBoxFillHeight(calories),
                        backgroundColor: getBoxColor(calories, 'past')
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.dayLabel}>{weekDays[index]}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.weekSection}>
          <Text style={styles.weekLabel}>This Week</Text>
          <View style={styles.boxesContainer}>
            {currentWeekCalories.map((calories, index) => {
              const dayStatus = getDayStatus(index);
              return (
                <View key={index} style={styles.dayContainer}>
                  <View style={[
                    styles.boxOutline,
                    dayStatus === 'today' && styles.todayBoxOutline
                  ]}>
                    <View 
                      style={[
                        styles.boxFill, 
                        { 
                          height: getBoxFillHeight(calories),
                          backgroundColor: getBoxColor(calories, dayStatus)
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[
                    styles.dayLabel,
                    dayStatus === 'today' && styles.todayLabel
                  ]}>
                    {weekDays[index]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#30db1d' }]} />
          <Text style={styles.legendText}>Goal reached</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#e23d3d' }]} />
          <Text style={styles.legendText}>Below goal</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendDotOutline} />
          <Text style={styles.legendText}>Future days</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    backdropFilter: 'blur(10px)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  averages: {
    alignItems: 'flex-end',
  },
  averageText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  averageValue: {
    fontWeight: '700',
    color: '#333',
  },
  weeksContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  weekSection: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  boxesContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dayContainer: {
    alignItems: 'center',
    gap: 4,
  },
  boxOutline: {
    width: 16,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  todayBoxOutline: {
    borderWidth: 2,
    borderColor: '#3e89ec',
  },
  boxFill: {
    width: '100%',
    minHeight: 0,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },
  dayLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  todayLabel: {
    color: '#3e89ec',
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDotOutline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  legendText: {
    fontSize: 10,
    color: '#666',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

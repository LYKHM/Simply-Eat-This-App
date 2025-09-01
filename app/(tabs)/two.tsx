import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  showArrow?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showSwitch = false,
  switchValue = false,
  onSwitchChange,
  showArrow = true,
}) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={showSwitch}>
    <View style={styles.settingItemContent}>
      <View style={styles.settingItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#6366f1" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingItemRight}>
        {showSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
            thumbColor={switchValue ? '#ffffff' : '#ffffff'}
          />
        ) : showArrow ? (
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        ) : null}
      </View>
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const [remindersEnabled, setRemindersEnabled] = React.useState(true);
  const router = useRouter();

    const handleSettingPress = (settingName: string) => {
    if (settingName === 'Profile Information') {
      router.push('/profile-information');
    } else if (settingName === 'Primary Diet Type') {
      router.push('/diet-type');
    } else if (settingName === 'Nutrition Targets') {
      router.push('/nutrition-targets');
    } else if (settingName === 'Weight and Goal') {
      router.push('/weight-goal');
    } else {
      Alert.alert('Settings', `${settingName} setting tapped`);
    }
  };

  return (
    <LinearGradient
      colors={['#ffffff', '#fef7ff', '#f0f9ff']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your Simply Eat This experience</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="person-outline"
              title="Profile Information"
              subtitle="Update your weight, height, and age"
              onPress={() => handleSettingPress('Profile Information')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diet and Nutrition</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="restaurant-outline"
              title="Primary Diet Type"
              subtitle="Choose Keto, Vegan, or Any Diet"
              onPress={() => handleSettingPress('Primary Diet Type')}
            />
            <SettingItem
              icon="nutrition-outline"
              title="Nutrition Targets"
              subtitle="Set your daily calorie and macro goals"
              onPress={() => handleSettingPress('Nutrition Targets')}
            />
            <SettingItem
              icon="trending-up-outline"
              title="Weight and Goal"
              subtitle="Track your weight and fitness goals"
              onPress={() => handleSettingPress('Weight and Goal')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meals and Schedule</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="calendar-outline"
              title="Meal Layout Options"
              subtitle="Customize your meal planning layout"
              onPress={() => handleSettingPress('Meal Layout Options')}
            />
            <SettingItem
              icon="settings-outline"
              title="Meal Settings"
              subtitle="Configure meal preferences and defaults"
              onPress={() => handleSettingPress('Meal Settings')}
            />
            <SettingItem
              icon="refresh-outline"
              title="Leftover Management"
              subtitle="Manage leftover food tracking"
              onPress={() => handleSettingPress('Leftover Management')}
            />
            <SettingItem
              icon="notifications-outline"
              title="Reminders"
              subtitle="Set meal and nutrition reminders"
              showSwitch={true}
              switchValue={remindersEnabled}
              onSwitchChange={setRemindersEnabled}
              showArrow={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Foods and Plans</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="folder-outline"
              title="Collections"
              subtitle="Manage your food collections"
              onPress={() => handleSettingPress('Collections')}
            />
            <SettingItem
              icon="bookmark-outline"
              title="Saved Plans"
              subtitle="View and edit your meal plans"
              onPress={() => handleSettingPress('Saved Plans')}
            />
            <SettingItem
              icon="heart-outline"
              title="Saved Foods"
              subtitle="Manage your favorite foods"
              onPress={() => handleSettingPress('Saved Foods')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Info</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="information-circle-outline"
              title="Account Information"
              subtitle="View and edit your account details"
              onPress={() => handleSettingPress('Account Information')}
            />
            <SettingItem
              icon="log-out-outline"
              title="Logout"
              subtitle="Sign out of your account"
              onPress={() => handleSettingPress('Logout')}
              showArrow={false}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Simply Eat This v1.0.0</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingItemRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});


import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { PurchasesPackage } from 'react-native-purchases';
import { subscriptionService } from '../lib/subscriptionService';
import { useSubscriptionContext } from '../lib/SubscriptionContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import SparkleContainer from '../components/SparkleContainer';
import TestimonialCard from '../components/TestimonialCard';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');


export default function Paywall() {
  const { refreshStatus } = useSubscriptionContext();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  console.log('selectedPackage state from paywall.tsx', selectedPackage);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

 

  useEffect(() => {
    loadOfferings();
  }, []);
  

  const loadOfferings = async () => {
   // setLoading(true);
    try {
      const offering = await subscriptionService.getOfferings();
      if (offering?.availablePackages) { // Is this correct? Does offering have availablePackages https://revenuecat.github.io/react-native-purchases-docs/8.4.0/interfaces/PurchasesOffering.html
        setPackages(offering.availablePackages);
        // Auto-select the first package (typically annual)
        setSelectedPackage(offering.availablePackages[0]); // Is this the right package?
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
      Alert.alert('Error', 'Failed to load subscription options. Please try again.');
    }
    setLoading(false);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setPurchasing(true);
    try {
      const success = await subscriptionService.purchasePackage(selectedPackage);
      if (success) {
        // Refresh subscription status immediately
        await refreshStatus();
        
        Alert.alert('Success!', 'Welcome to Simply Eat This Premium! 🎉', [
          { text: 'Continue', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    }
    setPurchasing(false);
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const success = await subscriptionService.restorePurchases();
      if (success) {
        // Refresh subscription status immediately
        await refreshStatus();
        
        Alert.alert('Restored!', 'Your purchases have been restored! 🎉', [
          { text: 'Continue', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Restore Failed', 'Failed to restore purchases. Please try again.');
    }
    setRestoring(false);
  };

  const handleOpenTerms = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://www.simplyeatthis.app/terms', {
        showTitle: true,
      });
    } catch (error) {
      console.error('Error opening Terms of Service:', error);
      Alert.alert(
        'Error',
        'Unable to open Terms of Service. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleOpenPrivacy = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://www.simplyeatthis.app/privacy', {
        showTitle: true,
      });
    } catch (error) {
      console.error('Error opening Privacy Policy:', error);
      Alert.alert(
        'Error',
        'Unable to open Privacy Policy. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };
  // Do I need this?
  const formatPrice = (pkg: PurchasesPackage) => {
    const price = pkg.product.priceString;
    const period = pkg.packageType === 'MONTHLY' ? '/month' : 
                   pkg.packageType === 'ANNUAL' ? '/year' : '';
    return `${price}${period}`;
  };

  // Do I need this?
  const getTrialText = (pkg: PurchasesPackage) => {
    if (pkg.packageType === 'ANNUAL') return '3-day free trial';
    return 'Start now';
  };


  const features = [
    {
      id: 1,
      title: 'Basic Meal Generator',
      description: 'Generate meals based on your preferences',
      free: true,
      plus: true,
    },
    {
      id: 2,
      title: 'AI Scanner',
      description: 'Scan your fridge and pantry and get instant meals suggestions',
      free: false,
      plus: true,
    },
    {
      id: 3,
      title: 'A Super Filter',
      description: 'Get access to a super filter for the AI scanner',
      free: false,
      plus: true,
    },
    {
      id: 4,
      title: 'Grocery List',
      description: 'Make it super easy to get the groceries you need',
      free: false,
      plus: true,
    },
  ]

  interface Feature {
    id: number;
    title: string;
    description: string;
    free: boolean;
    plus: boolean;
  }

  const testimonials = [
    {
      id: 1,
      name: 'Marcus',
      flag: '🇺🇸',
      achievement: 'Lost 15kg in 3 months',
      quote: "The AI camera feature is incredible! Just point and shoot - it knows exactly what I'm eating. Game changer!",
      avatarUri: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      id: 2,
      name: 'Sophie',
      flag: '🇬🇧',
      achievement: '67kg → 62kg in 1 month',
      quote: "I've tried so many calorie counters, but Simply Eat This is actually different. Logging meals doesn't feel like a chore anymore!",
      avatarUri: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
      id: 3,
      name: 'Emma',
      flag: '🇦🇺',
      achievement: 'Reached goal weight in 2 months',
      quote: "Finally, an app that understands my lifestyle. The intermittent fasting tracker keeps me motivated every day.",
      avatarUri: 'https://randomuser.me/api/portraits/women/68.jpg'
    },
  ];
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Simply Eat This</Text>
          <LinearGradient
            colors={['#0d6efd', '#0db9fd']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.plusContainer}
          >
            <Text style={styles.plus}>Premium</Text>
          </LinearGradient>
        </View>
        <Text style={styles.headline}>
          Achieve your goals <Text style={styles.highlight}>4.2x</Text> faster
        </Text>

        {selectedPackage && (
          <View style={styles.pricingCard}>
            <LinearGradient
              colors={['#0d6efd', '#0db9fd']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badge}
            >
              <Text style={styles.badgeText}>Most popular</Text>
            </LinearGradient>
            <View style={styles.pricingRow}>
              <Text style={styles.trial}>
                {selectedPackage.product.introPrice?.periodNumberOfUnits} day free trial
              </Text>
              <Text style={styles.price}>{selectedPackage.product.priceString}/month</Text>
            </View>
             <Text style={styles.priceNote}>
              <Text style={styles.arrow}>→</Text> <Text style={styles.newPrice}>{selectedPackage.product.pricePerYearString}/year</Text>
             </Text>
          </View>
        )}
       
        <View style={styles.featuresHeader}>
          <Text style={styles.headerTitle}>What you get</Text>
          <Text style={styles.headerFree}>Free</Text>
          <Text style={styles.headerPlus}>Premium</Text>
        </View>

        <View style={styles.featuresTable}>
          {features.map((item) => (
            <View key={item.id} style={styles.featureRow}>
              <View style={styles.featureColumn}>
                <Text style={styles.feature}>{item.title}</Text>
                <Text style={styles.featureDescription}>{item.description}</Text>
              </View>
              <View style={styles.iconColumn}>
                <Image 
                  source={item.free ? require('../assets/icons8-checkmark-40.png') : require('../assets/icons8-lock-52 (1).png')}
                  style={styles.customIcon}
                />
              </View>
              <View style={styles.iconColumn}>
                <View style={styles.iconContainer}>
                  <Image 
                    source={item.plus ? require('../assets/icons8-checkmark-40.png') : require('../assets/icons8-lock-52 (1).png')}
                    style={styles.customIcon}
                  />
                  {item.plus && (
                    <SparkleContainer 
                      size={6}
                      color="#0db9fd"
                      starCount={5}
                      radius={22}
                    />
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/*
        
        <Text style={styles.testimonialsTitle}>Success stories from our clients</Text>
        <FlatList
          data={testimonials}
          renderItem={({ item }) => (
            <View style={styles.testimonialWrapper}>
              <TestimonialCard
                name={item.name}
                flag={item.flag}
                achievement={item.achievement}
                quote={item.quote}
                avatarUri={item.avatarUri}
              />
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.testimonialsContainer}
          snapToInterval={320}
          snapToAlignment="start"
          decelerationRate="fast"
          getItemLayout={(data, index) => ({
            length: 320,
            offset: 320 * index,
            index,
          })}
          style={{ height: 200 }} 
        />
              
    
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Image source={require('../assets/images/average_rating.png')} style={styles.trustImage}/>
          </View>
          <View style={styles.trustItem}>
           <Image source={require('../assets/images/users_worldwide.png')} style={styles.trustImage}/>
          </View>
        </View>
        */}

        <Text style={styles.disclaimer}>
        Your monthly subscription automatically renews for the same term unless cancelled at least 24 hours prior to the end of the current term. Cancel any time in the App Store at no additional cost; your subscription will then cease at the end of the current term.
        </Text>

        <View style={styles.threeButtons}>

          <TouchableOpacity onPress={handleOpenTerms}>
            <Text style={styles.TermsOfUse}>Terms of Use</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenPrivacy}>
            <Text style={styles.PrivacyPolicy}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.RestorePurchases}>Restore purchases</Text>
          </TouchableOpacity>
        </View>

 
        <TouchableOpacity 
          style={[styles.ctaButton, (purchasing || loading) && styles.disabledButton]} 
          onPress={handlePurchase}
          disabled={purchasing || loading}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Start my 3-day free trial</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.noPayment}>No payment now. Easy to cancel.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  logo: {
    fontSize: 25,
    fontWeight: "700",
    fontFamily: "BricolageGrotesqueBold",
    color: '#333',
  },
  plusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginLeft: 8,
    minWidth: 60,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontSize: 18,
    fontFamily: "BricolageGrotesqueBold",
    fontWeight: "600",
    color: "white",
    textAlign: 'center',
  },
  headline: {
    fontSize: 50,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 16,
    fontFamily: "BricolageGrotesqueBold",
    color: '#333',
  },
  highlight: {
    color: "#0db9fd",
    fontWeight: "700",
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  pricingCard: {
    backgroundColor: "rgba(13, 185, 253, 0.2)",
    outlineColor: "rgba(13, 185, 253, 0.6)",
    outlineWidth: 1,
    padding: 16,
    borderRadius: 16,
    marginVertical: 16,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  trial: {
    fontSize: 18,
    fontWeight: "700",
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
  },
  priceNote: {
    fontSize: 12,
    color: "#555",
    marginTop: 4,
  },
  oldPrice: {
    textDecorationLine: 'line-through',
    color: "#999",
    fontSize: 12,
  },
  arrow: {
    color: "#0db9fd",
    fontSize: 14,
    fontWeight: "bold",
    marginHorizontal: 4,
  },
  newPrice: {
    color: "#0db9fd",
    fontSize: 12,
    fontWeight: "bold",
  },
  featuresHeader: {
    flexDirection: "row",
    marginBottom: 12,
    paddingHorizontal: 4,
    marginTop: 12,
  },
  headerTitle: {
    flex: 2,
    fontSize: 20,
    fontWeight: "700",
    color: '#333',
  },
  headerFree: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: '#666',
  },
  headerPlus: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: '#0db9fd',
  },
  featureIcons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: 80,
  },
  icon: {
    fontSize: 18,
    textAlign: "center",
  },
  featuresTable: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  featureColumn: {
    flex: 2,
    marginRight: 12,
  },
  iconColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    position: 'relative' as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    width: 40,
    height: 40,
  },
  customIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  feature: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  testimonialsTitle: {
    fontSize: 40,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "BricolageGrotesqueBold",
  },
  
  testimonialCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userName: {
    fontWeight: "700",
  },
  subText: {
    fontSize: 12,
    color: "#777",
  },
  quote: {
    marginTop: 8,
    fontStyle: "italic",
  },
  trustRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 24,
  },
  trustItem: {
    alignItems: "center",
  },
  trustBig: {
    fontSize: 22,
    fontWeight: "700",
  },
  trustSmall: {
    fontSize: 12,
  },
  ctaButton: {
    backgroundColor: "#0db9fd",
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: "center",
    marginVertical: 16,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
    marginTop: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    marginTop: 8,
  },
  testimonialsContainer: {
    paddingHorizontal: 16,
  },
  testimonialWrapper: {
    width: 300,  // Card width
    marginRight: 20,  // Space between cards
  },
  trustImage: {
    width: width * 0.3,
    height: 140,
    resizeMode: 'contain',
    marginBottom: -16,
  },
  disclaimerText: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
  },
  threeButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  TermsOfUse: {
    fontSize: 13,
    fontWeight: "700",
  },
  PrivacyPolicy: {
    fontSize: 13,
    fontWeight: "700",
  },
  RestorePurchases: {
    fontSize: 13,
    fontWeight: "700",
  },
  noPayment: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});


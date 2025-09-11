import React from 'react';
import { StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export default function TermsOfServiceScreen() {
  const handleOpenTerms = async () => {
    try {
      // You can replace this with your actual Terms of Service URL
      const termsUrl = 'https://www.simplyeatthis.app/terms';
      
      // Open in in-app browser
      await WebBrowser.openBrowserAsync(termsUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: '#6366f1',
        showTitle: true,
        enableBarCollapsing: false,
        showInRecents: true,
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

  const handleOpenPrivacyPolicy = async () => {
    try {
      // You can replace this with your actual Privacy Policy URL
      const privacyUrl = 'https://www.simplyeatthis.app/privacy';
      
      await WebBrowser.openBrowserAsync(privacyUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: '#6366f1',
        showTitle: true,
        enableBarCollapsing: false,
        showInRecents: true,
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

  
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={['#ffffff', '#fef7ff', '#f0f9ff']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Legal</Text>
            <Text style={styles.headerSubtitle}>Terms of Service and Privacy Policy</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal Documents</Text>
            <View style={styles.sectionContent}>
              <TouchableOpacity style={styles.legalItem} onPress={handleOpenTerms}>
                <View style={styles.legalItemContent}>
                  <View style={styles.legalItemLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="document-text-outline" size={20} color="#6366f1" />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={styles.legalTitle}>Terms of Service</Text>
                      <Text style={styles.legalSubtitle}>Read our terms and conditions</Text>
                    </View>
                  </View>
                  <View style={styles.legalItemRight}>
                    <Ionicons name="open-outline" size={20} color="#9ca3af" />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.legalItem} onPress={handleOpenPrivacyPolicy}>
                <View style={styles.legalItemContent}>
                  <View style={styles.legalItemLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="shield-checkmark-outline" size={20} color="#6366f1" />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={styles.legalTitle}>Privacy Policy</Text>
                      <Text style={styles.legalSubtitle}>Learn how we protect your data</Text>
                    </View>
                  </View>
                  <View style={styles.legalItemRight}>
                    <Ionicons name="open-outline" size={20} color="#9ca3af" />
                  </View>
                </View>
              </TouchableOpacity>

            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>About Our Legal Documents</Text>
                <Text style={styles.infoDescription}>
                  Our Terms of Service and Privacy Policy are hosted externally and will open in a secure in-app browser. 
                  This ensures you always have access to the most up-to-date versions of our legal documents.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Simply Eat This v1.0.0</Text>
            <Text style={styles.footerSubtext}>Last updated: {new Date().toLocaleDateString()}</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
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
  legalItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
  },
  legalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  legalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legalItemRight: {
    alignItems: 'center',
    justifyContent: 'center',
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
  legalTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  legalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  footer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#d1d5db',
  },
});
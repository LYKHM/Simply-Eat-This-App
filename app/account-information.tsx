import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, View as RNView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';

interface InfoItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  isEmail?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, title, value, isEmail = false }) => (
  <View style={styles.infoItem}>
    <View style={styles.infoItemContent}>
      <View style={styles.infoItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#6366f1" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.infoTitle}>{title}</Text>
          <Text style={styles.infoValue} numberOfLines={2} ellipsizeMode="tail">
            {value}
          </Text>
        </View>
      </View>
      {isEmail && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      )}
    </View>
  </View>
);

export default function AccountInformationScreen() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
 //const [isDeleting, setIsDeleting] = useState(false);

  const handleBack = () => {
    router.back();
  };


  const handleDeleteAccount = async () => {
   
    try {
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/deleteUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete account. Please try again.');
      }
      
      const result = await response.json();
      Alert.alert('Goodbye!', result.message);
      setDeleteModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    } finally{
      await signOut();
      router.replace('/(auth)') // Is this a good place? Yes it was
    }
  };


  const showDeleteConfirmation = () => {
    setDeleteModalVisible(true);
  };

  if (!isLoaded) {
    return (
      <LinearGradient
        colors={['#ffffff', '#fef7ff', '#f0f9ff']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  const primaryEmail = user?.primaryEmailAddress?.emailAddress;
  const emailAddresses = user?.emailAddresses || [];
  const externalAccounts = user?.externalAccounts || [];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#6366f1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Information</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.sectionContent}>
            <InfoItem
              icon="person-outline"
              title="Full Name"
              value={user?.fullName || 'Not provided'}
            />
            <InfoItem
              icon="calendar-outline"
              title="Member Since"
              value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
            />
            <InfoItem
              icon="id-card-outline"
              title="User ID"
              value={user?.id || 'Unknown'}
            />
          </View>
        </View>

        {/* Email Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Addresses</Text>
          <View style={styles.sectionContent}>
            {emailAddresses.length > 0 ? (
              emailAddresses.map((email, index) => (
                <InfoItem
                  key={email.id}
                  icon="mail-outline"
                  title={index === 0 ? 'Primary Email' : 'Additional Email'}
                  value={email.emailAddress}
                  isEmail={email.verification?.status === 'verified'}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="mail-outline" size={24} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No email addresses found</Text>
              </View>
            )}
          </View>
        </View>

        {/* Connected Accounts Section */}
        {externalAccounts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connected Accounts</Text>
            <View style={styles.sectionContent}>
              {externalAccounts.map((account) => (
                <InfoItem
                  key={account.id}
                  icon="link-outline"
                  title={`${account.provider} Account`}
                  value={account.emailAddress || account.username || 'Connected'}
                />
              ))}
            </View>
          </View>
        )}

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.dangerButton} onPress={showDeleteConfirmation}>
              <View style={styles.dangerButtonContent}>
                <View style={styles.dangerButtonLeft}>
                  <View style={styles.dangerIconContainer}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.dangerButtonTitle}>Delete Account</Text>
                    <Text style={styles.dangerButtonSubtitle}>
                      Permanently delete your account and all data
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ef4444" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Simply Eat This v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <RNView style={styles.modalOverlay}>
          <RNView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={32} color="#ef4444" />
              <Text style={styles.modalTitle}>Delete Account</Text>
            </View>
            
            <Text style={styles.modalDescription}>
              Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data, including:
            </Text>
            
            <View style={styles.modalList}>
              <View style={styles.modalListItem}>
                <Ionicons name="close-circle" size={16} color="#ef4444" />
                <Text style={styles.modalListItemText}>Your profile information</Text>
              </View>
              <View style={styles.modalListItem}>
                <Ionicons name="close-circle" size={16} color="#ef4444" />
                <Text style={styles.modalListItemText}>All saved meal plans</Text>
              </View>
              <View style={styles.modalListItem}>
                <Ionicons name="close-circle" size={16} color="#ef4444" />
                <Text style={styles.modalListItemText}>Nutrition preferences</Text>
              </View>
              <View style={styles.modalListItem}>
                <Ionicons name="close-circle" size={16} color="#ef4444" />
                <Text style={styles.modalListItemText}>Progress tracking data</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setDeleteModalVisible(false)}
                
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalDeleteButton]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.modalDeleteButtonText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </RNView>
        </RNView>
      </Modal>
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
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
    //shadowColor: '#000',
    //shadowOffset: {
    //  width: 0,
    //  height: 2,
    //},
    //hadowOpacity: 0.1,
    //shadowRadius: 8,
    //elevation: 3,
    boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
  },
  infoItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
  },
  infoItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  infoItemLeft: {
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
  infoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10b981',
    marginLeft: 4,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 8,
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  dangerButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dangerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dangerButtonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
    marginBottom: 2,
  },
  dangerButtonSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  footer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
  },
  modalDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalList: {
    marginBottom: 24,
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalListItemText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  modalDeleteButtonDisabled: {
    backgroundColor: '#fca5a5',
  },
  modalDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

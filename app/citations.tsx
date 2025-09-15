import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

interface CitationItem {
  title: string;
  authors: string;
  journal: string;
  year: string;
  url: string;
  description: string;
}

const citations: CitationItem[] = [
  {
    title: "A new predictive equation for resting energy expenditure in healthy individuals",
    authors: "Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO",
    journal: "American Journal of Clinical Nutrition",
    year: "1990",
    url: "https://pubmed.ncbi.nlm.nih.gov/2305711/",
    description: "Mifflin-St Jeor Equation for BMR calculation"
  },
  {
    title: "Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids",
    authors: "Institute of Medicine (US) Committee on Dietary Reference Intakes",
    journal: "National Academies Press",
    year: "2005",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK218736/",
    description: "Macronutrient distribution guidelines and protein requirements"
  },
  {
    title: "Position of the Academy of Nutrition and Dietetics: Health Implications of Dietary Fiber",
    authors: "Dahl WJ, Stewart ML",
    journal: "Journal of the Academy of Nutrition and Dietetics",
    year: "2015",
    url: "https://pubmed.ncbi.nlm.nih.gov/26514720/",
    description: "Dietary fiber recommendations and health benefits"
  },
  {
    title: "International Society of Sports Nutrition Position Stand: protein and exercise",
    authors: "Jäger R, Kerksick CM, Campbell BI, Cribb PJ, Wells SD, Skwiat TM, et al.",
    journal: "Journal of the International Society of Sports Nutrition",
    year: "2017",
    url: "https://pubmed.ncbi.nlm.nih.gov/28642676/",
    description: "Protein requirements for athletes and active individuals"
  },
  {
    title: "Dietary Guidelines for Americans 2020-2025",
    authors: "U.S. Department of Agriculture and U.S. Department of Health and Human Services",
    journal: "USDA",
    year: "2020",
    url: "https://www.dietaryguidelines.gov/",
    description: "Official dietary recommendations and macronutrient guidelines"
  },
  {
    title: "Physical Activity Guidelines for Americans",
    authors: "U.S. Department of Health and Human Services",
    journal: "HHS",
    year: "2018",
    url: "https://health.gov/sites/default/files/2019-09/Physical_Activity_Guidelines_2nd_edition.pdf",
    description: "Activity level classifications and health benefits"
  },
  {
    title: "Weight Management: State of the Science and Opportunities for Military Programs",
    authors: "Institute of Medicine",
    journal: "National Academies Press",
    year: "2004",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK221839/",
    description: "Weight loss and weight gain rate recommendations"
  },
  {
    title: "USDA FoodData Central",
    authors: "U.S. Department of Agriculture",
    journal: "Agricultural Research Service",
    year: "2019",
    url: "https://fdc.nal.usda.gov/",
    description: "Nutritional database for food composition and calorie calculations"
  }
];

export default function CitationsScreen() {
  const router = useRouter();

  const openCitation = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: '#6366f1',
        showTitle: true,
        enableBarCollapsing: true,
        showInRecents: false,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to open citation');
    }
  };

  const renderCitation = (citation: CitationItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.citationCard}
      onPress={() => openCitation(citation.url)}
    >
      <View style={styles.citationHeader}>
        <View style={styles.citationNumber}>
          <Text style={styles.citationNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.citationContent}>
          <Text style={styles.citationTitle}>{citation.title}</Text>
          <Text style={styles.citationAuthors}>{citation.authors}</Text>
          <Text style={styles.citationJournal}>
            {citation.journal} ({citation.year})
          </Text>
          <Text style={styles.citationDescription}>{citation.description}</Text>
        </View>
        <Ionicons name="open-outline" size={20} color="#6366f1" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={['#ffffff', '#fef7ff', '#f0f9ff']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical Citations</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.introSection}>
              <Text style={styles.introTitle}>Scientific References</Text>
              <Text style={styles.introText}>
                Simply Eat This uses scientifically-backed formulas and recommendations for all nutritional calculations and health information. 
                All medical and nutritional data is based on peer-reviewed research and official dietary guidelines.
              </Text>
            </View>

            <View style={styles.disclaimerSection}>
              <View style={styles.disclaimerCard}>
                <Ionicons name="information-circle" size={24} color="#f59e0b" />
                <View style={styles.disclaimerContent}>
                  <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
                  <Text style={styles.disclaimerText}>
                    This app provides general nutritional information and should not replace professional medical advice. 
                    Consult with a healthcare provider before making significant dietary changes.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.citationsSection}>
              <Text style={styles.sectionTitle}>References</Text>
               <Text style={styles.sectionSubtitle}>
                 Tap any citation to view the original research
               </Text>
              
              {citations.map(renderCitation)}
            </View>

            <View style={styles.methodologySection}>
              <Text style={styles.sectionTitle}>Calculation Methods</Text>
              <View style={styles.methodologyCard}>
                <Text style={styles.methodologyTitle}>BMR Calculation</Text>
                <Text style={styles.methodologyText}>
                  Uses the Mifflin-St Jeor Equation: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5 (men) or -161 (women)
                </Text>
              </View>
              
              <View style={styles.methodologyCard}>
                <Text style={styles.methodologyTitle}>TDEE Calculation</Text>
                <Text style={styles.methodologyText}>
                  TDEE = BMR × Activity Factor (1.2-1.9 based on activity level)
                </Text>
              </View>
              
              <View style={styles.methodologyCard}>
                <Text style={styles.methodologyTitle}>Macro Distribution</Text>
                <Text style={styles.methodologyText}>
                  Protein: 1.8-2.2g/kg body weight, Fat: 0.8g/kg body weight, Carbohydrates: Remaining calories ÷ 4
                </Text>
              </View>
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  introSection: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    textAlign: 'center',
  },
  disclaimerSection: {
    marginBottom: 24,
  },
  disclaimerCard: {
    flexDirection: 'row',
    
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  disclaimerContent: {
    flex: 1,
    marginLeft: 12,

  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  citationsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  citationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  citationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  citationNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  citationNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  citationContent: {
    flex: 1,
  },
  citationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    lineHeight: 22,
  },
  citationAuthors: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  citationJournal: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
    marginBottom: 4,
  },
  citationDescription: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  methodologySection: {
    marginBottom: 24,
  },
  methodologyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  methodologyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  methodologyText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

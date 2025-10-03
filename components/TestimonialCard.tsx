import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface TestimonialCardProps {
  name: string;
  flag: string;
  achievement: string;
  quote: string;
  avatarUri: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  name,
  flag,
  achievement,
  quote,
  avatarUri,
}) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: avatarUri }} style={styles.avatar} />
      <View style={styles.content}>
        <Text style={styles.userName}>{name} {flag}</Text>
        <Text style={styles.achievement}>{achievement}</Text>
        <Text style={styles.quote}>"{quote}"</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 180,
    maxHeight: 220,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  achievement: {
    fontSize: 12,
    color: '#777',
    marginBottom: 8,
  },
  quote: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default TestimonialCard;

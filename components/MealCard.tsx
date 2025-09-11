import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export type MacroBreakdown = {
	protein: number;
	carbs: number;
	fat: number;
};

export type MealItem = {
	id: string;
	name: string;
	calories: number;
	macros: MacroBreakdown;
	imageUrl: string;
};

type MealCardProps = {
	item: MealItem;
};

export default function MealCard({ item }: MealCardProps) {
	return (
		<View style={styles.card}>
			<Image source={{ uri: item.imageUrl }} style={styles.image} />
			<View style={styles.info}>
				<Text style={styles.title}>{item.name}</Text>
				<Text style={styles.meta}>Calories: {item.calories}</Text>
				<Text style={styles.meta}>Protein: {item.macros.protein}g  Carbs: {item.macros.carbs}g  Fat: {item.macros.fat}g</Text>
			</View>
		</View>
	);
} 

const styles = StyleSheet.create({
	card: {
		flexDirection: 'row',
		backgroundColor: '#fff',
		borderRadius: 10,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#e5e5e5',
		marginBottom: 12,
	},
	image: {
		width: 80,
		height: 80,
	},
	info: {
		flex: 1,
		padding: 10,
		justifyContent: 'center',
	},
	title: {
		fontSize: 14,
		fontWeight: '700',
		marginBottom: 4,
	},
	meta: {
		fontSize: 12,
		color: '#555',
	},
});



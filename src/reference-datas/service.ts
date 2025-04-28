import db from "../db/index.js";

export async function getAllSensoryData() {
	try {
		const data = await db.query.sensoryData.findMany();
		return data;
	} catch (error) {
		return [];
	}
}

export async function getAllHealthData() {
	try {
		const data = await db.query.healthData.findMany();
		return data;
	} catch (error) {
		return [];
	}
}

export async function getAllCommonReports() {
	try {
		const data = await db.query.commonReport.findMany();
		return data;
	} catch (error) {
		return [];
	}
}

export async function getAllWellnessList() {
	try {
		const data = await db.query.wellnessList.findMany();
		return data;
	} catch (error) {
		return [];
	}
}

export async function getAllStressTypes() {
	try {
		const data = await db.query.stressTypes.findMany();
		return data;
	} catch (error) {
		return [];
	}
}

export async function getAllRealIntentions() {
	try {
		const data = await db.query.realIntentions.findMany();
		return data;
	} catch (error) {
		return [];
	}
}

export async function getAllMusicalNotes() {
	try {
		const data = await db.query.musicalNotes.findMany();
		return data;
	} catch (error) {
		return [];
	}
}

export async function getAllConstructiveAndRestrictive() {
	try {
		const data = await db.query.constructiveAndRestrictive.findMany();
		return data;
	} catch (error) {
		return [];
	}
}

export async function getAllEmotionsListFreqCore() {
	try {
		const data = await db.query.emotionsListFreqCore.findMany();
		return data;
	} catch (error) {
		return [];
	}
}

export async function getAllPresentCharacters() {
	try {
		const data = await db.query.presentCharacters.findMany();
		return data;
	} catch (error) {
		return [];
	}
}

export async function getOrganIndicatorGroupingsForDoc() {
	try {
		const data = await db.query.organIndicatorGroupings.findMany();
		return data;
	} catch (error) {
		return [];
	}
}

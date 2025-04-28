import {
	Document,
	Packer,
	Paragraph,
	TextRun,
	HeadingLevel,
	Table,
	TableRow,
	TableCell,
	WidthType,
	ImageRun,
	AlignmentType,
} from "docx";
import fs from "node:fs";
import type { ProcessVisualReportData } from "../db/schema.js";
import * as ReferenceDataService from "src/reference-datas/service.js";
import path from "node:path";

export async function generateRichDocument({
	documentName,
	parsedData,
}: { documentName: string; parsedData: ProcessVisualReportData }) {
	const imagePath = parsedData.images[0];
	const imageBuffer = fs.readFileSync(imagePath);

	const [
		sensoryData,
		healthData,
		commonReport,
		wellnessList,
		stressTypes,
		realIntentions,
		musicalNotes,
		constructiveAndRestrictive,
		emotionsListFreqCore,
		presentCharacters,
	] = await Promise.all([
		ReferenceDataService.getAllSensoryData(),
		ReferenceDataService.getAllHealthData(),
		ReferenceDataService.getAllCommonReports(),
		ReferenceDataService.getAllWellnessList(),
		ReferenceDataService.getAllStressTypes(),
		ReferenceDataService.getAllRealIntentions(),
		ReferenceDataService.getAllMusicalNotes(),
		ReferenceDataService.getAllConstructiveAndRestrictive(),
		ReferenceDataService.getAllEmotionsListFreqCore(),
		ReferenceDataService.getAllPresentCharacters(),
	]);

	const doc = new Document({
		sections: [
			{
				properties: {},
				children: [
					// Section 1: Your Stress Level
					new Paragraph({
						text: "1. Your Stress Level",
						heading: HeadingLevel.HEADING_1,
						spacing: { after: 200 },
					}),
					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [
							new TableRow({
								children: [
									new TableCell({
										columnSpan: 2,
										width: { size: 100, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Stress Level Score" })],
									}),
								],
							}),
							new TableRow({
								children: [
									new TableCell({
										columnSpan: 2,
										width: { size: 100, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: parsedData.stress_level.score,
											}),
										],
									}),
								],
							}),
							new TableRow({
								children: [
									new TableCell({
										columnSpan: 1,
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Description" })],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: "Indicator",
											}),
										],
									}),
								],
							}),
							new TableRow({
								children: [
									new TableCell({
										columnSpan: 1,
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: parsedData.stress_level.description,
											}),
										],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: stressTypes.find(
													(data) =>
														Number.parseFloat(parsedData.stress_level.score) >=
															data.stressFrom &&
														Number.parseFloat(parsedData.stress_level.score) <=
															data.stressTo,
												)?.indicator,
											}),
										],
									}),
								],
							}),
						],
					}),

					// Section 2: Your Emotional State
					new Paragraph({
						text: "2. Your Emotional State",
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 400, after: 200 },
					}),
					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [
							new TableRow({
								children: [
									new TableCell({
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Empowering" })],
									}),
									new TableCell({
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: "Your Positive Emotion",
											}),
										],
									}),
								],
							}),
							...parsedData.emotional_state.empowering.map((item) => {
								return new TableRow({
									children: [
										new TableCell({
											width: { size: 50, type: WidthType.PERCENTAGE },
											children: [
												new Paragraph({
													text: item,
												}),
											],
										}),
										new TableCell({
											width: { size: 50, type: WidthType.PERCENTAGE },
											children: [
												new Paragraph({
													text:
														musicalNotes.find(
															(data) => data.empowering === item,
														)?.positiveEmotions ?? "",
												}),
											],
										}),
									],
								});
							}),
						],
					}),
					new Paragraph({
						text: "",
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 400, after: 200 },
					}),
					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [
							new TableRow({
								children: [
									new TableCell({
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Dis-empowering" })],
									}),
									new TableCell({
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: "Your Negative Emotion",
											}),
										],
									}),
								],
							}),
							...parsedData.emotional_state.disempowering.map((item) => {
								return new TableRow({
									children: [
										new TableCell({
											width: { size: 50, type: WidthType.PERCENTAGE },
											children: [
												new Paragraph({
													text: item,
												}),
											],
										}),
										new TableCell({
											width: { size: 50, type: WidthType.PERCENTAGE },
											children: [
												new Paragraph({
													text:
														musicalNotes.find(
															(data) => data.disempowering === item,
														)?.negativeEmotions ?? "",
												}),
											],
										}),
									],
								});
							}),
						],
					}),
					new Paragraph({
						text: "",
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 400, after: 200 },
					}),
					...parsedData.emotional_state.notes.map(
						(note) =>
							new Table({
								width: { size: 100, type: WidthType.PERCENTAGE },
								rows: [
									new TableRow({
										children: [
											new TableCell({
												width: { size: 20, type: WidthType.PERCENTAGE },
												children: [new Paragraph({ text: note.title })],
											}),
											new TableCell({
												width: { size: 40, type: WidthType.PERCENTAGE },
												children: [
													new Paragraph({
														text: "General Reaction",
													}),
												],
											}),
											new TableCell({
												width: { size: 40, type: WidthType.PERCENTAGE },
												children: [
													new Paragraph({
														text: "Social Behaviour Pattern",
													}),
												],
											}),
										],
									}),
									new TableRow({
										children: [
											new TableCell({
												width: { size: 20, type: WidthType.PERCENTAGE },
												children: [
													new Paragraph({
														text: note.social_behavior,
													}),
												],
											}),
											new TableCell({
												width: { size: 40, type: WidthType.PERCENTAGE },
												children: [
													new Paragraph({
														text: note.general_reaction,
													}),
												],
											}),
											new TableCell({
												width: { size: 40, type: WidthType.PERCENTAGE },
												children: [
													new Paragraph({
														text:
															musicalNotes.find(
																(data) =>
																	data.note === note.social_behavior &&
																	data.language === "English",
															)?.positiveEmotions ?? "",
													}),
												],
											}),
										],
									}),
								],
							}),
					),

					// Section 3: Rhythmic Pattern
					new Paragraph({
						text: "3. Rhythmic Pattern",
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 400, after: 200 },
					}),
					new Paragraph({
						children: [
							new ImageRun({
								type: "png",
								data: imageBuffer,
								transformation: { width: 600, height: 250 },
							}),
						],
						alignment: AlignmentType.CENTER,
					}),
					new Paragraph({
						text: "",
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 200, after: 200 },
					}),

					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [
							new TableRow({
								children: [
									new TableCell({
										width: { size: 100, type: WidthType.PERCENTAGE },
										columnSpan: 4,
										children: [
											new Paragraph({
												text: `Frequent Emotion: ${parsedData.rhythmic_pattern.frequent_emotion.title_description}`,
											}),
										],
									}),
								],
							}),
							new TableRow({
								children: [
									new TableCell({
										width: { size: 15, type: WidthType.PERCENTAGE },
										columnSpan: 0.6,
										children: [
											new Paragraph({
												text: parsedData.rhythmic_pattern.frequent_emotion.no,
											}),
										],
									}),
									new TableCell({
										width: { size: 15, type: WidthType.PERCENTAGE },
										columnSpan: 0.6,
										children: [
											new Paragraph({
												text: parsedData.rhythmic_pattern.frequent_emotion
													.header,
											}),
										],
									}),
									new TableCell({
										width: { size: 35, type: WidthType.PERCENTAGE },
										columnSpan: 1.4,
										children: [
											new Paragraph({
												text: parsedData.rhythmic_pattern.frequent_emotion
													.description,
											}),
										],
									}),
									new TableCell({
										width: { size: 35, type: WidthType.PERCENTAGE },
										columnSpan: 1.4,
										children: [
											new Paragraph({
												text:
													emotionsListFreqCore.find(
														(data) =>
															data.no ===
																parsedData.rhythmic_pattern.frequent_emotion
																	.no && data.language === "English",
													)?.explanation ?? "",
											}),
										],
									}),
								],
							}),
							new TableRow({
								children: [
									new TableCell({
										columnSpan: 4,
										width: { size: 100, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: `Core Emotion: ${parsedData.rhythmic_pattern.core_emotion.title_description}`,
											}),
										],
									}),
								],
							}),
							new TableRow({
								children: [
									new TableCell({
										columnSpan: 1,
										width: { size: 15, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: parsedData.rhythmic_pattern.core_emotion.no,
											}),
										],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 15, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: parsedData.rhythmic_pattern.core_emotion.header,
											}),
										],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 35, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: parsedData.rhythmic_pattern.core_emotion
													.description,
											}),
										],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 35, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text:
													emotionsListFreqCore.find(
														(data) =>
															data.no ===
																parsedData.rhythmic_pattern.core_emotion.no &&
															data.language === "English",
													)?.explanation ?? "",
											}),
										],
									}),
								],
							}),
						],
					}),

					// Section 4: Your Present Sensory Attributes
					new Paragraph({
						text: "4. Your Present Sensory Attributes",
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 400, after: 200 },
					}),
					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [
							new TableRow({
								children: [
									new TableCell({
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: "BASE",
												heading: HeadingLevel.HEADING_6,
												alignment: AlignmentType.CENTER,
											}),
											new Paragraph({
												text: parsedData.sensory_attributes.base
													.title_description,
											}),
										],
									}),
									new TableCell({
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: "NEXT",
												heading: HeadingLevel.HEADING_6,
												alignment: AlignmentType.CENTER,
											}),
											new Paragraph({
												text: parsedData.sensory_attributes.next
													.title_description,
											}),
										],
									}),
								],
							}),
							new TableRow({
								children: [
									new TableCell({
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: parsedData.sensory_attributes.base.attributes.map(
											(attr) => new Paragraph({ text: attr }),
										),
									}),
									new TableCell({
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: parsedData.sensory_attributes.next.attributes.map(
											(attr) => new Paragraph({ text: attr }),
										),
									}),
								],
							}),
						],
					}),

					// Section 5: Brain Activities
					new Paragraph({
						text: "5. Brain Activities",
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 400, after: 200 },
					}),
					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [
							new TableRow({
								children: [
									new TableCell({
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: "Left",
												alignment: AlignmentType.CENTER,
											}),
										],
									}),
									new TableCell({
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: "Right",
												alignment: AlignmentType.CENTER,
											}),
										],
									}),
								],
							}),
							new TableRow({
								children: [
									new TableCell({
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: parsedData.brain_activities.left,
												alignment: AlignmentType.CENTER,
											}),
										],
									}),
									new TableCell({
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: parsedData.brain_activities.right,
												alignment: AlignmentType.CENTER,
											}),
										],
									}),
								],
							}),
						],
					}),

					// Section 6: Present Character and Real Intention
					new Paragraph({
						text: "6. Present Character and Real Intention",
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 400, after: 200 },
					}),
					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [
							new TableRow({
								children: [
									new TableCell({
										columnSpan: 5,
										width: { size: 100, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Present Character" })],
									}),
								],
							}),
							new TableRow({
								children: [
									new TableCell({
										columnSpan: 1,
										width: { size: 10, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Character" })],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 15, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Present Character" })],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 25, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Summary" })],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 25, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Work Environment" })],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 25, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Ideal Jobs" })],
									}),
								],
							}),

							new TableRow({
								children: [
									new TableCell({
										columnSpan: 1,
										width: { size: 10, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: parsedData.present_character.character,
											}),
										],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 15, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: parsedData.present_character.present_character,
											}),
										],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 25, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: parsedData.present_character.summary,
											}),
										],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 25, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text:
													presentCharacters.find(
														(data) =>
															data.character ===
															parsedData.present_character.character,
													)?.workEnvironment ?? "",
											}),
										],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 25, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text:
													presentCharacters.find(
														(data) =>
															data.character ===
															parsedData.present_character.character,
													)?.ideasJobs ?? "",
											}),
										],
									}),
								],
							}),
						],
					}),
					new Paragraph({
						text: "",
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 400, after: 200 },
					}),
					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [
							new TableRow({
								children: [
									new TableCell({
										columnSpan: 7,
										width: { size: 100, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Real Intention" })],
									}),
								],
							}),
							new TableRow({
								children: [
									new TableCell({
										columnSpan: 1,
										width: { size: 5, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Character" })],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 10, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Real Intention" })],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 17, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Summary" })],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 17, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Career Choice" })],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 17, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Ideal Workspace" })],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 17, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Ideal Jobs" })],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 17, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Grow Path" })],
									}),
								],
							}),

							new TableRow({
								children: [
									new TableCell({
										columnSpan: 1,
										width: { size: 5, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: parsedData.real_intention.character,
											}),
										],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 10, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: parsedData.real_intention.real_intention,
											}),
										],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 17, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: parsedData.real_intention.summary,
											}),
										],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 17, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text:
													realIntentions.find(
														(data) =>
															data.character ===
															parsedData.real_intention.character,
													)?.careerChoices ?? "",
											}),
										],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 17, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text:
													realIntentions.find(
														(data) =>
															data.character ===
															parsedData.real_intention.character,
													)?.idealWorkplace ?? "",
											}),
										],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 17, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text:
													realIntentions.find(
														(data) =>
															data.character ===
															parsedData.real_intention.character,
													)?.ideasJobs ?? "",
											}),
										],
									}),
									new TableCell({
										columnSpan: 1,
										width: { size: 17, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text:
													realIntentions.find(
														(data) =>
															data.character ===
															parsedData.real_intention.character,
													)?.growPath ?? "",
											}),
										],
									}),
								],
							}),
						],
					}),
					// Section 7: The Seven Leadership Dynamics
					new Paragraph({
						text: "7. The Seven Leadership Dynamics",
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 200, after: 200 },
					}),

					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [
							...(() => {
								const rows: TableRow[] = [];
								for (
									let i = 0;
									i < parsedData.leadership_dynamics.length;
									i = i + 2
								) {
									const firstDynamics = parsedData.leadership_dynamics[i];
									const secondDynamics = parsedData.leadership_dynamics[i + 1];
									rows.push(
										new TableRow({
											children: [
												new TableCell({
													width: { size: 33, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															text: `${firstDynamics.title} : ${firstDynamics.title_description}`,
														}),
													],
												}),

												new TableCell({
													width: { size: 33, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															text: secondDynamics
																? `${secondDynamics.title} : ${secondDynamics.title_description}`
																: "",
														}),
													],
												}),
											],
										}),
									);
									rows.push(
										new TableRow({
											children: [
												new TableCell({
													width: { size: 33, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															text: firstDynamics.value,
															alignment: AlignmentType.CENTER,
														}),
													],
												}),
												new TableCell({
													width: { size: 33, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															text: secondDynamics ? secondDynamics.value : "",
															alignment: AlignmentType.CENTER,
														}),
													],
												}),
											],
										}),
									);
								}
								return rows;
							})(),
						],
					}),

					// Section 8: Your Top 5 Constructive Attributes
					new Paragraph({
						text: "8. Your Top 5 Constructive Attributes",
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 400, after: 200 },
					}),
					new Paragraph({
						text: parsedData.constructive_attributes.title_description,
						spacing: { after: 100 },
					}),
					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [
							new TableRow({
								children: [
									new TableCell({
										width: { size: 10, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "No." })],
									}),
									new TableCell({
										width: { size: 30, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Constructive" })],
									}),
									new TableCell({
										width: { size: 60, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Description" })],
									}),
								],
							}),
							...parsedData.constructive_attributes.attributes.map(
								(attr) =>
									new TableRow({
										children: [
											new TableCell({
												width: { size: 10, type: WidthType.PERCENTAGE },
												children: [new Paragraph({ text: attr.No })],
											}),
											new TableCell({
												width: { size: 30, type: WidthType.PERCENTAGE },
												children: [
													new Paragraph({
														text: attr.Constructive,
													}),
												],
											}),
											new TableCell({
												width: { size: 60, type: WidthType.PERCENTAGE },
												children: [
													new Paragraph({
														text: attr.Description || "",
													}),
												],
											}),
										],
									}),
							),
						],
					}),

					// Section 9: Your Top 5 Restrictive Attributes
					new Paragraph({
						text: "9. Your Top 5 Restrictive Attributes",
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 400, after: 200 },
					}),
					new Paragraph({
						text: parsedData.restrictive_attributes.title_description,
						spacing: { after: 100 },
					}),
					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [
							new TableRow({
								children: [
									new TableCell({
										width: { size: 10, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "No." })],
									}),
									new TableCell({
										width: { size: 30, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Restrictive" })],
									}),
									new TableCell({
										width: { size: 60, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Description" })],
									}),
								],
							}),
							...parsedData.restrictive_attributes.attributes.map(
								(attr) =>
									new TableRow({
										children: [
											new TableCell({
												width: { size: 10, type: WidthType.PERCENTAGE },
												children: [new Paragraph({ text: attr.No })],
											}),
											new TableCell({
												width: { size: 30, type: WidthType.PERCENTAGE },
												children: [new Paragraph({ text: attr.restrictive })],
											}),
											new TableCell({
												width: { size: 60, type: WidthType.PERCENTAGE },
												children: [
													new Paragraph({
														text: attr.Description || "",
													}),
												],
											}),
										],
									}),
							),
						],
					}),

					// Section 10: Past Experiences Shaped Your Thoughts
					new Paragraph({
						text: "10: Past Experiences Shaped Your Thoughts",
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 400, after: 200 },
					}),
					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [
							new TableRow({
								children: [
									new TableCell({
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: "Code",
												alignment: AlignmentType.CENTER,
											}),
										],
									}),
									new TableCell({
										width: { size: 50, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({
												text: "Value",
												alignment: AlignmentType.CENTER,
											}),
										],
									}),
								],
							}),
							...parsedData.past_experiences.map(
								(exp) =>
									new TableRow({
										children: [
											new TableCell({
												width: { size: 50, type: WidthType.PERCENTAGE },
												children: [
													new Paragraph({
														text: exp.code,
														alignment: AlignmentType.CENTER,
													}),
												],
											}),
											new TableCell({
												width: { size: 50, type: WidthType.PERCENTAGE },
												children: [
													new Paragraph({
														text: exp.value.toString(),
														alignment: AlignmentType.CENTER,
													}),
												],
											}),
										],
									}),
							),
						],
					}),

					// Section 11: Organ Affected by Wellness Challenge.
					new Paragraph({
						text: "12: Organ Affected by Wellness Challenge",
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 400, after: 200 },
					}),
					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [
							new TableRow({
								children: [
									new TableCell({
										width: { size: 20, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Organ" })],
									}),
									new TableCell({
										width: { size: 80, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Description" })],
									}),
								],
							}),
							...parsedData.organ_indicators.map(
								(organ) =>
									new TableRow({
										children: [
											new TableCell({
												width: { size: 20, type: WidthType.PERCENTAGE },
												children: [new Paragraph({ text: organ })],
											}),
											new TableCell({
												width: { size: 80, type: WidthType.PERCENTAGE },
												children: [
													new Paragraph({
														text: healthData.find((data) => data.area === organ)
															?.physicalWellbeing,
													}),
												],
											}),
										],
									}),
							),
						],
					}),
					new Paragraph({
						text: "",
						spacing: { before: 20, after: 20 },
					}),
					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [
							new TableRow({
								children: [
									new TableCell({
										width: { size: 20, type: WidthType.PERCENTAGE },
										children: [
											new Paragraph({ text: "Health Area Impacted by Organ" }),
										],
									}),
									new TableCell({
										width: { size: 80, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Description" })],
									}),
								],
							}),
							new TableRow({
								children: [
									new TableCell({
										width: { size: 20, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "lorem ipsum" })],
									}),
									new TableCell({
										width: { size: 80, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "lorem ipsum" })],
									}),
								],
							}),
						],
					}),
					// Section 12: Potential Mental & Physical Wellness Challenge
					new Paragraph({
						text: "12. Potential Mental & Physical Wellness Challenge",
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 400, after: 200 },
					}),
					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [
							new TableRow({
								children: [
									new TableCell({
										width: { size: 10, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "No." })],
									}),
									new TableCell({
										width: { size: 30, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Wellness Challenge" })],
									}),
									new TableCell({
										width: { size: 60, type: WidthType.PERCENTAGE },
										children: [new Paragraph({ text: "Description" })],
									}),
								],
							}),
							...parsedData.wellness_challenges.map(
								(challenge) =>
									new TableRow({
										children: [
											new TableCell({
												width: { size: 10, type: WidthType.PERCENTAGE },
												children: [
													new Paragraph({
														text: challenge.No,
													}),
												],
											}),
											new TableCell({
												width: { size: 30, type: WidthType.PERCENTAGE },
												children: [new Paragraph({ text: challenge.wellness })],
											}),
											new TableCell({
												width: { size: 60, type: WidthType.PERCENTAGE },
												children: [
													new Paragraph({
														text: challenge.Description || "",
													}),
												],
											}),
										],
									}),
							),
						],
					}),
				],
			},
		],
	});

	const buffer = await Packer.toBuffer(doc);
	const uploadDir = "uploads/generated-docs";
	try {
		fs.accessSync(uploadDir);
	} catch (error) {
		fs.mkdirSync(uploadDir, { recursive: true });
	}
	const filename = `rich_doc_${documentName}.docx`;
	const uploadPath = path.join(uploadDir, filename);
	fs.writeFileSync(path.join(uploadPath), buffer);
	console.log(`Rich document generated: ${filename}`);
	return uploadPath;
}

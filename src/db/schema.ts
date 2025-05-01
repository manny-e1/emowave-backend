import {
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	serial,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
	boolean,
	doublePrecision,
	text,
	char,
	bigint,
	smallint,
	date,
	jsonb,
} from "drizzle-orm/pg-core";

//roles
export const roleValues = ["admin", "user"] as const;

export const roleEnum = pgEnum("role", roleValues);

//login_sessions
export const loginSessionEnum = pgEnum("login_session", ["active", "expired"]);

//users
export const statusEnum = pgEnum("status", ["locked", "active", "inactive"]);

export const users = pgTable(
	"users",
	{
		id: uuid("id").defaultRandom().notNull().primaryKey(),
		name: varchar("name", { length: 256 }).notNull(),
		email: varchar("email", { length: 256 }).notNull(),
		password: varchar("password", { length: 256 }),
		role: roleEnum("role").notNull(),
		status: statusEnum("status").default("inactive").notNull(),
		dob: date("dob"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(users) => [uniqueIndex("email_idx").on(users.email)],
);

export type User = typeof users.$inferSelect;
export type CreateAdmin = typeof users.$inferInsert;
export type CreateUser = Omit<typeof users.$inferInsert, "password" | "dob"> & {
	dob: string;
	password: string;
};
export type Status = Pick<User, "status">["status"];
export type Role = Pick<User, "role">["role"];

//tokens
export const tokens = pgTable("tokens", {
	userId: uuid("user_id")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	token: varchar("token", { length: 256 }).notNull(),
	tokenExpiry: timestamp("token_expiry").notNull(),
});
export type CreateToken = typeof tokens.$inferInsert;

//otps
export const otps = pgTable("otps", {
	userEmail: varchar("user_email", { length: 256 }).notNull(),
	otp: integer("otp").notNull(),
	otpExpiry: timestamp("otp_expiry").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type CreateOtp = typeof otps.$inferInsert;
export type Otp = typeof otps.$inferSelect;

//login_session
export const loginSessions = pgTable("login_sessions", {
	id: serial("id").primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	sessionToken: text("session_token").notNull(),
	status: loginSessionEnum("status").default("active"),
	ip: varchar("ip", { length: 16 }).notNull(),
	userAgent: text("user_agent").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type LoginSession = typeof loginSessions.$inferSelect;

//password_history
export const passwordHistory = pgTable("password_history", {
	id: serial("id").primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	source: varchar({ enum: ["reset", "activation", "login"] }).notNull(),
	password: varchar("password", { length: 256 }).notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export type PasswordHistory = typeof passwordHistory.$inferInsert;
export type Source = PasswordHistory["source"];

//Wrong_password_trail
export const wrongPasswordTrial = pgTable("wrong_password_trials", {
	id: serial("id").primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

//clients
export const clients = pgTable(
	"clients",
	{
		id: uuid().defaultRandom().notNull().primaryKey(),
		clientNumber: integer("client_number").notNull(),
		fullName: varchar("full_name", { length: 256 }).notNull(),
		mobile: varchar({ length: 25 }).notNull(),
		email: varchar({ length: 256 }),
		age: smallint(),
		country: varchar({ length: 256 }).notNull(),
		city: varchar({ length: 256 }),
		type: varchar({ length: 256 }),
		assignedPractitioner: varchar("assigned_practitioner", {
			length: 256,
		}).notNull(),
		companyName: varchar("company_name", { length: 256 }),
		businessSector: varchar("business_sector", { length: 256 }),
		addedTime: text("added_time").$type<string | Date>().notNull(),
		addedBy: varchar("added_by", { length: 256 }),
		event: varchar({ length: 256 }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(tb) => [uniqueIndex("mobile_fullname").on(tb.mobile, tb.fullName)],
);
export type Client = typeof clients.$inferSelect;
export type CreateClient = typeof clients.$inferInsert;

export const clientDocuments = pgTable("client_documents", {
	id: uuid().defaultRandom().notNull().primaryKey(),
	clientId: uuid("client_id")
		.notNull()
		.references(() => clients.id, { onDelete: "cascade" })
		.notNull(),
	documentName: varchar("document_name", { length: 256 }).notNull(),
	documentPath: varchar("document_path", { length: 256 }).notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});
export type ClientDocument = typeof clientDocuments.$inferSelect;
export type CreateClientDocument = typeof clientDocuments.$inferInsert;

export const healthData = pgTable("health_data", {
	id: uuid().defaultRandom().notNull().primaryKey(),
	area: varchar({ length: 256 }).unique().notNull(),
	physicalWellbeing: text("physical_wellbeing").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const presentCharacters = pgTable(
	"present_characters",
	{
		id: uuid().defaultRandom().notNull().primaryKey(),
		language: varchar({ length: 256 }).notNull(),
		no: varchar({ length: 256 }).notNull(),
		character: varchar({ length: 256 }).notNull(),
		presentCharacter: varchar("present_character", { length: 256 }),
		summary: text().notNull(),
		workEnvironment: text("work_environment"),
		ideasJobs: text("ideas_jobs"),
		growPath: text("grow_path"),
		videoPresentCharacter: varchar("video_present_character", { length: 256 }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(tb) => [
		uniqueIndex("present_char_no_lang_char").on(
			tb.no,
			tb.language,
			tb.character,
		),
	],
);

export const realIntentions = pgTable(
	"real_intentions",
	{
		id: uuid().defaultRandom().notNull().primaryKey(),
		language: varchar({ length: 256 }).notNull(),
		no: varchar({ length: 256 }).notNull(),
		character: varchar({ length: 256 }).notNull(),
		realIntention: varchar("real_intention", { length: 256 }).notNull(),
		summary: text().notNull(),
		careerChoices: text("career_choices"),
		idealWorkplace: text("ideal_workplace"),
		ideasJobs: text("ideas_jobs"),
		growPath: text("grow_path"),
		videoRealIntention: varchar("video_real_intention", { length: 256 }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(tb) => [
		uniqueIndex("intention_lang_no_char").on(tb.language, tb.no, tb.character),
	],
);

export const stressTypes = pgTable(
	"stress_types",
	{
		id: uuid().defaultRandom().notNull().primaryKey(),
		stressFrom: doublePrecision("stress_from").notNull(),
		stressTo: doublePrecision("stress_to").notNull(),
		descriptionEn: text("description_en").notNull(),
		descriptionCh: text("description_ch"),
		indicator: text().notNull(),
		childrenIntelligence: text("children_intelligence").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(tb) => [uniqueIndex("stress_from_to").on(tb.stressFrom, tb.stressTo)],
);

export const sensoryData = pgTable("sensory_data", {
	id: uuid().defaultRandom().notNull().primaryKey(),
	sensory: varchar({ length: 256 }).unique().notNull(),
	chinese: varchar({ length: 256 }).notNull(),
	arabic: varchar({ length: 256 }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const commonReport = pgTable(
	"common_report",
	{
		id: uuid().defaultRandom().notNull().primaryKey(),
		inwardOutwardOrientation: varchar("inward_outward_orientation", {
			length: 256,
		}).notNull(),
		introvertExtrovertTendency: varchar("introvert_extrovert_tendency", {
			length: 256,
		}).notNull(),
		sensory: varchar({ length: 256 }).notNull(),
		styleOfCommunicate: text("style_of_communicate").notNull(),
		styleOfLearning: text("style_of_learning").notNull(),
		wayOfDecisionMaking: text("way_of_decision_making").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(tb) => [
		uniqueIndex("comm_sensory_1_2").on(
			tb.sensory,
			tb.inwardOutwardOrientation,
			tb.introvertExtrovertTendency,
		),
	],
);

export const constructiveAndRestrictive = pgTable(
	"constructive_and_restrictive",
	{
		id: uuid().defaultRandom().notNull().primaryKey(),
		language: varchar({ length: 50 }).notNull(),
		no: varchar({ length: 10 }).notNull(),
		header: text().notNull(),
		description: text(),
		status: varchar({ length: 10 }).notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(tb) => [
		uniqueIndex("car_no_language_status").on(tb.no, tb.language, tb.status),
	],
);

export const emotionsListFreqCore = pgTable(
	"emotions_list_freq_core",
	{
		id: uuid().defaultRandom().notNull().primaryKey(),
		no: varchar({ length: 10 }).notNull(),
		header: text().notNull(),
		description: text(),
		language: varchar({ length: 50 }).notNull(),
		status: varchar({ length: 10 }).notNull(),
		explanation: text(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(tb) => [
		uniqueIndex("emotions_no_language_status").on(
			tb.no,
			tb.language,
			tb.status,
		),
	],
);

export const musicalNotes = pgTable(
	"musical_notes",
	{
		id: uuid().defaultRandom().notNull().primaryKey(),
		language: varchar({ length: 50 }).notNull(),
		note: varchar({ length: 10 }).notNull(),
		musicNote: varchar("music_note", { length: 256 }).notNull(),
		generalReaction: text("general_reaction").notNull(),
		empowering: varchar({ length: 256 }).notNull(),
		disempowering: varchar("dis_empowering", { length: 256 }).notNull(),
		status: varchar({ length: 10 }).notNull(),
		freq: varchar({ length: 10 }),
		wavelength: varchar({ length: 50 }),
		empowerCheck: text("empower_check"),
		socialBehaviorPattern: text("social_behavior_pattern"),
		positiveEmotions: text("positive_emotions"),
		negativeEmotions: text("negative_emotions"),
		childrenReaction: text("children_reaction"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(tb) => [
		uniqueIndex("musical_language_note_status").on(
			tb.language,
			tb.note,
			tb.status,
		),
	],
);

export const wellnessList = pgTable(
	"wellness_list",
	{
		id: uuid().defaultRandom().notNull().primaryKey(),
		no: varchar({ length: 10 }).notNull(),
		header: text().notNull(),
		description: text(),
		language: varchar({ length: 50 }).notNull(),
		status: varchar({ length: 10 }).notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(tb) => [
		uniqueIndex("wellness_no_language_status").on(
			tb.no,
			tb.language,
			tb.status,
		),
	],
);

export const organIndicatorGroupings = pgTable("organ_indicator_groupings", {
	id: uuid().defaultRandom().notNull().primaryKey(),
	groupHealthArea: varchar("group_health_area", { length: 256 })
		.unique()
		.notNull(),
	healthAreas: text("health_areas").array().notNull(),
	explanation: text().notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});
export type OrganIndicatorGrouping =
	typeof organIndicatorGroupings.$inferSelect;
export type CreateOrganIndicatorGrouping =
	typeof organIndicatorGroupings.$inferInsert;

export const processedClientData = pgTable("processed_client_data", {
	id: uuid().defaultRandom().notNull().primaryKey(),
	clientId: uuid("client_id")
		.references(() => clients.id, { onDelete: "cascade" })
		.notNull(),
	visualReportDocumentName: varchar("visual_report_document_name", {
		length: 256,
	}),
	idnReportDocumentName: varchar("idn_report_document_name", {
		length: 256,
	}),
	idnData: jsonb("idn_data"),
	visualReportData: jsonb("visual_report_data"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});
export type ProcessedClientData = typeof processedClientData.$inferSelect;
export type CreateProcessedClientData = typeof processedClientData.$inferInsert;

export const generatedDocuments = pgTable(
	"generated_documents",
	{
		id: uuid().defaultRandom().notNull().primaryKey(),
		clientId: uuid("client_id")
			.references(() => clients.id, { onDelete: "cascade" })
			.notNull(),
		name: varchar({ length: 256 }).notNull(),
		path: varchar({ length: 256 }).notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(tb) => [uniqueIndex("gendoc_client_id").on(tb.clientId)],
);

export type ProcessVisualReportData = {
	brain_activities: {
		left: string;
		right: string;
	};
	constructive_attributes: {
		attributes: Array<{
			Constructive: string;
			Description: string | null;
			No: string;
		}>;
		title_description: string;
	};
	date: string;
	emotional_state: {
		disempowering: string[];
		empowering: string[];
		notes: Array<{
			general_reaction: string;
			social_behavior: string;
			title: string;
		}>;
	};
	images: string[];
	leadership_dynamics: Array<{
		title: string;
		title_description: string;
		value: string;
	}>;
	name: string;
	organ_indicators: string[];
	past_experiences: Array<{
		code: string;
		value: number;
	}>;
	present_character: {
		character: string;
		present_character: string;
		summary: string;
	};
	real_intention: {
		character: string;
		real_intention: string;
		summary: string;
	};
	restrictive_attributes: {
		attributes: Array<{
			Description: string;
			No: string;
			restrictive: string;
		}>;
		title_description: string;
	};
	rhythmic_pattern: {
		core_emotion: {
			description: string;
			header: string;
			no: string;
			title_description: string;
		};
		frequent_emotion: {
			description: string;
			header: string;
			no: string;
			title_description: string;
		};
	};
	sensory_attributes: {
		base: {
			attributes: string[];
			title_description: string;
		};
		next: {
			attributes: string[];
			title_description: string;
		};
	};
	stress_level: {
		description: string;
		score: string;
	};
	wellness_challenges: Array<{
		description: string;
		no: string;
		wellness: string;
	}>;
};

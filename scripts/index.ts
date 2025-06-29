import { insertCommonReport } from "./common-report-insertion.js";
import { insertConstructiveAndRestrictive } from "./constructive-restrictive-insertion.js";
import { insertEmotionsListFreqCore } from "./emotions-list-insertion.js";
import { insertHealthData } from "./health-data-insertion.js";
import { insertInflammations } from "./inflammation-insertion.js";
import { insertMusicalNotes } from "./musical-notes-insertion.js";
import { insertPresentCharacters } from "./present-characters-insertion.js";
import { insertRealIntentions } from "./real-intentions-insertion.js";
import { insertSensoryData } from "./sensory-data-insertion.js";
import { insertStressTypes } from "./stress-types-insertion.js";
import { insertWellnessList } from "./wellness-list-insertion.js";

insertInflammations();
insertSensoryData();
insertHealthData();
insertCommonReport();
insertWellnessList();
insertStressTypes();
insertRealIntentions();
insertMusicalNotes();
insertConstructiveAndRestrictive();
insertEmotionsListFreqCore();
insertPresentCharacters();

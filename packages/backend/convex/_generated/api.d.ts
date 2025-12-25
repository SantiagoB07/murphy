/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agent_actions from "../agent/actions.js";
import type * as agent_helpers from "../agent/helpers.js";
import type * as agent_httpDizziness from "../agent/httpDizziness.js";
import type * as agent_httpGlucometry from "../agent/httpGlucometry.js";
import type * as agent_httpInsulin from "../agent/httpInsulin.js";
import type * as agent_httpSleep from "../agent/httpSleep.js";
import type * as agent_httpStress from "../agent/httpStress.js";
import type * as agent_mutations from "../agent/mutations.js";
import type * as agent_queries from "../agent/queries.js";
import type * as agent_schemas from "../agent/schemas.js";
import type * as agent_types from "../agent/types.js";
import type * as aiCallSchedules from "../aiCallSchedules.js";
import type * as coadmins from "../coadmins.js";
import type * as dizzinessRecords from "../dizzinessRecords.js";
import type * as glucoseRecords from "../glucoseRecords.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as insulinDoseRecords from "../insulinDoseRecords.js";
import type * as insulinSchedules from "../insulinSchedules.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_validators from "../lib/validators.js";
import type * as model_glucoseRecords from "../model/glucoseRecords.js";
import type * as model_insulinRecords from "../model/insulinRecords.js";
import type * as model_notifications from "../model/notifications.js";
import type * as model_patients from "../model/patients.js";
import type * as model_treatmentSlots from "../model/treatmentSlots.js";
import type * as model_wellnessRecords from "../model/wellnessRecords.js";
import type * as notificationPreferences from "../notificationPreferences.js";
import type * as patients from "../patients.js";
import type * as privateData from "../privateData.js";
import type * as scripts from "../scripts.js";
import type * as sleepRecords from "../sleepRecords.js";
import type * as stressRecords from "../stressRecords.js";
import type * as treatmentSlots from "../treatmentSlots.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "agent/actions": typeof agent_actions;
  "agent/helpers": typeof agent_helpers;
  "agent/httpDizziness": typeof agent_httpDizziness;
  "agent/httpGlucometry": typeof agent_httpGlucometry;
  "agent/httpInsulin": typeof agent_httpInsulin;
  "agent/httpSleep": typeof agent_httpSleep;
  "agent/httpStress": typeof agent_httpStress;
  "agent/mutations": typeof agent_mutations;
  "agent/queries": typeof agent_queries;
  "agent/schemas": typeof agent_schemas;
  "agent/types": typeof agent_types;
  aiCallSchedules: typeof aiCallSchedules;
  coadmins: typeof coadmins;
  dizzinessRecords: typeof dizzinessRecords;
  glucoseRecords: typeof glucoseRecords;
  healthCheck: typeof healthCheck;
  http: typeof http;
  insulinDoseRecords: typeof insulinDoseRecords;
  insulinSchedules: typeof insulinSchedules;
  "lib/auth": typeof lib_auth;
  "lib/validators": typeof lib_validators;
  "model/glucoseRecords": typeof model_glucoseRecords;
  "model/insulinRecords": typeof model_insulinRecords;
  "model/notifications": typeof model_notifications;
  "model/patients": typeof model_patients;
  "model/treatmentSlots": typeof model_treatmentSlots;
  "model/wellnessRecords": typeof model_wellnessRecords;
  notificationPreferences: typeof notificationPreferences;
  patients: typeof patients;
  privateData: typeof privateData;
  scripts: typeof scripts;
  sleepRecords: typeof sleepRecords;
  stressRecords: typeof stressRecords;
  treatmentSlots: typeof treatmentSlots;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

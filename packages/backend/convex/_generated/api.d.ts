/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiCallSchedules from "../aiCallSchedules.js";
import type * as dizzinessRecords from "../dizzinessRecords.js";
import type * as glucoseRecords from "../glucoseRecords.js";
import type * as healthCheck from "../healthCheck.js";
import type * as insulinDoseRecords from "../insulinDoseRecords.js";
import type * as insulinSchedules from "../insulinSchedules.js";
import type * as lib_auth from "../lib/auth.js";
import type * as notificationPreferences from "../notificationPreferences.js";
import type * as patients from "../patients.js";
import type * as privateData from "../privateData.js";
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
  aiCallSchedules: typeof aiCallSchedules;
  dizzinessRecords: typeof dizzinessRecords;
  glucoseRecords: typeof glucoseRecords;
  healthCheck: typeof healthCheck;
  insulinDoseRecords: typeof insulinDoseRecords;
  insulinSchedules: typeof insulinSchedules;
  "lib/auth": typeof lib_auth;
  notificationPreferences: typeof notificationPreferences;
  patients: typeof patients;
  privateData: typeof privateData;
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

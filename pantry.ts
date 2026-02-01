import { WorkLog } from './types';

const BASE_URL = 'https://getpantry.cloud/apiv1/pantry';

// Basket names
const LOGS_BASKET = 'worklogs';
const SESSION_BASKET = 'session';

export interface ActiveSession {
  status: 'working' | 'break';
  startTime: number;
  breakStartTime: number | null;
  accumulatedBreakTime: number; 
}

// Check if Pantry ID is valid by trying to get details
export const validatePantryId = async (pantryId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${BASE_URL}/${pantryId}`);
    return res.ok;
  } catch (error) {
    return false;
  }
};

// Fetch all logs
export const getRemoteLogs = async (pantryId: string): Promise<WorkLog[]> => {
  try {
    const res = await fetch(`${BASE_URL}/${pantryId}/basket/${LOGS_BASKET}`);
    if (!res.ok) return []; // Basket might not exist yet
    const data = await res.json();
    return data.logs || [];
  } catch (error) {
    console.error("Error fetching logs from Pantry", error);
    return [];
  }
};

// Update logs (Full Replace)
export const updateRemoteLogs = async (pantryId: string, logs: WorkLog[]) => {
  try {
    await fetch(`${BASE_URL}/${pantryId}/basket/${LOGS_BASKET}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs }),
    });
  } catch (error) {
    console.error("Error saving logs to Pantry", error);
  }
};

// Fetch current session state
export const getRemoteSession = async (pantryId: string): Promise<ActiveSession | null> => {
  try {
    const res = await fetch(`${BASE_URL}/${pantryId}/basket/${SESSION_BASKET}`);
    if (!res.ok) return null;
    const data = await res.json();
    // Pantry returns the whole object, we check if it has valid data
    if (!data.startTime) return null; 
    return data as ActiveSession;
  } catch (error) {
    // If basket doesn't exist (400/404), it means no session
    return null;
  }
};

// Update session state
export const updateRemoteSession = async (pantryId: string, session: ActiveSession | null) => {
  try {
    if (session) {
        await fetch(`${BASE_URL}/${pantryId}/basket/${SESSION_BASKET}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(session),
        });
    } else {
        // Pantry doesn't support DELETE basket easily via simple calls in all CORS contexts, 
        // so we overwrite with an empty object or a "cleared" flag.
        // But for this app, sending an object with startTime: 0 is enough to signal "empty"
        await fetch(`${BASE_URL}/${pantryId}/basket/${SESSION_BASKET}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startTime: 0, status: 'idle' }),
        });
    }
  } catch (error) {
    console.error("Error syncing session to Pantry", error);
  }
};

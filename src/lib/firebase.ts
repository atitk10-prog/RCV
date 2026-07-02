import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Provider with required Google Workspace scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({ prompt: 'consent' });

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If we don't have token cached yet (e.g. reload), let the user sign in manually or prompt them
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google to get access token
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không lấy được mã truy cập (Access Token) từ Google');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Lỗi đăng nhập Google Auth:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Google Sheets API Helpers
export interface CreateSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/**
 * Creates a new spreadsheet for the game logs
 */
export const createGoogleSpreadsheet = async (title: string, token: string): Promise<CreateSpreadsheetResult> => {
  try {
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: title
        },
        sheets: [
          {
            properties: {
              title: 'Nhật Ký Câu Hỏi',
              gridProperties: {
                frozenRowCount: 1
              }
            }
          },
          {
            properties: {
              title: 'Xếp Hạng Thí Sinh',
              gridProperties: {
                frozenRowCount: 1
              }
            }
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Sheets API Error: ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    const spreadsheetId = data.spreadsheetId;
    const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // Add headers to both sheets
    await setupSheetHeaders(spreadsheetId, token);

    return { spreadsheetId, spreadsheetUrl };
  } catch (err) {
    console.error('Lỗi tạo Google Sheet:', err);
    throw err;
  }
};

/**
 * Set up initial headers for sheets
 */
const setupSheetHeaders = async (spreadsheetId: string, token: string) => {
  const logHeaders = [
    ['Thời Gian', 'Vòng Thi', 'Câu Hỏi', 'Tổng Thí Sinh', 'Số Thí Sinh Còn Lại', 'Mô Tả / Hành Động', 'SBD Bị Loại', 'SBD Được Cứu Trợ']
  ];

  const rankingHeaders = [
    ['Thứ Hạng', 'Số Báo Danh', 'Họ Và Tên', 'Điểm Vòng 1', 'Điểm Vòng 2', 'Tổng Điểm', 'Số Lần Cứu', 'Trạng Thái', 'Bị Loại Ở Câu']
  ];

  await appendSheetRow(spreadsheetId, 'Nhật Ký Câu Hỏi!A1', logHeaders, token);
  await appendSheetRow(spreadsheetId, 'Xếp Hạng Thí Sinh!A1', rankingHeaders, token);
};

/**
 * Appends rows of values to a specified sheet range
 */
export const appendSheetRow = async (spreadsheetId: string, range: string, values: any[][], token: string) => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: values
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Không thể ghi dữ liệu vào Google Sheets: ${errText}`);
    }
    return await response.json();
  } catch (err) {
    console.error('Lỗi appendSheetRow:', err);
    throw err;
  }
};

/**
 * Overwrites/Updates a specific range (e.g., refreshing complete rankings)
 */
export const updateSheetValues = async (spreadsheetId: string, range: string, values: any[][], token: string) => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: values
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Không thể cập nhật Google Sheets: ${errText}`);
    }
    return await response.json();
  } catch (err) {
    console.error('Lỗi updateSheetValues:', err);
    throw err;
  }
};

// Firestore Realtime Sync Helpers
/**
 * Pushes the state object to Firestore for real-time display
 */
export const syncStateToFirestore = async (sessionId: string, name: string, stateObj: any): Promise<void> => {
  try {
    const docRef = doc(db, 'sessions', sessionId);
    await setDoc(docRef, {
      id: sessionId,
      name: name || 'Rung Chuông Vàng',
      stateJson: JSON.stringify(stateObj),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Lỗi đồng bộ dữ liệu Realtime lên Firestore:', error);
  }
};

/**
 * Listens to a live session state in Firestore
 */
export const listenToFirestoreSession = (sessionId: string, onUpdate: (stateObj: any) => void) => {
  const docRef = doc(db, 'sessions', sessionId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.stateJson) {
        try {
          const parsed = JSON.parse(data.stateJson);
          onUpdate(parsed);
        } catch (e) {
          console.error('Lỗi phân tích JSON từ Firestore:', e);
        }
      }
    }
  }, (error) => {
    console.error('Lỗi đăng ký lắng nghe realtime từ Firestore:', error);
  });
};

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { getStorage, ref as refStorage, uploadBytes, UploadResult } from "firebase/storage";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// const database = getDatabase(firebaseApp);
// const analytics = getAnalytics(app);

const functions = getFunctions(firebaseApp);
export const auth = getAuth(firebaseApp);
if (window.location.hostname === "localhost") {
  connectFunctionsEmulator(functions, "localhost", 5001);
  //   firebaseApp.auth().useEmulator("http://localhost:9099");
  //   firebaseApp.firestore().settings({
  //     host: "localhost:8080",
  //     ssl: false,
  //   });
}

// class FirebaseFunctions {
//   static callFirebase = async (path = "", data = {}, method = "GET") => {
//     try {
//       const firebaseCallableInstance = httpsCallable(functions, "firebaseWrapper");
//       const response = await firebaseCallableInstance({ path, method, data });
//       console.log(response.data.data);
//       const responseData = response.data;
//       const errorMessage =
//         (responseData.data && responseData.data.message) || "Something went wrong!!";
//       if (responseData.status >= 400) {
//         toast.error(errorMessage);
//         throw new Error(errorMessage);
//       }
//       return responseData.data;
//     } catch (error) {
//       console.log(error);
//       return error;
//     }
//   };
//   static get = async (path = "", data = {}) => {
//     return await FirebaseFunctions.callFirebase(path, data, "GET");
//   };
//   static post = async (path = "", data = {}) => {
//     return await FirebaseFunctions.callFirebase(path, data, "POST");
//   };
// }
// const firebaseFunctions = new Firebase();

const storage = getStorage(firebaseApp);

interface UploadResultData {
  fileName: string;
  fullPath: string;
  snapshot: UploadResult;
}

export class FirebaseService {
  public static uploadFilesToFirebase = async (
    files: File[] | File,
    path: string,
  ): Promise<UploadResultData[] | null> => {
    if (!files || (Array.isArray(files) && files.length === 0)) {
      console.warn("⚠️ No files provided for upload.");
      return null;
    }

    const filesArray = Array.isArray(files) ? files : [files];

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    try {
      const uploadResults = await Promise.all(
        filesArray.map(async (file) => {
          const storageRef = refStorage(storage, `${path}/${file.name}_${timestamp}`);
          const snapshot = await uploadBytes(storageRef, file);

          console.log("✅ Uploaded:", file.name, snapshot);

          return {
            fileName: file.name,
            fullPath: snapshot.ref.fullPath,
            snapshot,
          };
        }),
      );

      Toast.success("File(s) uploaded successfully.");
      return uploadResults;
    } catch (error: any) {
      console.error("❌ Upload failed:", error);
      Toast.error(error?.message || "Failed to upload file(s).");
      return null;
    }
  };
}

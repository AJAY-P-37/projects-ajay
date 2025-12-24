import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import {
  getStorage,
  ref as refStorage,
  uploadBytes,
  UploadResult,
  deleteObject,
} from "firebase/storage";
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

const functions = getFunctions(firebaseApp);
if (window.location.hostname === "localhost") {
  connectFunctionsEmulator(functions, "localhost", 5001);
  //   firebaseApp.auth().useEmulator("http://localhost:9099");
  //   firebaseApp.firestore().settings({
  //     host: "localhost:8080",
  //     ssl: false,
  //   });
}

interface UploadResultData {
  fileName: string;
  fullPath: string;
  snapshot: UploadResult;
}

const storage = getStorage(firebaseApp);

export class FirebaseService {
  public static uploadFilesToFirebase = async (
    files: File[] | File,
    path: string,
    fileName?: string,
  ): Promise<UploadResultData[] | null> => {
    if (!files || (Array.isArray(files) && files.length === 0)) {
      console.warn("⚠️ No files provided for upload.");
      return null;
    }

    const filesArray = Array.isArray(files) ? files : [files];

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    try {
      const uploadResults = [];
      await Promise.all(
        filesArray.map(async (file) => {
          const storageRef = refStorage(
            storage,
            `${path}/${file.name}_${crypto.randomUUID()}_${timestamp}`,
          );
          const snapshot = await uploadBytes(storageRef, file);

          uploadResults.push({
            storageRef,
            fileName: file.name,
            fullPath: snapshot.metadata.fullPath,
            snapshot,
          });
        }),
      );

      fileName && Toast.success(`${fileName} File(s) uploaded successfully.`);
      return uploadResults;
    } catch (error: any) {
      console.error("❌ Upload failed:", error);
      Toast.error(error?.message || "Failed to upload file(s).");
      return null;
    }
  };
  public static deleteFileFromStorage = async (fullPath: string, fileName: string = null) => {
    try {
      const fileRef = refStorage(storage, fullPath);

      await deleteObject(fileRef);
      fileName && Toast.success(`File deleted: ${fileName}`);
    } catch (err) {
      Toast.error(`Error deleting file: ${err}`);
    }
  };
}

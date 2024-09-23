import admin, { ServiceAccount } from "firebase-admin";
import serviceAccount from "../../service-account.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

const db = admin.firestore();

export enum Step {
  identification,
  application,
}

export interface Application {
  id: number;
  date: string;
  ies: string;
  program: string;
}

export interface User {
  identification?: number | null;
  application?: number | null;
  step: Step | null;
  applications?: Application[];
}

export const getUser = async (chatId: number): Promise<User | null> => {
  const reference = db.collection("users").doc(String(chatId));
  const document = await reference.get();
  if (document.exists) {
    return document.data() as User;
  } else {
    return null;
  }
};

export const saveUser = async (
  chatId: number,
  data: {
    application?: number | null;
    applications?: Application[] | null;
    identification?: number | null;
    step?: Step | null;
  },
  merge: boolean = true
) => {
  const reference = db.collection("users").doc(String(chatId));
  await reference.set(data, { merge });
};

export const deleteUser = async (chatId: number) => {
  const reference = db.collection("users").doc(String(chatId));
  await reference.delete();
};

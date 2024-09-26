import admin, { ServiceAccount } from "firebase-admin";
import serviceAccount from "../../service-account.json";
import moment from "moment";

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
  latestStatus?: string;
  latestFetch?: string;
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
  data: Partial<User>,
  merge: boolean = true
) => {
  const reference = db.collection("users").doc(String(chatId));
  await reference.set(data, { merge });
};

export const deleteUser = async (chatId: number) => {
  const reference = db.collection("users").doc(String(chatId));
  await reference.delete();
};

interface UserWithId extends User {
  id: string;
}

export const getUsers = async () => {
  const snapshot = await db
    .collection("users")
    .where("latestFetch", "<", moment().subtract(1, "day").toISOString())
    .where("identification", ">", 0)
    .where("application", ">", 0)
    .limit(10)
    .get();
  const users: UserWithId[] = [];
  snapshot.forEach((doc) => {
    const user = doc.data() as User;
    users.push({
      id: doc.id,
      ...user,
    });
  });
  return users;
};

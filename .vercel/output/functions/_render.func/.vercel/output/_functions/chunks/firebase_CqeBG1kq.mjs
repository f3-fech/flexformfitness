import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
export { default as admin } from 'firebase-admin';

try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split(/\r?\n/).forEach((line) => {
      if (line.trim().startsWith("#") || !line.trim()) return;
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (error) {
  console.warn("Manual env loader warning:", error);
}

if (!admin.apps.length) {
  try {
    const serviceAccountStr = undefined                                         || process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountStr) {
      const serviceAccount = JSON.parse(serviceAccountStr);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      const projectId = "f3-flexformfitness";
      const clientEmail = "firebase-adminsdk-fbsvc@f3-flexformfitness.iam.gserviceaccount.com";
      const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDYX6+pbJhUvhaZ\n4/kJWlMC/3NJxCMjkKB0RFnru9U+6Ud3dDt8vB4jo5InhdapA0h9COgSBO7eWr8S\nx4Y+7W8B7VPvPkzlxeAjw3kYj3li08IbubD0zzQ9PJj61dxuIWpqE19iRmWaCX9Y\n4rHZ9uJ7iKPVsX8Qh0x3743JwfVD5q+Klsj7+JQQD4HDtpMhcGJ42eLHR3DpWfPB\n7L7q6Mju53m2/q+oywmyvesYerUf1oC75/RLIaoh/hvwsm9OwUjr/YjAqdOTalCJ\nr6Q6s+CVxh7yF77j9ZMG3YUUcIXPKeN6QCCEXMLXQbTjJvvU32MwD2YpEF6cW8vj\nQf3IOKYPAgMBAAECggEAVZZ38jESCodMgmACfNgdOPTZ4iZy7dkCFyuIVC5u+h0l\nl1NDSqJQ27ESmY6f7CfvzwGsZqBL6mmD5kZFTHP38o+xoVOH8GW2tP7X5kbCcbyo\nrfXkUNn7ZHOpYaMht/CA2ufB1apZ+zXhiUPWrQyy5sGUaO12gQ+7yD9aWyHdRhdq\nSYiOzxS9/wwXOgy8eulT4Miqre0cTLwLXlG8pufqkGCtIzAguZu2pkTpRm+bajsw\n2/GZNebEeIGZNMJycbH9KBoTbdL43P8/Hmw0jaYYrz5wSLP9BrE5dygy/ednAlpe\nu96CkJa6+7Q+d1wrknWQqdiqeLRwBmYYoI7L104ZZQKBgQDtr50xWB0sUiu9D/js\n0d0n80QyznjAXjx5Xfa5oupi7pL+DhvM7lOztgFEJV1iOUSDd5qqIrCBtAliu/aj\nDQGe+C+8NINUhyj4U5yJlMN9GWMTefXFxrAGi6lFiN7KpmeM0WWy6zUUMXFVo99/\nG+YRiZTz8gTxhT2RuFLc0APvSwKBgQDpC6+b3D+6Czi8pcIE5ioBYLhZiIS42ZmU\nLlFd2b8I0iLnhyjpYINzQe6SJifd+Y8rR22GmWUXeJiGwoe718N/Nih3y2HfwtO5\nQhgwqBNVbNeTskZ29RE1Zdy1PKcOtfnPyBdPN1kXlRQCuGrG5Nukieu/CRni2As9\n6zSHH2a1zQKBgQCIEmSsjiRNblFp8E3yzgaNS4B8kaWhg5GdbcTE69bBgpGWbl9O\nCBbVKFo7OCTpCZ4GoZ9izW89IePJqY/+MoD+EFnLpkiVSLeUytEwFoGACdull8mz\nSxcU+DmU/FGHtJJNlMdjEbKWd+PJQoK90yv4WEp1CdX4qu3fkaWmklPeVwKBgGLa\n6isbSo0IpZCgX6TkXX0oIgsYtfQTmeoZm7pL25VKTjQYSWp13kzN8v1b4h1u9yRM\nsFEgUJmcNlczvZAY/ny/5Hqsc2APrPAw8UHyigD6opesT+e2HQ6hnvXiPJso5kcV\ngY3A1LIEMvDUebbU7bbmKnJm0ew/6MTjOOz4jQEhAoGBAKfub0B6EV5K6zvNCUb1\nN0jTk1QtUYRPIrTxYkKW4+8U5yZrB584Hf9ojFLvBNi7m1KNUjaz20IeLpMs4jei\nrMkiakVXZxfVTNu3+rI4+lpHpZXZ6m4mflzZLAf4v7mF46J1yMxh7neApPllMNjz\nqPy+q/9pjB5vr1H/FiSgZMet\n-----END PRIVATE KEY-----\n";
      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            // Replace escaped newlines with actual newline characters
            privateKey: privateKey.replace(/\\n/g, "\n")
          })
        });
      }
    }
  } catch (error) {
    console.error("Firebase Admin SDK initialization error:", error);
    throw error;
  }
}
const db = admin.firestore();
admin.auth();

export { db };

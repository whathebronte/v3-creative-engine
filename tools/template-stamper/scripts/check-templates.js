// Script to check templates in Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDPCR5YogTe0vq3hJDQO0YSZJ9uAg1Nn3c",
  authDomain: "template-stamper-d7045.firebaseapp.com",
  projectId: "template-stamper-d7045",
  storageBucket: "template-stamper-d7045.firebasestorage.app",
  messagingSenderId: "467854516798",
  appId: "1:467854516798:web:ffb4af2cbb0f8fce698f1c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkTemplates() {
  try {
    console.log('Fetching templates from Firestore...\n');

    const templatesRef = collection(db, 'templates');
    const q = query(templatesRef, where('status', '==', 'active'));
    const querySnapshot = await getDocs(q);

    console.log(`Found ${querySnapshot.size} templates\n`);

    querySnapshot.forEach((doc) => {
      console.log('Template ID:', doc.id);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
      console.log('\n---\n');
    });

    if (querySnapshot.size === 0) {
      console.log('⚠️  No templates found! This explains why the UI is empty.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    process.exit(1);
  }
}

checkTemplates();

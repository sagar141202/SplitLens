import { initializeApp, getApps } from 'firebase/app';

export const firebaseConfig = {
  apiKey:            'AIzaSyDgIh4UisDNYqoEnim4py_rFATYxoKphfc',
  authDomain:        'splitlens-539e7.firebaseapp.com',
  projectId:         'splitlens-539e7',
  storageBucket:     'splitlens-539e7.firebasestorage.app',
  messagingSenderId: '217501293972',
  appId:             '1:217501293972:web:595cfd768c6ac6433ac381',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export default app;

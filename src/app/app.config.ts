import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { routes } from './app.routes';

// ✅ Config directo, sin depender del environment
const firebaseConfig = {
  apiKey: "AIzaSyBhkCvPguTTdP6T-vcbXED_QfyOUIzfS4k",
  authDomain: "gestion-pacientes-2adb8.firebaseapp.com",
  projectId: "gestion-pacientes-2adb8",
  storageBucket: "gestion-pacientes-2adb8.firebasestorage.app",
  messagingSenderId: "969556955557",
  appId: "1:969556955557:web:ba0f3e969d4cd41516d84c"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
};
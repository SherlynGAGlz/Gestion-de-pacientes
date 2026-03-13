import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, 
         signOut, createUserWithEmailAndPassword,
         signInWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { user } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<any>;

  constructor(private auth: Auth, private firestore: Firestore) {
    this.user$ = user(this.auth);
  }

  // ✅ Registro con email y password
  async register(email: string, password: string, nombre: string) {
    try {
      const credential = await createUserWithEmailAndPassword(
        this.auth, email, password
      );

      // Guarda el usuario en Firestore bajo /usuarios/{uid}
      await setDoc(doc(this.firestore, `usuarios/${credential.user.uid}`), {
        uid: credential.user.uid,
        email: email,
        nombre: nombre,
        creadoEn: new Date()
      });

      return credential;
    } catch (error) {
      throw error;
    }
  }

  // ✅ Login con email y password
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  // ✅ Login con Google (ya lo tenías)
  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }

  logout() {
    return signOut(this.auth);
  }
}
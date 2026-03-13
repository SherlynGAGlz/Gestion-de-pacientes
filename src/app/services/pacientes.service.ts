import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Paciente } from '../models/paciente.models';
import { query, where} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class PacientesService {

  private pacientesCollection;

  constructor(private firestore: Firestore) {
    this.pacientesCollection = collection(this.firestore, 'pacientes');
  }

  getPacientes(userId: string): Observable<Paciente[]> {
  const q = query(
    this.pacientesCollection,
    where('ownerId', '==', userId)
  );

  return collectionData(q, { idField: 'id' }) as Observable<Paciente[]>;
}

  addPaciente(paciente: Paciente): Promise<any> {
    // Aquí NO agregamos fecha extra
    return addDoc(this.pacientesCollection, paciente);
  }

  updatePaciente(id: string, paciente: Partial<Paciente>): Promise<void> {
    const pacienteDoc = doc(this.firestore, `pacientes/${id}`);
    return updateDoc(pacienteDoc, paciente);
  }

  deletePaciente(id: string): Promise<void> {
    const pacienteDoc = doc(this.firestore, `pacientes/${id}`);
    return deleteDoc(pacienteDoc);
  }
}
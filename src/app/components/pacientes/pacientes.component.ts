import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PacientesService } from '../../services/pacientes.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Paciente } from '../../models/paciente.models';
import { EmailFormatPipe } from '../../pipes/email-format-pipe';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css']
})
export class PacientesComponent implements OnInit {
  pacienteForm: FormGroup;
  pacientes: Paciente[] = [];
  editingId: string | null = null;
  currentUser: User | null = null;
  readonly soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

  // Búsqueda y filtros
  searchTerm: string = '';
  sortField: string = 'nombre';
  sortOrder: string = 'asc';

  // Paginación
  currentPage: number = 1;
  pageSize: number = 5;
  filteredPacientes: Paciente[] = [];
  paginatedPacientes: Paciente[] = [];

  get totalPages(): number {
    return Math.ceil(this.filteredPacientes.length / this.pageSize) || 1;
  }

  constructor(
    private fb: FormBuilder,
    private pacientesService: PacientesService,
    private authService: AuthService,
    private router: Router,
    private auth: Auth,
  ) {
    this.pacienteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80), Validators.pattern(this.soloLetrasRegex)]],
      apellidos: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200), Validators.pattern(this.soloLetrasRegex)]],
      fechaNacimiento: ['', Validators.required],
      domicilio: ['', Validators.required],
      correoElectronico: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (!user) { console.log("Usuario no autenticado"); return; }
      this.currentUser = user;
      this.pacientesService.getPacientes(user.uid).subscribe({
        next: (data) => { this.pacientes = data; this.applyFilters(); },
        error: (error) => console.error('Error al cargar pacientes:', error)
      });
    });
  }

  onSearch() { this.currentPage = 1; this.applyFilters(); }
  onSort() { this.currentPage = 1; this.applyFilters(); }
  onPageSizeChange() { this.currentPage = 1; this.applyFilters(); }
  clearSearch() { this.searchTerm = ''; this.currentPage = 1; this.applyFilters(); }

  applyFilters() {
    let result = [...this.pacientes];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        p.apellidos.toLowerCase().includes(term) ||
        p.correoElectronico.toLowerCase().includes(term)
      );
    }
    result.sort((a, b) => {
      let valA: any = (a as any)[this.sortField];
      let valB: any = (b as any)[this.sortField];
      if (this.sortField === 'fechaNacimiento') {
        valA = this.formatFecha(valA)?.getTime() ?? 0;
        valB = this.formatFecha(valB)?.getTime() ?? 0;
      } else {
        valA = valA?.toString().toLowerCase() ?? '';
        valB = valB?.toString().toLowerCase() ?? '';
      }
      if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    this.filteredPacientes = result;
    this.updatePage();
  }

  updatePage() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedPacientes = this.filteredPacientes.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePage();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  onSubmit() {
    if (!this.currentUser) { alert("Usuario no autenticado"); return; }
    if (this.pacienteForm.invalid) { this.markFormGroupTouched(this.pacienteForm); return; }
    const paciente: Paciente = {
      nombre: this.pacienteForm.value.nombre,
      apellidos: this.pacienteForm.value.apellidos,
      fechaNacimiento: new Date(this.pacienteForm.value.fechaNacimiento),
      domicilio: this.pacienteForm.value.domicilio,
      correoElectronico: this.pacienteForm.value.correoElectronico,
      ownerId: this.currentUser.uid
    };
    if (this.editingId) { this.updatePaciente(paciente); } else { this.addPaciente(paciente); }
  }

  addPaciente(paciente: Paciente) {
    this.pacientesService.addPaciente(paciente)
      .then(() => { alert('✅ Paciente agregado exitosamente'); this.resetForm(); })
      .catch(() => alert('❌ Error al agregar el paciente'));
  }

  updatePaciente(paciente: Paciente) {
    if (this.editingId) {
      this.pacientesService.updatePaciente(this.editingId, paciente)
        .then(() => { alert('✅ Paciente actualizado exitosamente'); this.resetForm(); })
        .catch(() => alert('❌ Error al actualizar el paciente'));
    }
  }

  editPaciente(paciente: Paciente) {
    this.editingId = paciente.id || null;
    this.pacienteForm.patchValue({
      nombre: paciente.nombre,
      apellidos: paciente.apellidos,
      fechaNacimiento: this.formatDateForInput(paciente.fechaNacimiento),
      domicilio: paciente.domicilio,
      correoElectronico: paciente.correoElectronico
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deletePaciente(id: string | undefined) {
    if (!id) return;
    if (confirm('¿Estás seguro de eliminar este paciente?')) {
      this.pacientesService.deletePaciente(id)
        .then(() => alert('✅ Paciente eliminado exitosamente'))
        .catch(() => alert('❌ Error al eliminar el paciente'));
    }
  }

  resetForm() { this.pacienteForm.reset(); this.editingId = null; }

  formatDateForInput(date: any): string {
    if (date instanceof Date) return date.toISOString().split('T')[0];
    if (date?.toDate) return date.toDate().toISOString().split('T')[0];
    return '';
  }

  formatFecha(fecha: any): Date | null {
    if (!fecha) return null;
    if (fecha.seconds) return new Date(fecha.seconds * 1000);
    return new Date(fecha);
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => formGroup.get(key)?.markAsTouched());
  }

  logout() { this.authService.logout().then(() => this.router.navigate(['/login'])); }
}
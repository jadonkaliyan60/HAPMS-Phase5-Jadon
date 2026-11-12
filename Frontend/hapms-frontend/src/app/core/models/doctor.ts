export interface Doctor {
  readonly id: string;
  readonly fullName: string;
  readonly department: string;
  readonly room: string;
  readonly location: string;
  readonly durationMinutes: number;
}

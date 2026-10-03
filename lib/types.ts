import type { EventType } from "./eventType";
import type { WorkType } from "./workType";

export type Skill = {
  id: string;
  name: string;
};

export type PersonSkill = {
  personId: string;
  skillId: string;
  skill: Skill;
};

export type Vacation = {
  id: string;
  personId: string;
  startDate: string;
  endDate: string;
  note: string | null;
  createdAt: string;
  person?: { id: string; name: string };
};

export type Person = {
  id: string;
  name: string;
  color: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  skills: PersonSkill[];
  vacations: Vacation[];
};

export type Assignment = {
  id: string;
  eventId: string;
  personId: string;
  isLead: boolean;
  roles: EventType[];
  workTypes: WorkType[];
  person: Person;
};

export type VehicleService = {
  id: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
};

export type Vehicle = {
  id: string;
  name: string;
  plateNumber: string | null;
  type: string | null;
  capacity: string | null;
  inspectionDate: string | null;
  insuranceDate: string | null;
  note: string | null;
  createdAt: string;
  serviceBlocks: VehicleService[];
  notes: VehicleNote[];
};

export type VehicleNote = {
  id: string;
  vehicleId: string;
  text: string;
  createdAt: string;
  resolvedAt: string | null;
};

export type VehicleAssignment = {
  id: string;
  eventId: string;
  vehicleId: string;
  vehicle: Vehicle;
};

export type EventTask = {
  id: string;
  eventId: string;
  text: string;
  done: boolean;
  assigneeId: string | null;
  assignee: { id: string; name: string } | null;
  dueDate: string | null;
  createdAt: string;
};

export type Event = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  color: string | null;
  groupId: string | null;
  eventTypes: EventType[];
  loadingEnabled: boolean;
  loadingTime: string | null;
  transportEnabled: boolean;
  transportVehicleId: string | null;
  transportVehicle: Vehicle | null;
  notes: string | null;
  managerNote: string | null;
  assignments: Assignment[];
  vehicleAssignments: VehicleAssignment[];
  tasks: EventTask[];
};

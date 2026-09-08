export type Skill = {
  id: string;
  name: string;
};

export type PersonSkill = {
  personId: string;
  skillId: string;
  skill: Skill;
};

export type Person = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  skills: PersonSkill[];
};

export type Assignment = {
  id: string;
  eventId: string;
  personId: string;
  isLead: boolean;
  person: Person;
};

export type Event = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  color: string | null;
  groupId: string | null;
  loadingEnabled: boolean;
  loadingTime: string | null;
  transportEnabled: boolean;
  transportVehicle: string | null;
  assignments: Assignment[];
};

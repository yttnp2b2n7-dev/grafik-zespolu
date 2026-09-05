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
  person: Person;
};

export type EventDay = {
  id: string;
  eventId: string;
  startsAt: string;
  endsAt: string;
};

export type Event = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  color: string | null;
  assignments: Assignment[];
  days: EventDay[];
};

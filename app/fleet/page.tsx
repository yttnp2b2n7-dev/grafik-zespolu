"use client";

import { useEffect, useState } from "react";
import { format, startOfDay } from "date-fns";
import { pl } from "date-fns/locale";
import type { Vehicle, VehicleService } from "@/lib/types";
import { fetchJsonOrNull } from "@/lib/clientFetch";
import { parseLocalDate } from "@/lib/localDate";
import { useUndo } from "@/lib/undo-context";
import { usePolling } from "@/lib/usePolling";
import { getExpiryStatus, type ExpiryStatus } from "@/lib/vehicleExpiry";
import { useSession } from "../session-context";
import { VehicleNotes } from "./VehicleNotes";

function ExpiryBadge({ label, date }: { label: string; date: string | null }) {
  const status = getExpiryStatus(date);
  if (!date || !status) return null;

  const styles: Record<ExpiryStatus, string> = {
    expired: "bg-danger/15 text-danger",
    soon: "bg-amber-500/15 text-amber-600",
    ok: "bg-background text-muted",
  };
  const text: Record<ExpiryStatus, string> = {
    expired: "przeterminowany",
    soon: "kończy się",
    ok: "ważny",
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${styles[status]}`}>
      {label}: {format(new Date(date), "d MMM yyyy", { locale: pl })} ({text[status]})
    </span>
  );
}

function hasOpenIssues(vehicle: Vehicle) {
  return vehicle.notes.some((n) => !n.resolvedAt);
}

export default function FleetPage() {
  const pushUndo = useUndo();
  const { role, loading: sessionLoading } = useSession();
  const isVisitor = role === "visitor";
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [newType, setNewType] = useState("");
  const [newCapacity, setNewCapacity] = useState("");
  const [newInspection, setNewInspection] = useState("");
  const [newInsurance, setNewInsurance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function loadVehicles() {
    const data = await fetchJsonOrNull<Vehicle[]>("/api/vehicles");
    if (data) setVehicles(data);
    setLoading(false);
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  usePolling(loadVehicles, 15000);

  const searchQuery = search.trim().toLowerCase();
  // Cars with unresolved notes go to the top, so problems aren't buried.
  const filteredVehicles = vehicles
    .filter(
      (v) =>
        v.name.toLowerCase().includes(searchQuery) ||
        (v.plateNumber ?? "").toLowerCase().includes(searchQuery)
    )
    .sort(
      (a, b) =>
        Number(hasOpenIssues(b)) - Number(hasOpenIssues(a)) ||
        a.name.localeCompare(b.name, "pl")
    );

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = newName.trim();
    if (!name) return;
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        plateNumber: newPlate.trim() || null,
        type: newType.trim() || null,
        capacity: newCapacity.trim() || null,
        inspectionDate: newInspection ? parseLocalDate(newInspection).toISOString() : null,
        insuranceDate: newInsurance ? parseLocalDate(newInsurance).toISOString() : null,
      }),
    });
    if (!res.ok) {
      setError("Nie udało się dodać pojazdu");
      return;
    }
    setNewName("");
    setNewPlate("");
    setNewType("");
    setNewCapacity("");
    setNewInspection("");
    setNewInsurance("");
    await loadVehicles();
  }

  async function removeVehicle(id: string) {
    const removed = vehicles.find((v) => v.id === id);
    await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    setVehicles((prev) => prev.filter((v) => v.id !== id));

    if (removed) {
      pushUndo({
        label: `Usunięto pojazd „${removed.name}”`,
        restore: async () => {
          await fetch("/api/vehicles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: removed.name,
              plateNumber: removed.plateNumber,
              type: removed.type,
              capacity: removed.capacity,
              inspectionDate: removed.inspectionDate,
              insuranceDate: removed.insuranceDate,
              note: removed.note,
            }),
          });
          await loadVehicles();
        },
      });
    }
  }

  async function updateVehicle(
    id: string,
    data: {
      name: string;
      plateNumber: string | null;
      type: string | null;
      capacity: string | null;
      inspectionDate: string | null;
      insuranceDate: string | null;
      note: string | null;
    }
  ) {
    const res = await fetch(`/api/vehicles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return false;
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
    return true;
  }

  async function sendToService(vehicleId: string, startDate: string, endDate: string) {
    const res = await fetch("/api/vehicle-service", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId,
        startDate: parseLocalDate(startDate).toISOString(),
        endDate: parseLocalDate(endDate).toISOString(),
      }),
    });
    if (!res.ok) return false;
    const block: VehicleService = await res.json();
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId ? { ...v, serviceBlocks: [...v.serviceBlocks, block] } : v
      )
    );
    return true;
  }

  async function cancelService(vehicleId: string, blockId: string) {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? { ...v, serviceBlocks: v.serviceBlocks.filter((b) => b.id !== blockId) }
          : v
      )
    );
    await fetch(`/api/vehicle-service/${blockId}`, { method: "DELETE" });
  }

  async function addNote(vehicleId: string, text: string) {
    const res = await fetch("/api/vehicle-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId, text }),
    });
    if (!res.ok) return false;
    await loadVehicles();
    return true;
  }

  async function resolveNote(noteId: string, resolved: boolean) {
    await fetch(`/api/vehicle-notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved }),
    });
    await loadVehicles();
  }

  // Until the role is known, don't flash the admin form to a visitor.
  if (sessionLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm text-muted">Ładowanie…</p>
      </div>
    );
  }

  if (isVisitor) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-xl font-semibold text-foreground">Flota</h1>
        <p className="mt-1 text-sm text-muted">
          Podgląd pojazdów. Jeśli coś wymaga uwagi (np. uszkodzona żarówka,
          potrzebny serwis), dodaj uwagę przy samochodzie.
        </p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj po nazwie lub numerze rejestracyjnym…"
          className="mt-6 w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {loading && <p className="text-sm text-muted">Ładowanie…</p>}
          {!loading && vehicles.length === 0 && (
            <p className="text-sm text-muted">Brak pojazdów.</p>
          )}
          {!loading && vehicles.length > 0 && filteredVehicles.length === 0 && (
            <p className="text-sm text-muted">Brak pojazdów pasujących do wyszukiwania.</p>
          )}
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={`rounded-lg border bg-surface p-4 ${
                hasOpenIssues(vehicle)
                  ? "border-danger/70 shadow-[0_0_0_1px_var(--danger)]"
                  : "border-border-subtle"
              }`}
            >
              <span className="text-sm font-medium text-foreground">{vehicle.name}</span>
            {hasOpenIssues(vehicle) && (
              <span className="ml-2 whitespace-nowrap rounded-full bg-danger/15 px-2 py-0.5 text-xs text-danger">
                Nienaprawione uwagi
              </span>
            )}
              <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted">
                {vehicle.plateNumber && <span>{vehicle.plateNumber}</span>}
                {vehicle.type && <span>· {vehicle.type}</span>}
                {vehicle.capacity && <span>· {vehicle.capacity}</span>}
              </div>
              <VehicleNotes
                notes={vehicle.notes}
                canResolve={false}
                onAdd={(text) => addNote(vehicle.id, text)}
                onResolve={() => {}}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-xl font-semibold text-foreground">Flota</h1>
      <p className="mt-1 text-sm text-muted">
        Dodawaj pojazdy i śledź terminy przeglądów oraz ubezpieczeń, żeby móc
        przypisywać je do wydarzeń w grafiku.
      </p>

      <form
        onSubmit={addVehicle}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-border-subtle bg-surface p-4"
      >
        <div className="flex min-w-[180px] flex-1 flex-col gap-1">
          <label className="text-xs text-muted">Nazwa</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="np. Bus Ford Transit"
            className="rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex min-w-[120px] flex-col gap-1">
          <label className="text-xs text-muted">Nr rejestracyjny</label>
          <input
            value={newPlate}
            onChange={(e) => setNewPlate(e.target.value)}
            className="rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex min-w-[120px] flex-col gap-1">
          <label className="text-xs text-muted">Typ (opcjonalnie)</label>
          <input
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="np. bus, przyczepa"
            className="rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex min-w-[120px] flex-col gap-1">
          <label className="text-xs text-muted">Ładowność (opcjonalnie)</label>
          <input
            value={newCapacity}
            onChange={(e) => setNewCapacity(e.target.value)}
            placeholder="np. 9 osób"
            className="rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Przegląd do</label>
          <input
            type="date"
            value={newInspection}
            onChange={(e) => setNewInspection(e.target.value)}
            className="rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Ubezpieczenie do</label>
          <input
            type="date"
            value={newInsurance}
            onChange={(e) => setNewInsurance(e.target.value)}
            className="rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          Dodaj pojazd
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Szukaj po nazwie lub numerze rejestracyjnym…"
        className="mt-4 w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {loading && <p className="text-sm text-muted">Ładowanie…</p>}
        {!loading && vehicles.length === 0 && (
          <p className="text-sm text-muted">Brak pojazdów. Dodaj pierwszy powyżej.</p>
        )}
        {!loading && vehicles.length > 0 && filteredVehicles.length === 0 && (
          <p className="text-sm text-muted">Brak pojazdów pasujących do wyszukiwania.</p>
        )}
        {filteredVehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            onRemove={() => removeVehicle(vehicle.id)}
            onSave={(data) => updateVehicle(vehicle.id, data)}
            onSendToService={(startDate, endDate) =>
              sendToService(vehicle.id, startDate, endDate)
            }
            onCancelService={(blockId) => cancelService(vehicle.id, blockId)}
            onAddNote={(text) => addNote(vehicle.id, text)}
            onResolveNote={resolveNote}
          />
        ))}
      </div>
    </div>
  );
}

function ServiceBadge({
  block,
  onCancel,
}: {
  block: VehicleService;
  onCancel: () => void;
}) {
  const active =
    startOfDay(new Date()).getTime() >= startOfDay(new Date(block.startDate)).getTime() &&
    startOfDay(new Date()).getTime() <= startOfDay(new Date(block.endDate)).getTime();

  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
        active ? "bg-danger/15 text-danger" : "bg-background text-muted"
      }`}
    >
      {active ? "W serwisie" : "Zaplanowany serwis"}:{" "}
      {format(new Date(block.startDate), "d MMM", { locale: pl })} –{" "}
      {format(new Date(block.endDate), "d MMM yyyy", { locale: pl })}
      <button
        onClick={onCancel}
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-current/70 hover:bg-black/10"
        aria-label="Anuluj serwis"
      >
        ×
      </button>
    </span>
  );
}

function VehicleCard({
  vehicle,
  onRemove,
  onSave,
  onSendToService,
  onCancelService,
  onAddNote,
  onResolveNote,
}: {
  vehicle: Vehicle;
  onAddNote: (text: string) => Promise<boolean>;
  onResolveNote: (noteId: string, resolved: boolean) => void;
  onRemove: () => void;
  onSave: (data: {
    name: string;
    plateNumber: string | null;
    type: string | null;
    capacity: string | null;
    inspectionDate: string | null;
    insuranceDate: string | null;
    note: string | null;
  }) => Promise<boolean>;
  onSendToService: (startDate: string, endDate: string) => Promise<boolean>;
  onCancelService: (blockId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSendingToService, setIsSendingToService] = useState(false);
  const [serviceStart, setServiceStart] = useState("");
  const [serviceEnd, setServiceEnd] = useState("");
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState(vehicle.name);
  const [plateInput, setPlateInput] = useState(vehicle.plateNumber ?? "");
  const [typeInput, setTypeInput] = useState(vehicle.type ?? "");
  const [capacityInput, setCapacityInput] = useState(vehicle.capacity ?? "");
  const [inspectionInput, setInspectionInput] = useState(
    vehicle.inspectionDate ? format(new Date(vehicle.inspectionDate), "yyyy-MM-dd") : ""
  );
  const [insuranceInput, setInsuranceInput] = useState(
    vehicle.insuranceDate ? format(new Date(vehicle.insuranceDate), "yyyy-MM-dd") : ""
  );
  const [noteInput, setNoteInput] = useState(vehicle.note ?? "");
  const [saveError, setSaveError] = useState(false);

  function startEditing() {
    setNameInput(vehicle.name);
    setPlateInput(vehicle.plateNumber ?? "");
    setTypeInput(vehicle.type ?? "");
    setCapacityInput(vehicle.capacity ?? "");
    setInspectionInput(
      vehicle.inspectionDate ? format(new Date(vehicle.inspectionDate), "yyyy-MM-dd") : ""
    );
    setInsuranceInput(
      vehicle.insuranceDate ? format(new Date(vehicle.insuranceDate), "yyyy-MM-dd") : ""
    );
    setNoteInput(vehicle.note ?? "");
    setSaveError(false);
    setIsEditing(true);
  }

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    const ok = await onSave({
      name: trimmed,
      plateNumber: plateInput.trim() || null,
      type: typeInput.trim() || null,
      capacity: capacityInput.trim() || null,
      inspectionDate: inspectionInput ? parseLocalDate(inspectionInput).toISOString() : null,
      insuranceDate: insuranceInput ? parseLocalDate(insuranceInput).toISOString() : null,
      note: noteInput.trim() || null,
    });
    if (ok) {
      setIsEditing(false);
    } else {
      setSaveError(true);
    }
  }

  async function submitService(e: React.FormEvent) {
    e.preventDefault();
    setServiceError(null);
    if (!serviceStart || !serviceEnd) return;
    if (parseLocalDate(serviceEnd) < parseLocalDate(serviceStart)) {
      setServiceError("Data „do” nie może być wcześniejsza niż data „od”.");
      return;
    }
    const ok = await onSendToService(serviceStart, serviceEnd);
    if (ok) {
      setServiceStart("");
      setServiceEnd("");
      setIsSendingToService(false);
    } else {
      setServiceError("Nie udało się zablokować pojazdu.");
    }
  }

  return (
    <div
      className={`rounded-lg border bg-surface p-4 ${
        hasOpenIssues(vehicle)
          ? "border-danger/70 shadow-[0_0_0_1px_var(--danger)]"
          : "border-border-subtle"
      }`}
    >
      {isEditing ? (
        <form onSubmit={submitDetails} className="flex flex-col gap-2">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Nazwa"
            autoFocus
            className="w-full rounded-md border border-border-subtle bg-background px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none"
          />
          <input
            value={plateInput}
            onChange={(e) => setPlateInput(e.target.value)}
            placeholder="Nr rejestracyjny"
            className="w-full rounded-md border border-border-subtle bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <input
            value={typeInput}
            onChange={(e) => setTypeInput(e.target.value)}
            placeholder="Typ"
            className="w-full rounded-md border border-border-subtle bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <input
            value={capacityInput}
            onChange={(e) => setCapacityInput(e.target.value)}
            placeholder="Ładowność"
            className="w-full rounded-md border border-border-subtle bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs text-muted">Przegląd do</label>
              <input
                type="date"
                value={inspectionInput}
                onChange={(e) => setInspectionInput(e.target.value)}
                className="w-full rounded-md border border-border-subtle bg-background px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs text-muted">Ubezpieczenie do</label>
              <input
                type="date"
                value={insuranceInput}
                onChange={(e) => setInsuranceInput(e.target.value)}
                className="w-full rounded-md border border-border-subtle bg-background px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <input
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Notatka"
            className="w-full rounded-md border border-border-subtle bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="text-xs text-accent-hover transition hover:underline"
            >
              Zapisz
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-muted transition hover:text-foreground"
            >
              Anuluj
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between">
          <div>
            <span className="text-sm font-medium text-foreground">{vehicle.name}</span>
            {hasOpenIssues(vehicle) && (
              <span className="ml-2 whitespace-nowrap rounded-full bg-danger/15 px-2 py-0.5 text-xs text-danger">
                Nienaprawione uwagi
              </span>
            )}
            <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted">
              {vehicle.plateNumber && <span>{vehicle.plateNumber}</span>}
              {vehicle.type && <span>· {vehicle.type}</span>}
              {vehicle.capacity && <span>· {vehicle.capacity}</span>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={() => setIsSendingToService((prev) => !prev)}
              className="text-xs text-muted transition hover:text-accent-hover"
            >
              Wyślij na serwis
            </button>
            <button
              onClick={startEditing}
              className="text-xs text-muted transition hover:text-accent-hover"
            >
              Edytuj
            </button>
            <button
              onClick={onRemove}
              className="text-xs text-muted transition hover:text-danger"
            >
              Usuń
            </button>
          </div>
        </div>
      )}
      {saveError && (
        <p className="mt-1 text-xs text-danger">Nie udało się zapisać zmiany.</p>
      )}

      {!isEditing && isSendingToService && (
        <form
          onSubmit={submitService}
          className="mt-3 flex flex-wrap items-end gap-2 rounded-md border border-border-subtle bg-background p-2.5"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Od</label>
            <input
              type="date"
              value={serviceStart}
              onChange={(e) => setServiceStart(e.target.value)}
              required
              className="rounded-md border border-border-subtle bg-surface px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Do</label>
            <input
              type="date"
              value={serviceEnd}
              onChange={(e) => setServiceEnd(e.target.value)}
              required
              className="rounded-md border border-border-subtle bg-surface px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white transition hover:bg-accent-hover"
          >
            Zablokuj
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSendingToService(false);
              setServiceError(null);
            }}
            className="text-xs text-muted transition hover:text-foreground"
          >
            Anuluj
          </button>
          {serviceError && (
            <p className="w-full text-xs text-danger">{serviceError}</p>
          )}
        </form>
      )}

      {!isEditing && (vehicle.inspectionDate || vehicle.insuranceDate) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <ExpiryBadge label="Przegląd" date={vehicle.inspectionDate} />
          <ExpiryBadge label="Ubezpieczenie" date={vehicle.insuranceDate} />
        </div>
      )}
      {!isEditing && vehicle.serviceBlocks.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {vehicle.serviceBlocks.map((block) => (
            <ServiceBadge
              key={block.id}
              block={block}
              onCancel={() => onCancelService(block.id)}
            />
          ))}
        </div>
      )}
      {!isEditing && vehicle.note && (
        <p className="mt-2 text-xs text-muted">{vehicle.note}</p>
      )}
      {!isEditing && (
        <VehicleNotes
          notes={vehicle.notes}
          canResolve
          onAdd={onAddNote}
          onResolve={onResolveNote}
        />
      )}
    </div>
  );
}

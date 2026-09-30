export function parseLoadingTransportInput(body: Record<string, unknown>) {
  const loadingEnabled = body.loadingEnabled === true;
  const loadingTime =
    loadingEnabled && typeof body.loadingTime === "string" && body.loadingTime.trim()
      ? body.loadingTime.trim()
      : null;

  const transportEnabled = body.transportEnabled === true;
  const transportVehicleId =
    transportEnabled && typeof body.transportVehicleId === "string" && body.transportVehicleId
      ? body.transportVehicleId
      : null;

  return { loadingEnabled, loadingTime, transportEnabled, transportVehicleId };
}

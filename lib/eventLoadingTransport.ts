export function parseLoadingTransportInput(body: Record<string, unknown>) {
  const loadingEnabled = body.loadingEnabled === true;
  const loadingTime =
    loadingEnabled && typeof body.loadingTime === "string" && body.loadingTime.trim()
      ? body.loadingTime.trim()
      : null;

  const transportEnabled = body.transportEnabled === true;
  const transportVehicle =
    transportEnabled &&
    typeof body.transportVehicle === "string" &&
    body.transportVehicle.trim()
      ? body.transportVehicle.trim()
      : null;

  return { loadingEnabled, loadingTime, transportEnabled, transportVehicle };
}

function errorName(error: unknown) {
  if (typeof error === "object" && error && "name" in error) {
    const name = (error as { name?: unknown }).name;
    return typeof name === "string" ? name : "";
  }
  return "";
}

export function isMissingMediaDevice(error: unknown) {
  const name = errorName(error);
  const message = error instanceof Error ? error.message : "";
  return (
    name === "NotFoundError" ||
    name === "DevicesNotFoundError" ||
    message.includes("Requested device not found")
  );
}

/** A missing, blocked, or busy device is a prompt, not a class failure. */
export function isExpectedMediaIssue(error: unknown) {
  const name = errorName(error);
  return (
    isMissingMediaDevice(error) ||
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    name === "NotReadableError" ||
    name === "TrackStartError"
  );
}

/**
 * True when the browser already lists inputs and this kind is absent.
 * Null means the browser has not revealed its devices yet.
 */
export async function listedDeviceAvailable(kind: "audioinput" | "videoinput") {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return null;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    if (devices.some((device) => device.kind === kind)) return true;
    // Before permission, browsers often hide the real device list. Try the camera anyway.
    const permissionGranted = devices.some((device) => device.label.trim().length > 0);
    return permissionGranted ? false : null;
  } catch {
    return null;
  }
}

export function mediaDeviceMessage(error: unknown, kind: "microphone" | "camera") {
  const name = errorName(error);
  if (isMissingMediaDevice(error)) {
    return kind === "camera"
      ? "No camera was found. You can stay in the class with the camera off."
      : "No microphone was found. You can stay in the class with the microphone off.";
  }
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return kind === "camera"
      ? "The browser blocked the camera. You can stay in the class with it off."
      : "The browser blocked the microphone. You can stay in the class with it off.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return kind === "camera"
      ? "The camera is already in use by another app."
      : "The microphone is already in use by another app.";
  }
  return kind === "camera" ? "Could not turn the camera on" : "Could not turn the microphone on";
}

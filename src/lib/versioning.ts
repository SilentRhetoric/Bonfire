export function checkAndUpdateVersion() {
  const currentVersion = "1.1.1"
  const storedVersion = localStorage.getItem("version")

  if (storedVersion !== currentVersion) {
    // Clear all local storage
    localStorage.clear()

    // Set the new version
    localStorage.setItem("version", currentVersion)
  }
}

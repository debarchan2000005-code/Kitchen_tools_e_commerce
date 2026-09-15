export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("This browser doesn't support notifications.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export function showOrderNotification(
  title: string,
  body: string
) {
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body,
    icon: "/favicon.ico", // we'll improve this later
    badge: "/favicon.ico",
  });
}
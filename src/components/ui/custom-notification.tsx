import { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface Notification {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
}

let notificationListeners: ((notification: Notification) => void)[] = [];
let notificationId = 0;

export const notify = (message: string, type: "success" | "error" | "info" = "info") => {
  const notification: Notification = {
    id: `notification-${notificationId++}`,
    message,
    type,
  };
  notificationListeners.forEach((listener) => listener(notification));
};

export const CustomNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleNotification = (notification: Notification) => {
      setNotifications((prev) => [...prev, notification]);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 3000);
    };

    notificationListeners.push(handleNotification);

    return () => {
      notificationListeners = notificationListeners.filter((l) => l !== handleNotification);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto animate-in slide-in-from-top duration-300"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div
            className={`
              rounded-xl px-6 py-3 shadow-2xl backdrop-blur-sm flex items-center gap-3 max-w-md
              ${
                notification.type === "success"
                  ? "bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white"
                  : notification.type === "error"
                  ? "bg-gradient-to-r from-red-500/90 to-pink-500/90 text-white"
                  : "bg-gradient-to-r from-blue-500/90 to-purple-500/90 text-white"
              }
            `}
          >
            <span className="text-2xl">
              {notification.type === "success" ? "✨" : notification.type === "error" ? "⚠️" : "ℹ️"}
            </span>
            <p className="flex-1 font-medium">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="hover:scale-110 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

import { toast } from "sonner";

type NotificationOptions = {
  message: string;
  description?: string | React.ReactNode;
};

export const showNotification = {
  success: ({ message, description }: NotificationOptions) =>
    toast.success(message, {
      description,
    }),
  error: ({ message, description }: NotificationOptions) =>
    toast.error(message, {
      description,
    }),
  warning: ({ message, description }: NotificationOptions) =>
    toast.warning(message, {
      description,
    }),
  info: ({ message, description }: NotificationOptions) =>
    toast.info(message, {
      description,
    }),
};

// For backward compatibility
export function NotificationBanner({
  type,
  message,
  children,
}: {
  type: "success" | "error" | "warning";
  message: string;
  children?: React.ReactNode;
}) {
  const styles = {
    success:
      "border-green-200 bg-green-50 text-green-900 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-200",
    error:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200",
    warning:
      "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-200",
  };

  return (
    <div className={`mt-4 rounded-lg border p-4 ${styles[type]}`}>
      <p>{message}</p>
      {children}
    </div>
  );
}

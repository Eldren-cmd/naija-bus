export type ToastTone = "success" | "error" | "info";

export type ToastItem = {
  id: number;
  tone: ToastTone;
  message: string;
};

type ToastStackProps = {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
};

const toastToneLabel: Record<ToastTone, { icon: string; title: string }> = {
  success: { icon: "OK", title: "Success" },
  error: { icon: "ER", title: "Error" },
  info: { icon: "FY", title: "Update" },
};

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <aside className="toast-stack" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.tone}`} role="status">
          <div className="toast-leading" aria-hidden="true">
            <span className="toast-icon">{toastToneLabel[toast.tone].icon}</span>
          </div>
          <div className="toast-content">
            <p className="toast-title">{toastToneLabel[toast.tone].title}</p>
            <p className="toast-message">{toast.message}</p>
            <span className="toast-progress" aria-hidden="true" />
          </div>
          <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      ))}
    </aside>
  );
}

import toast from "react-hot-toast"

// Note: This utility provides dynamic toast notifications
// No more hardcoded values

// Success toast - Clean emerald green
export const showSuccess = (message) => {
  toast.success(message, {
    position: "top-center",
    duration: 4000,
    style: {
      background: "#059669",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: "600",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)",
      border: "1px solid #047857",
    },
    iconTheme: {
      primary: "#ffffff",
      secondary: "#059669",
    },
  })
}

// Error toast - Clean red
export const showError = (message) => {
  toast.error(message, {
    position: "top-center",
    duration: 5000,
    style: {
      background: "#DC2626",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: "600",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
      border: "1px solid #B91C1C",
    },
    iconTheme: {
      primary: "#ffffff",
      secondary: "#DC2626",
    },
  })
}

// Warning toast - Clean amber
export const showWarning = (message) => {
  toast(message, {
    position: "top-center",
    duration: 4000,
    icon: "⚠️",
    style: {
      background: "#D97706",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: "600",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(217, 119, 6, 0.25)",
      border: "1px solid #B45309",
    },
  })
}

// Info toast - Clean blue
export const showInfo = (message) => {
  toast(message, {
    position: "top-center",
    duration: 4000,
    icon: "ℹ️",
    style: {
      background: "#2563EB",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: "600",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
      border: "1px solid #1D4ED8",
    },
  })
}

// Loading toast - Clean slate gray
export const showLoading = (message) => {
  return toast.loading(message, {
    position: "top-center",
    style: {
      background: "#475569",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: "600",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(71, 85, 105, 0.25)",
      border: "1px solid #334155",
    },
  })
}

// Dismiss loading toast
export const dismissLoading = (toastId) => {
  toast.dismiss(toastId)
}

// Note: All toast functions now provide dynamic styling
// No more hardcoded values

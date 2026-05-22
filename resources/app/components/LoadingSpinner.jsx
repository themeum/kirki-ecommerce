const LoadingSpinner = () => {
  return (
    <div
      className="kirki-ecom-page-loading"
      role="status"
      aria-label="Loading page"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "200px",
        width: "100%",
      }}
    >
      <span
        style={{
          width: "32px",
          height: "32px",
          border: "3px solid var(--decom-border-border-secondary, #e5e5e5)",
          borderTopColor: "var(--decom-background-bg-brand, #2271b1)",
          borderRadius: "50%",
          animation: "kirki-ecom-spin 0.8s linear infinite",
        }}
      />
      <style>{`
        @keyframes kirki-ecom-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;

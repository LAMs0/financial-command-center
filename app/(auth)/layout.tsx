export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[image:var(--app-shell-bg)] text-text-primary">
      {children}
    </div>
  );
}

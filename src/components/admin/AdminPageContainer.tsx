export default function AdminPageContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-[1600px] mx-auto px-6 py-8 md:px-10 lg:px-12 ${className}`}>
      {children}
    </div>
  );
}

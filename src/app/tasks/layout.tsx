import ProtectedRoute from "@/components/ProtectedRoute";

export default function TasksLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
}
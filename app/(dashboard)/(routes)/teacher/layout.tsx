import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const TeacherLayout = async ({
  children
}: {
  children: React.ReactNode;
}) => {
  const { session } = await auth();
  if (!session) redirect("/sign-in");
  if (session.role !== "TEACHER") redirect("/");
  return <>{children}</>
}
 
export default TeacherLayout;

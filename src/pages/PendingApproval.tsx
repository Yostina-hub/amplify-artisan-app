import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const PendingApproval = () => {
  const { signOut, user, roles } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Pending Approval | Amplify Artisan";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Account pending approval for access to Amplify Artisan dashboard");
  }, []);

  useEffect(() => {
    if (roles.length > 0) {
      navigate('/');
    }
  }, [roles, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <main className="container mx-auto px-4 py-10">
      <section className="max-w-2xl mx-auto">
        <Card className="shadow-sm">
          <CardContent className="space-y-4 pt-6">
            <h1 className="text-2xl font-semibold tracking-tight">Account Pending Approval</h1>
            <p className="text-muted-foreground">
              {user?.email ? (
                <>
                  Thanks for signing up, <span className="font-medium">{user.email}</span>.
                </>
              ) : (
                <>Thanks for signing up.</>
              )}
              {" "}Your account is awaiting admin approval. You’ll get access once a team member assigns a role to your account.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>If this was a mistake, you can sign out and sign in with a different email.</li>
              <li>If you believe this is taking too long, contact an administrator.</li>
            </ul>
            <div className="pt-2">
              <Button variant="outline" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default PendingApproval;

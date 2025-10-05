
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Documents() {
  return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-muted-foreground">Organize and manage your files</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Document management will be available shortly</p>
            <p className="text-sm text-muted-foreground mt-2">Database types are updating...</p>
          </CardContent>
        </Card>
      </div>
    );
}

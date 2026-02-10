import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award } from 'lucide-react';

export default function AdminCertificatesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Certificates</h1>
          <p className="text-muted-foreground">Manage certificates and templates</p>
        </div>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Certificate Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="font-medium">Certificates are not configured yet</div>
                <div className="text-sm text-muted-foreground">
                  Add templates and enable certificate generation.
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button>New Template</Button>
              <Button variant="outline">Learn More</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

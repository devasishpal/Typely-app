import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Award, Calendar, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CertificateProps {
  achievementTitle: string;
  achievementDescription: string;
  earnedDate: string;
}

export default function Certificate({ achievementTitle, achievementDescription, earnedDate }: CertificateProps) {
  const { profile } = useAuth();

  const handleDownload = () => {
    const certificateElement = document.getElementById('certificate-content');
    if (!certificateElement) return;

    // Create a canvas to draw the certificate
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 800;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#4F46E5');
    gradient.addColorStop(1, '#7C3AED');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // White inner rectangle
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);

    // Border
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 10;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

    // Title
    ctx.fillStyle = '#4F46E5';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF ACHIEVEMENT', canvas.width / 2, 150);

    // Decorative line
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(300, 180);
    ctx.lineTo(900, 180);
    ctx.stroke();

    // Achievement title
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(achievementTitle, canvas.width / 2, 280);

    // Description
    ctx.font = '24px Arial';
    ctx.fillStyle = '#6B7280';
    const words = achievementDescription.split(' ');
    let line = '';
    let y = 340;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 800 && i > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[i] + ' ';
        y += 35;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);

    // Awarded to
    ctx.font = 'italic 28px Arial';
    ctx.fillStyle = '#4B5563';
    ctx.fillText('This certificate is awarded to', canvas.width / 2, y + 80);

    // User name
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#1F2937';
    ctx.fillText(profile?.username || 'User', canvas.width / 2, y + 130);

    // Date
    ctx.font = '22px Arial';
    ctx.fillStyle = '#6B7280';
    ctx.fillText(`Earned on ${new Date(earnedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, canvas.width / 2, y + 180);

    // TYPELY branding
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#4F46E5';
    ctx.fillText('TYPELY', canvas.width / 2, canvas.height - 100);

    ctx.font = '18px Arial';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText('Typing Training Platform', canvas.width / 2, canvas.height - 70);

    // Download
    const link = document.createElement('a');
    link.download = `TYPELY_Certificate_${achievementTitle.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <CardContent className="p-0">
        <div
          id="certificate-content"
          className="relative bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 p-12"
        >
          {/* Decorative corners */}
          <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-primary/30 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-primary/30 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-primary/30 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-primary/30 rounded-br-lg" />

          <div className="text-center space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <Award className="w-16 h-16 mx-auto text-primary" />
              <h2 className="text-4xl font-bold gradient-text">CERTIFICATE OF ACHIEVEMENT</h2>
              <div className="w-32 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full" />
            </div>

            {/* Achievement */}
            <div className="space-y-4 py-6">
              <h3 className="text-3xl font-bold text-foreground">{achievementTitle}</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{achievementDescription}</p>
            </div>

            {/* Recipient */}
            <div className="space-y-3 py-4">
              <p className="text-sm text-muted-foreground italic">This certificate is awarded to</p>
              <div className="flex items-center justify-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <p className="text-2xl font-bold text-foreground">{profile?.username || 'User'}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <p className="text-sm">
                Earned on {new Date(earnedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Footer */}
            <div className="pt-6 space-y-2">
              <p className="text-2xl font-bold gradient-text">TYPELY</p>
              <p className="text-sm text-muted-foreground">Typing Training Platform</p>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="p-6 bg-muted/30 flex justify-center">
          <Button onClick={handleDownload} size="lg" className="gap-2">
            <Download className="w-4 h-4" />
            Download Certificate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
